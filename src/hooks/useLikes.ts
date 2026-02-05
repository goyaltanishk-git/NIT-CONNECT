// src/hooks/useLikes.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase, syncAppSession } from '@/integrations/supabase/client'; 
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
    
    const userd = encryptedStorage.get("current-user");
    if (!userd) return;
    const user = JSON.parse(userd);

    // ✅ FIX: Use 'user_id' instead of 'profiles' in the select
    // This tells Supabase: "Join using the user_id foreign key"
    const { data, error } = await supabase
      .from('user_interactions')
      .select(`
        *,
        profile:user_id(*)
      `) 
      .eq('target_user_id', user.email)
      .eq('interaction_type', 'like');

    if (error) throw error;
    
    // ... rest of your mapping logic

      const enhancedLikes = await Promise.all((data || []).map(async (like: any) => {
        if (!like.profile) return like;

        // Fetch related data for the profile in parallel
        const [photosRes, interestsRes] = await Promise.all([
          supabase.from('user_photos')
            .select('*')
            .eq('user_email', like.profile.email)
            .order('photo_order'),
          supabase.from('user_interests')
            .select('interest')
            .eq('user_email', like.profile.email)
        ]);

        return {
          ...like,
          profile: {
            ...like.profile,
            photos: photosRes.data || [],
            interests: (interestsRes.data || []).map(i => i.interest),
            full_name: `${like.profile.first_name} ${like.profile.last_name || ''}`
          }
        };
      }));

      // Filter out any likes where the profile couldn't be loaded (e.g., deleted accounts)
      setPendingLikes(enhancedLikes.filter(item => item.profile));
      
    } catch (error) {
      console.error('Error fetching likes:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load likes.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ✅ INITIALIZATION EFFECT: Syncs identity then fetches data
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const userd = encryptedStorage.get("current-user");
      if (userd) {
        const user = JSON.parse(userd);
        
        // 1. PERFORM THE HANDSHAKE
        // This sets 'app.user_email' in the DB to avoid 400 errors
        await syncAppSession(user.email);
        
        if (isMounted) {
          await fetchPendingLikes();
        }
      } else {
        setLoading(false);
      }
    };

    initialize();
    return () => { isMounted = false; };
  }, [fetchPendingLikes]);

  const handleLikeBack = useCallback(async (interactionId: string, targetUserId: string) => {
    try {
      const userd = encryptedStorage.get("current-user");
      if (!userd) return false;
      const user = JSON.parse(userd);

      // Ensure session is synced before writing
      await syncAppSession(user.email);

      const { error: likeError } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user.email,
          target_user_id: targetUserId,
          interaction_type: 'like'
        });

      if (likeError) throw likeError;

      // Update local state to remove the processed like
      setPendingLikes(prev => prev.filter(like => like.user_id !== targetUserId));
      
      toast({
        title: "It's a Match! 🎉",
        description: "You both liked each other!",
      });
      return true;
    } catch (error) {
      console.error('Like back error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create match.", 
        variant: "destructive" 
      });
      return false;
    }
  }, [toast]);

  const handlePass = useCallback(async (targetUserId: string) => {
    try {
      const userd = encryptedStorage.get("current-user");
      if (!userd) return false;
      const user = JSON.parse(userd);

      // Ensure session is synced before updating
      await syncAppSession(user.email);

      const { error } = await supabase
        .from("user_interactions")
        .update({ interaction_type: "pass" })
        .eq("user_id", targetUserId) // The person who liked you
        .eq("target_user_id", user.email); // You

      if (error) throw error;
      
      setPendingLikes(prev => prev.filter(like => like.user_id !== targetUserId));
      return true;
    } catch (error) {
      console.error('Pass error:', error);
      return false;
    }
  }, []);

  return {
    pendingLikes,
    loading,
    handleLikeBack,
    handlePass,
    refresh: fetchPendingLikes
  };
}