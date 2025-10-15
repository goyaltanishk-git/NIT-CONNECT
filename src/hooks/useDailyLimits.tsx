import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseDailyLimitsReturn {
  dailyLikes: number;
  canLike: boolean;
  loading: boolean;
  incrementLikes: () => Promise<boolean>;
  refreshLimits: () => Promise<void>;
}

const DAILY_LIKE_LIMIT = 3;

export function useDailyLimits(userEmail?: string): UseDailyLimitsReturn {
  const [dailyLikes, setDailyLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getCurrentDate = () => new Date().toISOString().split('T')[0];

  const loadDailyLimits = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_limits')
        .select('likes_used')
        .eq('email', userEmail)
        .eq('date', getCurrentDate())
        .single();

      if (data) {
        setDailyLikes(data.likes_used || 0);
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error loading daily limits:', error);
      } else {
        setDailyLikes(0);
      }
    } catch (error) {
      console.error('An unexpected error in loadDailyLimits:', error);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const incrementLikes = async (): Promise<boolean> => {
    if (!userEmail || dailyLikes >= DAILY_LIKE_LIMIT) {
      return false;
    }
    try {
      const newLikesCount = dailyLikes + 1;
      const { error } = await supabase.from('daily_limits').upsert({
        email: userEmail,
        date: getCurrentDate(),
        likes_used: newLikesCount,
      });

      if (error) {
        toast({ title: "Error", description: "Could not save your like.", variant: "destructive" });
        return false;
      }
      setDailyLikes(newLikesCount);
      return true;
    } catch (error) {
      console.error('An unexpected error in incrementLikes:', error);
      return false;
    }
  };

  const refreshLimits = async () => {
    await loadDailyLimits();
  };

  // Load initial data when the component mounts
  useEffect(() => {
    loadDailyLimits();
  }, [loadDailyLimits]);

  // This efficient effect sets a single timer to reset the state at midnight.
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to midnight

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      setDailyLikes(0);
      toast({
        title: "Daily limits have been reset! 🌅",
        description: "You have fresh likes for a new day!",
      });
    }, msUntilMidnight);

    // Clean up the timer when the component unmounts
    return () => clearTimeout(timeoutId);
  }, []); // Runs only once

  return {
    dailyLikes,
    canLike: dailyLikes < DAILY_LIKE_LIMIT,
    loading,
    incrementLikes,
    refreshLimits,
  };
}