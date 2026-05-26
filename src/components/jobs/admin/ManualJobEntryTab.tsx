import { useState, useMemo } from "react";
import { useJobsAdmin } from "@/hooks/useJobsAdmin";
import { useToast } from "@/hooks/use-toast";
import { JobForm, JobFormData } from "./JobForm";
import { Briefcase, Sparkles } from "lucide-react";

export function ManualJobEntryTab({ userEmail }: { userEmail?: string }) {
  const { toast } = useToast();
  const { addJob, branches, savedGroups, groupsLoading, createBranchGroup } = useJobsAdmin(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: JobFormData) => {
    setIsSubmitting(true);
    try {
      // Resolve which exact branches are targeted
      const selectedGroupBranches = savedGroups
        .filter((group) => formData.selected_group_ids.includes(group.group_id))
        .flatMap((group) => group.branches || []);

      const uniqueBranches = Array.from(
        new Set(
          [...formData.selected_manual_branches, ...selectedGroupBranches]
            .map((b) => b.trim())
            .filter(Boolean)
        )
      );

      const targetGroupsFormatted = formData.target_batches.flatMap((batch) => {
        const batchInt = parseInt(batch, 10);
        return uniqueBranches.map((branch) => ({ branch, graduation_batch: batchInt }));
      });

      const tagsFormatted = formData.tag_pills
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const expiryDate = formData.expires_at 
         ? new Date(formData.expires_at).toISOString() 
         : null;

      await addJob({
        title: formData.title,
        company_name: formData.company_name,
        location_text: formData.location_text,
        employment_type: formData.employment_type,
        work_mode: formData.work_mode,
        stipend_salary_label: formData.stipend_salary_label || undefined,
        application_url: formData.application_url,
        tag_pills: tagsFormatted,
        expires_at: expiryDate,
        target_groups: targetGroupsFormatted,
      });

      toast({
        title: "Success! 🚀",
        description: "Job has been published to the live feed for matching users.",
      });

    } catch (err: any) {
      console.error("Manual job creation failed:", err);
      toast({
        title: "Failed to publish job",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pt-4 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-400">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Manual Post <Sparkles className="w-4 h-4 text-pink-500" />
          </h2>
          <p className="text-sm text-zinc-400">Push a job directly to the live feed bypassing pending review.</p>
        </div>
      </div>

      <div className="w-full">
         <JobForm
           mode="create"
           availableBranches={branches}
           savedGroups={savedGroups}
           onSubmit={handleSubmit}
           onCreateGroup={createBranchGroup}
           loading={isSubmitting || groupsLoading}
         />
      </div>
    </div>
  );
}
