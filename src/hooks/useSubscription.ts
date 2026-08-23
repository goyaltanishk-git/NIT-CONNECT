import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { getCachedProfileSync } from "@/hooks/useUserProfile";

export interface SubscriptionState {
  isPremium: boolean;
  expiresAt: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(userEmail?: string): SubscriptionState {
  // Synchronous cache read for 0ms initial load
  const getInitialPremium = (): boolean => {
    try {
      const cachedProfile = getCachedProfileSync(userEmail);
      if (cachedProfile && typeof cachedProfile.is_premium === 'boolean') {
        return cachedProfile.is_premium;
      }
      const stored = encryptedStorage.get("current-user");
      if (stored) {
        const parsed = JSON.parse(stored);
        return Boolean(parsed?.is_premium);
      }
    } catch {}
    return false;
  };

  const [isPremium, setIsPremium] = useState<boolean>(getInitialPremium);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading]     = useState<boolean>(false);

  const fetchSubscription = useCallback(async () => {
    if (!userEmail) { 
      setLoading(false); 
      return; 
    }

    try {
      // 1. Try get_my_subscription RPC first (SECURITY DEFINER)
      const { data: subData, error: subError } = await (supabase as any).rpc('get_my_subscription', {
        p_email: userEmail
      });

      if (!subError && Array.isArray(subData) && subData.length > 0) {
        const activeSub = subData[0];
        if (activeSub && activeSub.status === 'active') {
          setIsPremium(true);
          setExpiresAt(activeSub.expires_at || null);
          return;
        }
      }

      // 2. Try get_profile_by_email_unsecure (SECURITY DEFINER)
      const { data: profData, error: profError } = await supabase.rpc('get_profile_by_email_unsecure', {
        p_email: userEmail
      });

      if (!profError && Array.isArray(profData) && profData.length > 0) {
        setIsPremium(Boolean(profData[0]?.is_premium));
        setExpiresAt(null);
        return;
      }

      // 3. Fallback: check stored profile
      setIsPremium(getInitialPremium());
      setExpiresAt(null);
    } catch {
      setIsPremium(getInitialPremium());
      setExpiresAt(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { 
    fetchSubscription(); 
  }, [fetchSubscription]);

  return { isPremium, expiresAt, loading, refresh: fetchSubscription };
}

