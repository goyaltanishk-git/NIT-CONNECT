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
      } else {
        setDailyLikes(0);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

 // @/hooks/useDailyLimits.ts

const incrementLikes = async () => {
  if (!userEmail) return false;

  try {
    // ✅ STEP 1: Establish identity for RLS
    // This removes the 401 Unauthorized error
    await syncAppSession(userEmail);

    const today = new Date().toISOString().split('T')[0];

    // ✅ STEP 2: Use an 'upsert' to either update today's count or create it
    const { error } = await supabase
      .from('daily_limits')
      .upsert({ 
        email: userEmail, 
        date: today,
        likes_used: (dailyLikes || 0) + 1 
      }, { onConflict: 'email,date' });

    if (error) throw error;
    
    setDailyLikes(prev => (prev || 0) + 1);
    return true;
  } catch (err) {
    console.error("Error updating daily limits:", err);
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