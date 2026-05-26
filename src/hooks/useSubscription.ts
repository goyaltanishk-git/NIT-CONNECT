import { useState, useEffect, useCallback } from "react";
import { supabase, syncAppSession } from "@/integrations/supabase/client";

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
      await syncAppSession(userEmail);
      const { data, error } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("email", userEmail)
        .single();

      if (error) throw error;

      setIsPremium(Boolean(data?.is_premium));
      setExpiresAt(null);
    } catch {
      setIsPremium(false);
      setExpiresAt(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  return { isPremium, expiresAt, loading, refresh: fetchSubscription };
}
