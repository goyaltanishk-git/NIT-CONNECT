import { useState, useEffect, useCallback } from 'react';
import { supabase, syncAppSession } from "@/integrations/supabase/client"
import { useToast } from '@/hooks/use-toast';

interface UseDailyLimitsReturn {
  dailyLikes: number;
  canLike: boolean;
  loading: boolean;
  incrementLikes: () => Promise<boolean>;
  refreshLimits: () => Promise<void>;
}

const DAILY_LIKE_LIMIT = 2;

export function useDailyLimits(userEmail?: string): UseDailyLimitsReturn {
  const [dailyLikes, setDailyLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getCurrentDate = () => new Date().toISOString().split('T')[0];

 // Inside src/hooks/useDailyLimits.tsx

  const loadDailyLimits = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // ✅ Use the new Secure RPC
      const { data, error } = await supabase.rpc('get_daily_limits', { p_email: userEmail });
      if (error) throw error;
      setDailyLikes(data as number);
    } catch (error) {
      console.error("Error loading limits", error);
      setDailyLikes(0);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const incrementLikes = async () => {
    if (!userEmail) return false;
    try {
      // ✅ Use the new Secure RPC
      const { error } = await supabase.rpc('increment_daily_limit', { p_email: userEmail });
      if (error) throw error;
      
      setDailyLikes(prev => (prev || 0) + 1);
      return true;
    } catch (err) {
      console.error("Error incrementing limits", err);
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