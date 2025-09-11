import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DatabaseProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio: string | null;
  year_of_study: string | null;
  branch: string | null;
  hometown: string | null;
  height: number | null;
  date_of_birth: string;
  gender: string;
  interested_in: string;
  is_verified: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
  photos?: { url: string; order: number }[];
  interests?: string[];
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<DatabaseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch profiles with photos and interests
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_verified', true)
        .eq('is_active', true)
        .neq('user_id', user?.id || 'none')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      if (profilesData) {
        // Fetch photos and interests separately for each profile
        const transformedProfiles = await Promise.all(profilesData.map(async (profile) => {
          // Get photos
          const { data: photos } = await supabase
            .from('user_photos')
            .select('photo_url, photo_order')
            .eq('user_id', profile.user_id)
            .order('photo_order');

          // Get interests
          const { data: interests } = await supabase
            .from('user_interests')
            .select('interest')
            .eq('user_id', profile.user_id);

          return {
            ...profile,
            photos: photos?.map(photo => ({ url: photo.photo_url, order: photo.photo_order })) || [],
            interests: interests?.map(interest => interest.interest) || []
          };
        }));

        setProfiles(transformedProfiles);
      }
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
      toast({
        title: "Error loading profiles",
        description: "Failed to load profiles from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleInteraction = useCallback(async (
    targetUserId: string, 
    interactionType: 'like' | 'pass' | 'superlike'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Record interaction
      const { error: interactionError } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          target_user_id: targetUserId,
          interaction_type: interactionType
        });

      if (interactionError) {
        console.error('Error recording interaction:', interactionError);
        return;
      }

      // Check for mutual like (match)
      if (interactionType === 'like' || interactionType === 'superlike') {
        const { data: mutualLike } = await supabase
          .from('user_interactions')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('target_user_id', user.id)
          .in('interaction_type', ['like', 'superlike'])
          .single();

        if (mutualLike) {
          // Create match
          const { error: matchError } = await supabase
            .from('matches')
            .insert({
              user1_id: user.id,
              user2_id: targetUserId
            });

          if (!matchError) {
            toast({
              title: "It's a Match! 🎉",
              description: "You both liked each other!",
            });
          }
        }
      }

      // Update daily limits
      const today = new Date().toISOString().split('T')[0];
      const { data: limits } = await supabase
        .from('daily_limits')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (limits) {
        await supabase
          .from('daily_limits')
          .update({
            likes_used: interactionType === 'like' ? limits.likes_used + 1 : limits.likes_used,
            superlikes_used: interactionType === 'superlike' ? limits.superlikes_used + 1 : limits.superlikes_used
          })
          .eq('id', limits.id);
      } else {
        await supabase
          .from('daily_limits')
          .insert({
            user_id: user.id,
            date: today,
            likes_used: interactionType === 'like' ? 1 : 0,
            superlikes_used: interactionType === 'superlike' ? 1 : 0
          });
      }

      return true;
    } catch (error) {
      console.error('Error handling interaction:', error);
      return false;
    }
  }, [toast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    fetchProfiles,
    handleInteraction
  };
}