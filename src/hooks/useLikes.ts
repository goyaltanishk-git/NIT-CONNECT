// src/hooks/useLikes.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  getDisplayBio, 
  getDisplayDetails, 
  getDisplayName, 
  getDisplayPhotos, 
  shouldDisplayAnonymously 
} from '@/utils/incognitoUtils';
import { Database } from '@/integrations/supabase/types';
import { encryptedStorage } from "@/utils/encryptedStorage";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  photos: Database["public"]["Tables"]["user_photos"]["Row"][];
  interests: string[];
  prompts: any[]; 
  elo_rating: number | null;
  full_name: string; 
};

export interface PendingLike {
  id: string;
  user_id: string;
  target_user_id: string;
  interaction_type: 'like' | 'superlike' | 'pass' | 'block';
  created_at: string | null;
  profile?: Profile;
}

export function useLikes() {
  const [pendingLikes, setPendingLikes] = useState<PendingLike[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingLikes = useCallback(async () => {
    try {
      setLoading(true);
      const userd = encryptedStorage.get('current-user');
      if (!userd) return;
      const user = JSON.parse(userd);

      // STEP 1: Fetch interactions
      const { data: interactions, error: intError } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('target_user_id', user.email)
        .in('interaction_type', ['like', 'superlike'])
        .order('created_at', { ascending: false });

      if (intError || !interactions || interactions.length === 0) {
        setPendingLikes([]);
        return;
      }

      // STEP 2: Filter out existing mutual matches
      const { data: matches } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.email},user2_id.eq.${user.email}`);

      const matchedUserIds = new Set(
        matches?.flatMap(match => 
          match.user1_id === user.email ? [match.user2_id] : [match.user1_id]
        ) || []
      );

      const pendingInteractions = interactions.filter(
        interaction => !matchedUserIds.has(interaction.user_id)
      );

      if (pendingInteractions.length === 0) {
        setPendingLikes([]);
        return;
      }

      // STEP 3: BATCHED QUERY - Profiles, Photos, and Interests in ONE call
      const userIds = pendingInteractions.map(i => i.user_id);
      
      const { data: enrichedProfiles, error: profError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_photos(*),
          user_interests(interest)
        `)
        .in('email', userIds)
        .eq('is_active', true);

      if (profError) throw profError;

      // STEP 4: Map and Apply Privacy Logic
      const transformedLikes = pendingInteractions
        .map(interaction => {
          const profileData = enrichedProfiles?.find(p => p.email === interaction.user_id);
          if (!profileData) return null;

          // --- PRIVACY & NAME LOGIC ---
          const displayName = getDisplayName(profileData);
          const f = profileData.first_name || '';
          
          // ✅ FIX: Robust check for null or literal "NULL" string
          const hasLastName = profileData.last_name && 
                              profileData.last_name !== "NULL" && 
                              profileData.last_name.toLowerCase() !== 'null';
          
          const l = hasLastName ? profileData.last_name : '';
          
          // Construct the cleaned full name
          let cleanedFullName = `${f} ${l}`.trim();

          // Handle cases where first name might already contain the last name
          if (l && f.toLowerCase().includes(l.toLowerCase())) {
            cleanedFullName = f;
          }

          const finalName = shouldDisplayAnonymously(profileData) ? displayName : cleanedFullName;
           
          const safeProfile = { ...profileData };
          // Apply obfuscation via utils
          const details = getDisplayDetails(profileData);
          safeProfile.first_name = finalName; // Use the cleaned name as first_name for UI consistency
          safeProfile.year_of_study = details.year;
          safeProfile.branch = details.branch;
          safeProfile.height = details.height;
          safeProfile.hometown = details.hometown;
          safeProfile.bio = getDisplayBio(profileData);

          // Handle Photos Join
          const rawPhotos = (profileData as any).user_photos || [];
          const photoUrls = getDisplayPhotos(profileData, rawPhotos.map((p: any) => p.photo_url) || []);

          return {
            ...interaction,
            interaction_type: interaction.interaction_type as any,
            profile: {
              ...safeProfile,
              full_name: finalName,
              photos: photoUrls.map((url, index) => {
                const originalPhoto = rawPhotos.find((p: any) => p.photo_url === url);
                return {
                  photo_url: url,
                  photo_order: originalPhoto?.photo_order || index,
                  user_email: interaction.user_id,
                  is_primary: originalPhoto?.is_primary || (index === 0),
                  is_verified: originalPhoto?.is_verified || false,
                  created_at: originalPhoto?.created_at || new Date().toISOString()
                };
              }),
              interests: ((profileData as any).user_interests || []).map((i: any) => i.interest),
              prompts: [],
              elo_rating: null,
            }
          } as PendingLike;
        })
        .filter((like): like is PendingLike => like !== null);

      setPendingLikes(transformedLikes);

    } catch (error) {
      toast({
        title: "Error loading likes",
        description: "Failed to load pending likes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleLikeBack = useCallback(async (interactionId: string, targetUserId: string) => {
    try {
      const { error: likeError } = await supabase
        .from('user_interactions')
        .insert({
          user_id: interactionId,
          target_user_id: targetUserId,
          interaction_type: 'like'
        });

      if (likeError) throw likeError;

      setPendingLikes(prev => prev.filter(like => like.user_id !== targetUserId));
      toast({
        title: "It's a Match! 🎉",
        description: "You both liked each other!",
      });
      return true;
    } catch (error) {
      toast({ title: "Error", description: "Failed to create match.", variant: "destructive" });
      return false;
    }
  }, [toast]);

  const handlePass = useCallback(async (targetUserId: string) => {
    try {
      const userd = encryptedStorage.get("current-user");
      if (!userd) return false;
      const user = JSON.parse(userd);

      const { error } = await supabase
        .from("user_interactions")
        .update({ interaction_type: "pass" })
        .eq("user_id", targetUserId)
        .eq("target_user_id", user.email);

      if (error) return false;
      setPendingLikes(prev => prev.filter(like => like.user_id !== targetUserId));
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  useEffect(() => {
    fetchPendingLikes();
  }, [fetchPendingLikes]);

  return {
    pendingLikes,
    loading,
    fetchPendingLikes,
    handleLikeBack,
    handlePass
  };
}