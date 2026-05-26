import { useCallback, useEffect, useState } from "react";
import { supabase, syncAppSession } from "@/integrations/supabase/client";


export interface JobTargetGroupInput {
  branch: string;
  graduation_batch: number;
}

export interface AddJobInput {
  title: string;
  company_name: string;
  location_text: string;
  employment_type: "internship" | "full_time" | "part_time" | "contract";
  work_mode: "onsite" | "remote" | "hybrid";
  stipend_salary_label?: string;
  stipend_min?: number | null;
  stipend_max?: number | null;
  currency_code?: string;
  application_url: string;
  is_pre_placement_offer?: boolean;
  tag_pills?: string[];
  expires_at?: string | null;
  target_groups: JobTargetGroupInput[];
}

export interface SavedBranchGroup {
  group_id: string;
  group_name: string;
  branches: string[];
}

interface UseJobsAdminReturn {
  canAddJob: boolean;
  checking: boolean;
  addJobLoading: boolean;
  branches: string[];
  savedGroups: SavedBranchGroup[];
  groupsLoading: boolean;
  refreshAdminStatus: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  createBranchGroup: (groupName: string, branches: string[]) => Promise<void>;
  addJob: (payload: AddJobInput) => Promise<{ job_id: string; inserted_targets: number }>;
}

export function useJobsAdmin(userEmail?: string): UseJobsAdminReturn {
  const [canAddJob, setCanAddJob] = useState(false);
  const [checking, setChecking] = useState(true);
  const [addJobLoading, setAddJobLoading] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);
  const [savedGroups, setSavedGroups] = useState<SavedBranchGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  const ensureSession = useCallback(async () => {
    if (!userEmail) throw new Error("Missing user session");
    await syncAppSession(userEmail);
  }, [userEmail]);

  const fetchBranchCatalog = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any).rpc("jobs_get_branch_catalog");
      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      const uniqueBranches = Array.from(
        new Set(
          rows
            .map((row: any) => String(row?.branch || "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b));

      setBranches(uniqueBranches);
    } catch {
      const { data, error } = await supabase
        .from("profiles")
        .select("branch")
        .not("branch", "is", null)
        .limit(10000);
      if (error) return;

      const uniqueBranches = Array.from(
        new Set(
          (data || [])
            .map((row: any) => String(row?.branch || "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b));

      setBranches(uniqueBranches);
    }
  }, []);

  const fetchSavedGroups = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any).rpc("jobs_get_saved_target_groups");
      if (error) throw error;

      const rows = (Array.isArray(data) ? data : []) as SavedBranchGroup[];
      setSavedGroups(
        rows.map((row) => ({
          group_id: row.group_id,
          group_name: row.group_name,
          branches: Array.isArray(row.branches) ? row.branches : [],
        })),
      );
    } catch {
      setSavedGroups([]);
    }
  }, []);

  const refreshAdminStatus = useCallback(async () => {
    if (!userEmail) {
      setCanAddJob(false);
      setChecking(false);
      return;
    }

    setChecking(true);
    try {
      await ensureSession();
      const { data, error } = await (supabase as any).rpc("jobs_admin_can_add");
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      setCanAddJob(Boolean(row?.can_add));
    } catch {
      setCanAddJob(false);
    } finally {
      setChecking(false);
    }
  }, [ensureSession, userEmail]);

  const refreshGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      await Promise.all([fetchBranchCatalog(), fetchSavedGroups()]);
    } finally {
      setGroupsLoading(false);
    }
  }, [fetchBranchCatalog, fetchSavedGroups]);

  const createBranchGroup = useCallback(
    async (groupName: string, selectedBranches: string[]) => {
      if (!groupName.trim()) throw new Error("Group name is required");
      if (selectedBranches.length === 0) throw new Error("Select at least one branch");

      await ensureSession();

      const { error } = await (supabase as any).rpc("jobs_create_target_group", {
        p_group_name: groupName.trim(),
        p_branches: selectedBranches,
      });

      if (error) throw error;
      await refreshGroups();
    },
    [ensureSession, refreshGroups],
  );

  const addJob = useCallback(
    async (payload: AddJobInput) => {
      if (!userEmail) throw new Error("Missing user session");

      setAddJobLoading(true);
      try {
        await ensureSession();

        const targetGroupsPayload = payload.target_groups.map((group) => ({
          branch: (group.branch || "").trim(),
          graduation_batch: String(group.graduation_batch || "").trim(),
        }));

        if (targetGroupsPayload.length === 0) {
          throw new Error("At least one target group is required");
        }

        const invalidGroups = targetGroupsPayload.filter(
          (g) => !g.branch || !/^\d{4}$/.test(g.graduation_batch)
        );

        if (invalidGroups.length > 0) {
          throw new Error(
            `Invalid target groups: branch must not be empty and graduation_batch must be 4 digits (YYYY format)`
          );
        }

        let data: any = null;
        let error: any = null;

        ({ data, error } = await (supabase as any).rpc("jobs_admin_add_job", {
          p_title: payload.title,
          p_company_name: payload.company_name,
          p_location_text: payload.location_text,
          p_employment_type: payload.employment_type,
          p_work_mode: payload.work_mode,
          p_stipend_salary_label: payload.stipend_salary_label ?? null,
          p_stipend_min: payload.stipend_min ?? null,
          p_stipend_max: payload.stipend_max ?? null,
          p_currency_code: payload.currency_code ?? "INR",
          p_application_url: payload.application_url,
          p_is_pre_placement_offer: Boolean(payload.is_pre_placement_offer),
          p_tag_pills: payload.tag_pills ?? [],
          p_expires_at: payload.expires_at ?? null,
          p_target_groups: targetGroupsPayload,
        }));

        if (error) {
          console.error("RPC Error:", error);
          throw new Error(error.message || "Failed to add job");
        }

        const row = Array.isArray(data) ? data[0] : data;
        return {
          job_id: row?.job_id,
          inserted_targets: row?.inserted_targets ?? 0,
        };
      } finally {
        setAddJobLoading(false);
      }
    },
    [ensureSession, userEmail],
  );

  useEffect(() => {
    refreshAdminStatus();
    refreshGroups();
  }, [refreshAdminStatus, refreshGroups]);

  return {
    canAddJob,
    checking,
    addJobLoading,
    branches,
    savedGroups,
    groupsLoading,
    refreshAdminStatus,
    refreshGroups,
    createBranchGroup,
    addJob,
  };
}
