import { useCallback, useEffect, useState, useRef } from "react";
import { supabase, syncAppSession } from "@/integrations/supabase/client";

export interface JobFeedItem {
  slot_no: number;
  job_id: string;
  title: string;
  company_name: string;
  location_text: string;
  employment_type: "internship" | "full_time" | "part_time" | "contract";
  work_mode: "onsite" | "remote" | "hybrid";
  stipend_salary_label: string | null;
  stipend_min: number | null;
  stipend_max: number | null;
  currency_code: string;
  is_pre_placement_offer: boolean;
  tag_pills: string[] | null;
  application_url: string;
  expires_at: string | null;
  swiped_at: string | null;
  swipe_action: "like" | "pass" | null;
}

export interface JobDailyStatus {
  today: string;
  daily_limit: number;
  served_count: number;
  interacted_count: number;
  remaining_to_serve: number;
  remaining_to_interact: number;
  is_locked: boolean;
  resets_at: string;
}

interface RecordSwipeResult {
  success: boolean;
  action: "like" | "pass";
  interacted_count: number;
  is_locked: boolean;
  next_allowed_at: string;
  application_url: string | null;
}

interface UseJobsFeedReturn {
  jobs: JobFeedItem[];
  status: JobDailyStatus | null;
  loading: boolean;
  error: string | null;
  refetch: (background?: boolean) => Promise<void>;
  recordSwipe: (jobId: string, action: "like" | "pass") => Promise<RecordSwipeResult>;
  consumeJobFromList: (jobId: string) => void;
}

export function useJobsFeed(userEmail?: string): UseJobsFeedReturn {
  const [jobs, setJobs] = useState<JobFeedItem[]>([]);
  const [status, setStatus] = useState<JobDailyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSwipingRef = useRef(false);
  const ensureSession = useCallback(async () => {
    if (!userEmail) throw new Error("Missing user session");

    try {
      await syncAppSession(userEmail);
      const { error: sessionError } = await (supabase as any).rpc("set_app_session_user", {
        user_email: userEmail.toLowerCase(),
      });
      if (sessionError) throw sessionError;
    } catch (err) {
      console.warn("Session sync in progress or failed:", err);
      // If it fails with SESSION_EMAIL_MISSING, we shouldn't throw to prevent loop, 
      // but the RPC caller will catch the 400 later.
    }
  }, [userEmail]);

  const rpcCall = useCallback(async (name: string, payload: Record<string, any>) => {
    // Check session before EVERY call
    await ensureSession();
    
    const { data, error: rpcError } = await (supabase as any).rpc(name, payload);
    if (rpcError) {
      // If session expired while on another tab
      if (rpcError.message === 'SESSION_EMAIL_MISSING') {
         await ensureSession();
         // Retry once
         const { data: retryData, error: retryError } = await (supabase as any).rpc(name, payload);
         if (!retryError) return retryData;
      }
      console.error(`RPC ${name} payload:`, payload, "Error:", rpcError);
      throw rpcError;
    }
    return data;
  }, [ensureSession]);

  const fetchStatus = useCallback(async () => {
    const data = await rpcCall("jobs_get_daily_status", { p_tz: "Asia/Kolkata" });
    const row = Array.isArray(data) ? data[0] : data;
    setStatus((row ?? null) as JobDailyStatus | null);
  }, [rpcCall]);

  const fetchFeed = useCallback(async () => {
    const data = await rpcCall("jobs_get_daily_feed", { p_tz: "Asia/Kolkata" });
    const rows = (Array.isArray(data) ? data : []) as JobFeedItem[];
    setJobs(rows);
  }, [rpcCall]);

  const refetch = useCallback(async (background = false) => {
    if (!userEmail) {
      setJobs([]);
      setStatus(null);
      setLoading(false);
      return;
    }

    if (!background) setLoading(true);
    setError(null);

    try {
      await ensureSession();
      await Promise.all([fetchStatus(), fetchFeed()]);
    } catch (err: any) {
      setError(err?.message || "Failed to load jobs");
    } finally {
      if (!background) setLoading(false);
    }
  }, [ensureSession, fetchFeed, fetchStatus, userEmail]);

  const recordSwipe = useCallback(
    async (jobId: string, action: "like" | "pass") => {
      if (isSwipingRef.current) return;
      isSwipingRef.current = true;

      try {
        await ensureSession();
        const data = await rpcCall("jobs_record_swipe", {
          p_job_id: jobId,
          p_action: action,
          p_tz: "Asia/Kolkata",
        });

        const row = (Array.isArray(data) ? data[0] : data) as RecordSwipeResult;
        setStatus((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            interacted_count: row?.interacted_count ?? prev.interacted_count,
            remaining_to_interact: Math.max(0, 2 - (row?.interacted_count ?? prev.interacted_count)),
            is_locked: Boolean(row?.is_locked),
            resets_at: row?.next_allowed_at ?? prev.resets_at,
          };
        });

        return row;
      } finally {
        isSwipingRef.current = false;
      }
    },
    [ensureSession, rpcCall],
  );

  const consumeJobFromList = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.job_id !== jobId));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    jobs,
    status,
    loading,
    error,
    refetch,
    recordSwipe,
    consumeJobFromList,
  };
}
