import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { encryptedStorage } from "@/utils/encryptedStorage";

interface UseDailyLimitsReturn {
  dailyLikes: number;
  dailyLikeLimit: number;
  isPremium: boolean;
  canLike: boolean;
  loading: boolean;
  incrementLikes: () => Promise<boolean>;
  refreshLimits: () => Promise<void>;
}

export function useDailyLimits(userEmail?: string): UseDailyLimitsReturn {
  const [dailyLikes, setDailyLikes]           = useState(0);
  const [dailyLikeLimit, setDailyLikeLimit]   = useState(2);
  const [isPremium, setIsPremium]             = useState(false);
  const [loading, setLoading]                 = useState(true);
  const { toast } = useToast();

  const getStoredPremiumStatus = useCallback(() => {
    const stored = encryptedStorage.get("current-user");
    if (!stored) return false;

    try {
      const parsed = JSON.parse(stored);
      return Boolean(parsed?.is_premium);
    } catch {
      return false;
    }
  }, []);

  const loadDailyLimits = useCallback(async () => {
    if (!userEmail) { setLoading(false); return; }
    setLoading(true);
    try {
      const premiumStatus = getStoredPremiumStatus();
      const [usedRes, limitRes] = await Promise.all([
        supabase.rpc('get_daily_limits',    { p_email: userEmail }),
        supabase.rpc('get_daily_like_limit', { p_email: userEmail }),
      ]);
      if (usedRes.error)  throw usedRes.error;
      if (limitRes.error) throw limitRes.error;
      setIsPremium(premiumStatus);
      setDailyLikes(usedRes.data as number);
      setDailyLikeLimit(premiumStatus ? Number.POSITIVE_INFINITY : (limitRes.data as number));
    } catch {
      setDailyLikes(0);
      const premiumStatus = getStoredPremiumStatus();
      setIsPremium(premiumStatus);
      setDailyLikeLimit(premiumStatus ? Number.POSITIVE_INFINITY : 2);
    } finally {
      setLoading(false);
    }
  }, [getStoredPremiumStatus, userEmail]);

  const incrementLikes = async (): Promise<boolean> => {
    if (!userEmail) return false;
    try {
      const { error } = await supabase.rpc('increment_daily_limit', { p_email: userEmail });
      if (error) throw error;
      setDailyLikes(prev => (prev || 0) + 1);
      return true;
    } catch {
      return false;
    }
  };

  const refreshLimits = async () => { await loadDailyLimits(); };

  useEffect(() => { loadDailyLimits(); }, [loadDailyLimits]);

  // Reset display counter at midnight
  useEffect(() => {
    const now      = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const ms = tomorrow.getTime() - now.getTime();
    const id = setTimeout(() => {
      setDailyLikes(0);
      toast({ title: "Daily limits reset! 🌅", description: "Fresh swipes for a new day!" });
    }, ms);
    return () => clearTimeout(id);
  }, []);

  return {
    dailyLikes,
    dailyLikeLimit,
    isPremium,
    canLike: isPremium ? true : dailyLikes < dailyLikeLimit,
    loading,
    incrementLikes,
    refreshLimits,
  };
}
