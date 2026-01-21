import { useState, useCallback } from 'react';

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
      // Mock data - simulating what would come from API
      const mockUserRatings = [
        { user_id: userId, rating: 1000, likes_given: 0, likes_received: 0, matches_count: 0, last_updated: new Date().toISOString() },
        { user_id: targetUserId, rating: 1000, likes_given: 0, likes_received: 0, matches_count: 0, last_updated: new Date().toISOString() }
      ];

      const currentUser = mockUserRatings.find(r => r.user_id === userId);
      const targetUser = mockUserRatings.find(r => r.user_id === targetUserId);

      if (!currentUser || !targetUser) return null;

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

      // Update statistics (in-memory only, no API call)
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

      // Log the updates instead of saving to database
      console.log('ELO Rating Update (Local Only):', { userUpdates, targetUpdates });

      return {
        userRatingChange,
        newUserRating,
        targetRatingChange,
        newTargetRating
      };

    } catch (error) {
      console.error('ELO rating calculation error:', error);
      return null;
    }
  }, [calculateEloChange]);

  const getUserRating = useCallback(async (userId: string) => {
    try {
      // Return mock initial rating instead of fetching from API
      const initialRating: EloRating = {
        user_id: userId,
        rating: BASE_RATING,
        likes_given: 0,
        likes_received: 0,
        matches_count: 0
      };

      console.log('Getting user rating (Local Only):', initialRating);
      return initialRating;
    } catch (error) {
      console.error('Get user rating error:', error);
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