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

    // 1. Fetch current matches to exclude them from the Likes list
    const { data: matchesData } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${user.email},user2_id.eq.${user.email}`);

    // Create a set of emails that the user is already matched with
    const matchedEmails = new Set<string>();
    matchesData?.forEach(m => {
      matchedEmails.add(m.user1_id);
      matchedEmails.add(m.user2_id);
    });

    // 2. Fetch the "likes" received by the user
    // Join using 'user_id' which points to the profiles table
    let query = supabase
      .from('user_interactions')
      .select(`
        *,
        profile:user_id(*)
      `) 
      .eq('target_user_id', user.email)
      .eq('interaction_type', 'like');

    // ✅ THE FILTER: If there are matches, exclude those users from the Likes feed
    if (matchedEmails.size > 0) {
      query = query.not('user_id', 'in', `(${Array.from(matchedEmails).join(',')})`);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // 3. Map over the data to fetch photos and interests for each profile
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

    // Final check to ensure we only show items with a valid profile
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

  // @/hooks/useLikes.ts

// @/hooks/useLikes.ts

// @/hooks/useLikes.ts

// @/hooks/useLikes.ts

const handleLikeBack = useCallback(async (targetUserId: string) => {
  try {
    // 1. Retrieve current user from storage
    const userd = encryptedStorage.get("current-user");
    if (!userd) {
      console.error("No current user found in storage");
      return false;
    }
    const currentUser = JSON.parse(userd);

    // 2. ✅ CRITICAL: THE HANDSHAKE
    // This establishes the 'app.user_email' variable in the DB session.
    // This allows the 'handle_mutual_like' trigger to successfully 
    // insert into the 'matches' table without an RLS error.
    await syncAppSession(currentUser.email);

    // 3. Insert the reciprocal 'like'
    // targetUserId MUST be the email of the person who liked you.
    const { error: likeError } = await supabase
      .from("user_interactions")
      .insert({
        user_id: currentUser.email.toLowerCase(),
        target_user_id: targetUserId.toLowerCase(),
        interaction_type: 'like'
      });

    // 4. Handle RLS or Database errors
    if (likeError) {
      // If you see code '42501' here, it means the 'matches' table 
      // policy is still blocking the trigger.
      throw likeError;
    }

    // 5. Update local state
    // Immediately remove the person from your "People who liked me" list
    setPendingLikes(prev => prev.filter(like => like.user_id !== targetUserId));
    
    // 6. Notify user
    toast({ 
      title: "It's a Match! 🎉", 
      description: "You can now find them in your matches screen." 
    });

    return true;
  } catch (error: any) {
    console.error('Like back error:', error);
    
    // Check for the specific RLS violation you mentioned
    const isRlsError = error.code === '42501';
    
    toast({
      title: isRlsError ? "Database Permission Error" : "Action failed",
      description: isRlsError 
        ? "The match couldn't be created. Please ensure the matches table policy is updated." 
        : "Failed to like back. Please try again.",
      variant: "destructive"
    });
    
    return false;
  }
}, [toast]);

const handlePass = useCallback(async (targetUserId: string) => {
  try {
    const userd = encryptedStorage.get("current-user");
    if (!userd) return false;
    const currentUser = JSON.parse(userd);

    await syncAppSession(currentUser.email);

    // ✅ FIX: Delete the specific interaction where THEY liked YOU
    const { error } = await supabase
      .from("user_interactions")
      .delete()
      .eq("user_id", targetUserId)        // The person who liked you
      .eq("target_user_id", currentUser.email); // You

    if (error) throw error;
    
    // Immediately remove this specific person from the local UI list
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