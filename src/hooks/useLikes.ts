import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDisplayDetails, getDisplayName, getDisplayPhotos } from '@/utils/incognitoUtils';
// --- ADDED: Import Database types ---
import { Database } from '@/integrations/supabase/types';

// --- UPDATED: Complete Profile type ---
// This now matches the full shape of the data we are fetching
type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  photos: Database["public"]["Tables"]["user_photos"]["Row"][];
  interests: string[]; // We will map the interests to a simple string array
  prompts: Database["public"]["Tables"]["user_prompts"]["Row"][];
  elo_rating: number | null;
};

// --- UPDATED: PendingLike interface ---
export interface PendingLike {
  id: string;
  user_id: string;
  target_user_id: string;
  interaction_type: 'like' | 'superlike' | 'pass' | 'block';
  created_at: string | null;
  profile?: Profile; // Use the complete Profile type
}

export function useLikes() {
  const [pendingLikes, setPendingLikes] = useState<PendingLike[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingLikes = useCallback(async () => {
    try {
      setLoading(true);
        const userd  = localStorage.getItem('current-user');
               const user = JSON.parse(userd);
      // Get interactions where others liked current user
      const { data: interactions, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('target_user_id', user.email)
        .in('interaction_type', ['like', 'superlike'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending likes:', error);
        return;
      }

     // Filter out matches (mutual likes)
      const { data: matches } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.email},user2_id.eq.${user.email}`);

      const matchedUserIds = new Set(
        matches?.flatMap(match => 
          match.user1_id === user.email ? [match.user2_id] : [match.user1_id]
        ) || []
      );

      const pendingInteractions = interactions?.filter(
        interaction => !matchedUserIds.has(interaction.user_id) && 
        (interaction.interaction_type === 'like' || interaction.interaction_type === 'superlike')
      ) || [];

      // --- UPDATED: Get profile data for each interaction ---
      const transformedLikes = await Promise.all(pendingInteractions.map(async (interaction) => {
        
        // 1. Get ALL profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*') // --- UPDATED: Select all columns
          .eq('email', interaction.user_id)
          .single();
       
        // 2. Get ALL photo data
        const { data: photos } = await supabase
          .from('user_photos')
          .select('*') // --- UPDATED: Select all columns
          .eq('user_email', interaction.user_id)
          .order('photo_order');
          
        // --- ADDED: 3. Get interests ---
        const { data: interestsData } = await supabase
          .from('user_interests')
          .select('interest')
          .eq('user_email', interaction.user_id);
          
        // --- ADDED: 4. Get prompts (needs profileData.user_id) ---
        const { data: prompts } = await supabase
          .from('user_prompts')
          .select('*')
          .eq('user_id', profileData.user_id)
          .order('prompt_order');

        // --- ADDED: 5. Get ELO rating (needs profileData.user_id) ---
        const { data: eloData } = await supabase
          .from('elo_ratings')
          .select('rating')
          .eq('user_id', profileData.user_id)
          .single();

         // --- This is your incognito logic ---
         // Be aware this might hide the real data you just fetched
         profileData.first_name=getDisplayName(profileData);
         profileData.year_of_study=getDisplayDetails(profileData).year;
         const photoUrls=getDisplayPhotos(profileData, photos?.map(p=>(p.photo_url)) || []);
         // --- End of incognito logic ---

        // --- UPDATED: Assemble the complete profile object ---
        return {
          ...interaction,
          interaction_type: interaction.interaction_type as 'like' | 'superlike',
          profile: {
            ...profileData,
            // Map your incognito-safe photo URLs back to the structure the dialog expects
            photos: (photoUrls || []).map((url, index) => {
              // Try to find the original photo object to keep its data
              const originalPhoto = photos?.find(p => p.photo_url === url);
              return {
                photo_url: url,
                photo_order: originalPhoto?.photo_order || index,
                user_email: interaction.user_id,
                is_primary: originalPhoto?.is_primary || (index === 0),
                is_verified: originalPhoto?.is_verified || false,
                created_at: originalPhoto?.created_at || null
              };
            }),
            // Map the fetched interests into a simple string array
            interests: (interestsData || []).map(i => i.interest),
            prompts: prompts || [],
            elo_rating: eloData?.rating || null,
          }
        };
      }));
         
      setPendingLikes(transformedLikes.filter(like => 
        like.interaction_type === 'like' || like.interaction_type === 'superlike'
      ));
    } catch (error) {
      console.error('Error in fetchPendingLikes:', error);
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
      
      // Create reciprocal like
      const { error: likeError } = await supabase
        .from('user_interactions')
        .insert({
          user_id: interactionId,
          target_user_id:targetUserId ,
          interaction_type: 'like'
        });

      if (likeError) throw likeError;


      // Remove from pending likes
      setPendingLikes(prev => prev.filter(like => like.user_id !== targetUserId));

      toast({
        title: "It's a Match! 🎉",
        description: "You both liked each other! Start chatting now.",
      });

      return true;
    } catch (error) {
      console.error('Error liking back:', error);
      toast({
        title: "Error",
        description: "Failed to create match. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  const handlePass = useCallback(async (targetUserId: string) => {
  try {
    const userd = localStorage.getItem("current-user");
    const user = JSON.parse(userd);

    const { error } = await supabase
      .from("user_interactions")
      .update({ interaction_type: "pass" }) // overwrite like/superlike
      .eq("user_id", targetUserId)              // the one who liked me
      .eq("target_user_id", user.email);        // me (the receiver)

    if (error) {
      console.error("Error updating pass:", error);
      return false;
    }

    // Update UI
    setPendingLikes(prev => prev.filter(like => like.user_id !== targetUserId));

    return true;
  } catch (error) {
    console.error("Error passing:", error);
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