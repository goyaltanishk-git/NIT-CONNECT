import { useCallback, useState } from "react";
import { supabase, syncAppSession } from "@/integrations/supabase/client";

export interface PendingJob {
  id: string;
  raw_source_job_id: string | null;
  source_api: string | null;
  title: string;
  company_name: string;
  location_text: string;
  description: string | null;
  employment_type: "internship" | "full_time" | "part_time" | "contract";
  work_mode: "onsite" | "remote" | "hybrid";
  stipend_salary_label: string | null;
  application_url: string;
  tag_pills: string[];
  guessed_branches: string[];
  guessed_batch: number | null;
  expires_at: string | null;
  scraped_at: string;
}

export type PendingQueueSort = "newest" | "oldest" | "expiry_soon" | "batch_desc" | "company_az";

export interface PendingQueueFilters {
  sortBy?: PendingQueueSort;
  branchFilter?: string | null;
  batchFilter?: number | null;
  expiringBefore?: string | null;
  branchList?: string[] | null;
}

export function usePendingJobsAdmin(userEmail?: string) {
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const ensureSession = useCallback(async () => {
    if (!userEmail) throw new Error("Missing user session");
    await syncAppSession(userEmail);
    const { error } = await (supabase as any).rpc("set_app_session_user", {
      user_email: userEmail.toLowerCase(),
    });
    if (error) throw error;
  }, [userEmail]);

  const fetchCount = useCallback(async () => {
    if (!userEmail) return;
    try {
      await ensureSession();
      const { data, error } = await (supabase as any).rpc("jobs_fetch_pending_count");
      if (error) throw error;
      setPendingCount(Number(data) || 0);
    } catch (err) {
      console.error("Failed to fetch pending count", err);
    }
  }, [userEmail, ensureSession]);

  const fetchPending = useCallback(async (offset = 0, limit = 20, filters: PendingQueueFilters = {}) => {
      if (!userEmail) return;
      setLoading(true);
      try {
        await ensureSession();
        const { data, error } = await (supabase as any).rpc("jobs_get_pending_for_review", {
          p_offset: offset,
          p_limit: limit,
          p_sort_by: filters.sortBy || "newest",
          p_branch_filter: filters.branchFilter || null,
          p_branch_list: filters.branchList || null,
          p_batch_filter: filters.batchFilter ?? null,
          p_expiring_before: filters.expiringBefore ? new Date(filters.expiringBefore).toISOString() : null,
        });
        if (error) throw error;
        setPendingJobs(data || []);
      } catch (err) {
        console.error("Failed to fetch pending jobs", err);
      } finally {
        setLoading(false);
      }
  }, [userEmail, ensureSession]);

  const approveJob = useCallback(async (pendingId: string, finalTargetGroups: any[], expiresAt: string | null) => {
      await ensureSession();
      const { data, error } = await (supabase as any).rpc("jobs_approve_pending", {
        p_pending_id: pendingId,
        p_final_target_groups: finalTargetGroups,
        p_expires_at: expiresAt
      });
      if (error) throw error;
      
      setPendingJobs(prev => prev.filter(j => j.id !== pendingId));
      setPendingCount(prev => Math.max(0, prev - 1));
      return data;
  }, [ensureSession]);

  const rejectJob = useCallback(async (pendingId: string, reason: string) => {
      await ensureSession();
      const { error } = await (supabase as any).rpc("jobs_reject_pending", {
        p_pending_id: pendingId,
        p_reason: reason
      });
      if (error) throw error;
      
      setPendingJobs(prev => prev.filter(j => j.id !== pendingId));
      setPendingCount(prev => Math.max(0, prev - 1));
  }, [ensureSession]);

  const bulkRejectJobs = useCallback(async (pendingIds: string[], reason: string = "Bulk rejected") => {
    await ensureSession();
    const { error } = await (supabase as any).rpc("jobs_bulk_reject_pending", {
      p_pending_ids: pendingIds,
      p_reason: reason
    });
    if (error) throw error;
    
    setPendingJobs(prev => prev.filter(j => !pendingIds.includes(j.id)));
    setPendingCount(prev => Math.max(0, prev - pendingIds.length));
    await fetchCount(); // Re-sync exact count
  }, [ensureSession, fetchCount]);

  return {
    pendingJobs,
    pendingCount,
    loading,
    fetchCount,
    fetchPending,
    approveJob,
    rejectJob,
    bulkRejectJobs
  };
}
