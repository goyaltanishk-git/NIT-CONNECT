import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDisplayDetails, getDisplayName, getDisplayPhotos } from '@/utils/incognitoUtils';


export interface PendingLike {
  id: string;
  user_id: string;
  target_user_id: string;
  interaction_type: 'like' | 'superlike' | 'pass' | 'block';
  created_at: string | null;
  profile?: {
    first_name: string;
    last_name: string;
    bio: string | null;
    year_of_study: string | null;
    branch: string | null;
    hometown: string | null;
    incognito_mode:boolean;
    photos: { url: string; order: number }[];
    email:string
  };
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

      // Get profile data for each interaction
  
      const transformedLikes = await Promise.all(pendingInteractions.map(async (interaction) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, bio, year_of_study, branch, hometown,incognito_mode,email')
          .eq('email', interaction.user_id)
          .single();
       
        const { data: photos } = await supabase
          .from('user_photos')
          .select('photo_url, photo_order')
          .eq('user_email', interaction.user_id)
          .order('photo_order');


         profileData.first_name=getDisplayName(profileData);
         profileData.year_of_study=getDisplayDetails(profileData).year;
        const photo=getDisplayPhotos(profileData,photos.map(p=>(p.photo_url)));


        
    

        return {
          ...interaction,
          interaction_type: interaction.interaction_type as 'like' | 'superlike',
          profile: {
            ...profileData,
            photos: (photo || []).map((url, index) => ({
    url,
    order: index,
  })),
          }
        };
      }));
         console.log(transformedLikes);
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

      // Create match
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          user1_id: targetUserId,
          user2_id: interactionId
        });

      if (matchError) throw matchError;

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