// src/hooks/useLikes.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDisplayBio, getDisplayDetails, getDisplayName, getDisplayPhotos } from '@/utils/incognitoUtils';
import { Database } from '@/integrations/supabase/types';
import { encryptedStorage } from "@/utils/encryptedStorage";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  photos: Database["public"]["Tables"]["user_photos"]["Row"][];
  interests: string[];
  prompts: Database["public"]["Tables"]["user_prompts"]["Row"][];
  elo_rating: number | null;
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

      // STEP 1: Fetch interactions where others liked current user
      const { data: interactions, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('target_user_id', user.email)
        .in('interaction_type', ['like', 'superlike'])
        .order('created_at', { ascending: false });

      if (error || !interactions) return;

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

      // STEP 3: Fetch and Filter by Active Profiles
      // FIX: Explicitly type the map return to be assignable to PendingLike | null
      const transformedLikesRaw = await Promise.all(
        pendingInteractions.map(async (interaction): Promise<PendingLike | null> => {
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', interaction.user_id)
            .single();

          // Filter out deactivated accounts
          if (!profileData || profileData.is_active === false) {
            return null;
          }
         
          const { data: photos } = await supabase
            .from('user_photos')
            .select('*')
            .eq('user_email', interaction.user_id)
            .order('photo_order');
            
          const { data: interestsData } = await supabase
            .from('user_interests')
            .select('interest')
            .eq('user_email', interaction.user_id);
            
          const { data: prompts } = await supabase
            .from('user_prompts')
            .select('*')
            .eq('user_id', profileData.user_id)
            .order('prompt_order');

          const { data: eloData } = await supabase
            .from('elo_ratings')
            .select('rating')
            .eq('user_id', profileData.user_id)
            .single();

           const safeProfile = { ...profileData };
           safeProfile.first_name = getDisplayName(profileData);
           safeProfile.year_of_study = getDisplayDetails(profileData).year;
           safeProfile.branch = getDisplayDetails(profileData).branch;
           safeProfile.height = getDisplayDetails(profileData).height;
           safeProfile.hometown = getDisplayDetails(profileData).hometown;
           safeProfile.bio = getDisplayBio(profileData);

           const photoUrls = getDisplayPhotos(profileData, photos?.map(p => p.photo_url) || []);

          return {
            ...interaction,
            // Cast strictly to 'like' | 'superlike' to fit PendingLike after filtering nulls
            interaction_type: interaction.interaction_type as any,
            profile: {
              ...safeProfile,
              photos: (photoUrls || []).map((url, index) => {
                const originalPhoto = photos?.find(p => p.photo_url === url);
                return {
                  photo_url: url,
                  photo_order: originalPhoto?.photo_order || index,
                  user_email: interaction.user_id,
                  is_primary: originalPhoto?.is_primary || (index === 0),
                  is_verified: originalPhoto?.is_verified || false,
                  created_at: originalPhoto?.created_at ? originalPhoto.created_at : new Date().toISOString()
                };
              }),
              interests: (interestsData || []).map(i => i.interest),
              prompts: prompts || [],
              elo_rating: eloData?.rating || null,
            }
          };
        })
      );
         
      // Final Filter: TypeScript now allows this because the array is typed as (PendingLike | null)[]
      const cleanLikes = transformedLikesRaw.filter((like): like is PendingLike => like !== null);
      setPendingLikes(cleanLikes);

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