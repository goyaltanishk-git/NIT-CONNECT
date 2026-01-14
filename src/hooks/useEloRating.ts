import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EloRating {
  user_id: string;
  rating: number;
  likes_given: number;
  likes_received: number;
  matches_count: number;
}

// ELO rating system constants
const K_FACTOR = 32; // How much ratings change per interaction
const BASE_RATING = 1000;

export function useEloRating() {
  const [userRating, setUserRating] = useState<EloRating | null>(null);

  const calculateEloChange = useCallback((userRating: number, opponentRating: number, result: number) => {
    // Expected score calculation
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - userRating) / 400));
    
    // Calculate rating change
    const ratingChange = Math.round(K_FACTOR * (result - expectedScore));
    
    return ratingChange;
  }, []);

  const updateRating = useCallback(async (
    userId: string, 
    targetUserId: string, 
    interaction: 'like' | 'pass' | 'superlike',
    isMatch: boolean = false
  ) => {
    try {
      // Get current ratings for both users
      const { data: userRatings } = await supabase
        .from('elo_ratings')
        .select('*')
        .in('user_id', [userId, targetUserId]);

      if (!userRatings || userRatings.length < 2) return;

      const currentUser = userRatings.find(r => r.user_id === userId);
      const targetUser = userRatings.find(r => r.user_id === targetUserId);

      if (!currentUser || !targetUser) return;

      // Determine interaction results for ELO calculation
      let result = 0.5; // Default tie
      
      if (interaction === 'like') {
        result = 0.7; // Slight positive
      } else if (interaction === 'superlike') {
        result = 0.8; // More positive
      } else if (interaction === 'pass') {
        result = 0.3; // Slight negative
      }

      // If it's a match, both users get positive result
      if (isMatch) {
        result = 1.0;
      }

      // Calculate new ratings
      const userRatingChange = calculateEloChange(currentUser.rating, targetUser.rating, result);
      const targetRatingChange = calculateEloChange(targetUser.rating, currentUser.rating, 1 - result);

      // Update user's rating
      const newUserRating = Math.max(500, currentUser.rating + userRatingChange); // Minimum rating of 500
      const newTargetRating = Math.max(500, targetUser.rating + targetRatingChange);

      // Update statistics
      const userUpdates = {
        rating: newUserRating,
        likes_given: interaction === 'like' || interaction === 'superlike' 
          ? currentUser.likes_given + 1 
          : currentUser.likes_given,
        matches_count: isMatch ? currentUser.matches_count + 1 : currentUser.matches_count,
        last_updated: new Date().toISOString()
      };

      const targetUpdates = {
        rating: newTargetRating,
        likes_received: interaction === 'like' || interaction === 'superlike'
          ? targetUser.likes_received + 1
          : targetUser.likes_received,
        matches_count: isMatch ? targetUser.matches_count + 1 : targetUser.matches_count,
        last_updated: new Date().toISOString()
      };

      // Update database
      await Promise.all([
        supabase
          .from('elo_ratings')
          .update(userUpdates)
          .eq('user_id', userId),
        supabase
          .from('elo_ratings')
          .update(targetUpdates)
          .eq('user_id', targetUserId)
      ]);

      return {
        userRatingChange,
        newUserRating,
        targetRatingChange,
        newTargetRating
      };

    } catch (error) {
      return null;
    }
  }, [calculateEloChange]);

  const getUserRating = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('elo_ratings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return null;
      }

      if (!data) {
        // Create initial rating for user
        const initialRating = {
          user_id: userId,
          rating: BASE_RATING,
          likes_given: 0,
          likes_received: 0,
          matches_count: 0
        };

        const { data: newRating } = await supabase
          .from('elo_ratings')
          .insert(initialRating)
          .select()
          .single();

        return newRating;
      }

      return data;
    } catch (error) {
      return null;
    }
  }, []);

  const getRatingTier = useCallback((rating: number) => {
    if (rating >= 1800) return { tier: 'Legendary', color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
    if (rating >= 1600) return { tier: 'Diamond', color: 'text-blue-500', bgColor: 'bg-blue-50' };
    if (rating >= 1400) return { tier: 'Platinum', color: 'text-green-500', bgColor: 'bg-green-50' };
    if (rating >= 1200) return { tier: 'Gold', color: 'text-orange-500', bgColor: 'bg-orange-50' };
    if (rating >= 1000) return { tier: 'Silver', color: 'text-gray-500', bgColor: 'bg-gray-50' };
    return { tier: 'Bronze', color: 'text-orange-700', bgColor: 'bg-orange-100' };
  }, []);

  return {
    userRating,
    setUserRating,
    updateRating,
    getUserRating,
    getRatingTier,
    calculateEloChange
  };
}