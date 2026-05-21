import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionState {
  isPremium: boolean;
  expiresAt: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(userEmail?: string): SubscriptionState {
  const [isPremium, setIsPremium] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!userEmail) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_my_subscription", { p_email: userEmail });
      if (error) throw error;

      if (data && data.length > 0) {
        const row = data[0] as { plan: string; status: string; expires_at: string | null };
        const expired = row.expires_at ? new Date(row.expires_at) < new Date() : false;
        setIsPremium(row.plan === "premium" && row.status === "active" && !expired);
        setExpiresAt(row.expires_at);
      } else {
        setIsPremium(false);
        setExpiresAt(null);
      }
    } catch {
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  return { isPremium, expiresAt, loading, refresh: fetchSubscription };
}
