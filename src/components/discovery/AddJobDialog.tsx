import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AddJobInput, SavedBranchGroup } from "@/hooks/useJobsAdmin";
import { Checkbox } from "@/components/ui/checkbox";

interface AddJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  availableBranches: string[];
  savedGroups: SavedBranchGroup[];
  groupsLoading?: boolean;
  onCreateGroup: (groupName: string, branches: string[]) => Promise<void>;
  onSubmit: (payload: AddJobInput) => Promise<void>;
}

export function AddJobDialog({
  open,
  onOpenChange,
  loading,
  availableBranches,
  savedGroups,
  groupsLoading,
  onCreateGroup,
  onSubmit,
}: AddJobDialogProps) {
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [locationText, setLocationText] = useState("");
  const [employmentType, setEmploymentType] = useState<"internship" | "full_time" | "part_time" | "contract">("internship");
  const [workMode, setWorkMode] = useState<"onsite" | "remote" | "hybrid">("onsite");
  const [stipendLabel, setStipendLabel] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [tags, setTags] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [targetBatch, setTargetBatch] = useState("2027");
  const [selectedManualBranches, setSelectedManualBranches] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupBranches, setNewGroupBranches] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const isSubmitDisabled = useMemo(() => {
    if (!title.trim() || !companyName.trim() || !locationText.trim() || !applicationUrl.trim()) return true;
    if (!/^\d{4}$/.test(targetBatch.trim())) return true;

    const selectedGroupBranches = savedGroups
      .filter((group) => selectedGroupIds.includes(group.group_id))
      .flatMap((group) => group.branches || []);

    const allBranches = new Set(
      [...selectedManualBranches, ...selectedGroupBranches]
        .map((branch) => branch.trim())
        .filter(Boolean),
    );

    return allBranches.size === 0;
  }, [
    applicationUrl,
    companyName,
    locationText,
    savedGroups,
    selectedGroupIds,
    selectedManualBranches,
    targetBatch,
    title,
  ]);

  const toggleValue = (values: string[], value: string) => {
    if (values.includes(value)) return values.filter((v) => v !== value);
    return [...values, value];
  };

  const reset = () => {
    setTitle("");
    setCompanyName("");
    setLocationText("");
    setEmploymentType("internship");
    setWorkMode("onsite");
    setStipendLabel("");
    setApplicationUrl("");
    setTags("");
    setExpiresAt("");
    setTargetBatch("2027");
    setSelectedManualBranches([]);
    setSelectedGroupIds([]);
    setNewGroupName("");
    setNewGroupBranches([]);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    if (newGroupBranches.length === 0) return;

    setCreatingGroup(true);
    try {
      await onCreateGroup(newGroupName.trim(), newGroupBranches);
      setNewGroupName("");
      setNewGroupBranches([]);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSubmit = async () => {
    const selectedGroupBranches = savedGroups
      .filter((group) => selectedGroupIds.includes(group.group_id))
      .flatMap((group) => group.branches || []);

    const uniqueBranches = Array.from(
      new Set(
        [...selectedManualBranches, ...selectedGroupBranches]
          .map((branch) => branch.trim())
          .filter(Boolean),
      ),
    );

    const batchStr = targetBatch.trim();
    const cleanedTargetGroups = uniqueBranches.map((branch) => ({
      branch: branch.trim(),
      graduation_batch: batchStr,
    }));

    await onSubmit({
      title: title.trim(),
      company_name: companyName.trim(),
      location_text: locationText.trim(),
      employment_type: employmentType,
      work_mode: workMode,
      stipend_salary_label: stipendLabel.trim() || undefined,
      application_url: applicationUrl.trim(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      tag_pills: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      target_groups: cleanedTargetGroups,
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-zinc-950 text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
          <DialogDescription className="text-zinc-300">
            This is admin-only. Add role details and target groups (Branch + Graduation Batch).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Job Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="SDE Intern" />
          </div>

          <div className="grid gap-2">
            <Label>Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Labs" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Employment Type</Label>
              <Select value={employmentType} onValueChange={(value) => setEmploymentType(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Work Mode</Label>
              <Select value={workMode} onValueChange={(value) => setWorkMode(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="Gurugram / Remote" />
            </div>
            <div className="grid gap-2">
              <Label>Stipend / Salary Label</Label>
              <Input value={stipendLabel} onChange={(e) => setStipendLabel(e.target.value)} placeholder="est. INR 50k-70k" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Application URL</Label>
            <Input value={applicationUrl} onChange={(e) => setApplicationUrl(e.target.value)} placeholder="https://company.com/apply" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Tag Pills (comma-separated)</Label>
              <Textarea
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="CS/IT Only, PPO, Strong DSA"
                className="min-h-[70px]"
              />
            </div>
            <div className="grid gap-2">
              <Label>Expires At</Label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 p-3">
            <div className="grid gap-2 mb-4">
              <Label>Target Graduation Batch</Label>
              <Input
                value={targetBatch}
                onChange={(e) => setTargetBatch(e.target.value)}
                placeholder="2027"
                className="max-w-[180px]"
              />
            </div>

            <div className="grid gap-3">
              <Label>Use Saved Groups</Label>
              {groupsLoading ? (
                <p className="text-xs text-zinc-400">Loading groups...</p>
              ) : savedGroups.length === 0 ? (
                <p className="text-xs text-zinc-400">No saved groups yet.</p>
              ) : (
                <div className="grid gap-2 rounded-md border border-white/10 p-3 max-h-[160px] overflow-y-auto">
                  {savedGroups.map((group) => (
                    <label key={group.group_id} className="flex items-start gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedGroupIds.includes(group.group_id)}
                        onCheckedChange={() => {
                          setSelectedGroupIds((prev) => toggleValue(prev, group.group_id));
                        }}
                      />
                      <span>
                        <span className="font-semibold">{group.group_name}</span>
                        <span className="text-xs text-zinc-400 block">
                          {group.branches.join(", ")}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3 mt-4">
              <Label>Additional Branches</Label>
              {availableBranches.length === 0 ? (
                <p className="text-xs text-zinc-400">No branches found in database.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 rounded-md border border-white/10 p-3 max-h-[160px] overflow-y-auto">
                  {availableBranches.map((branch) => (
                    <label key={branch} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedManualBranches.includes(branch)}
                        onCheckedChange={() => {
                          setSelectedManualBranches((prev) => toggleValue(prev, branch));
                        }}
                      />
                      <span>{branch}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3 mt-4 rounded-md border border-emerald-500/20 p-3 bg-emerald-500/5">
              <Label>Create / Save Branch Group</Label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name (e.g., Computer)"
              />

              <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
                {availableBranches.map((branch) => (
                  <label key={`group-${branch}`} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={newGroupBranches.includes(branch)}
                      onCheckedChange={() => {
                        setNewGroupBranches((prev) => toggleValue(prev, branch));
                      }}
                    />
                    <span>{branch}</span>
                  </label>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleCreateGroup}
                disabled={creatingGroup || !newGroupName.trim() || newGroupBranches.length === 0}
                className="w-fit"
              >
                {creatingGroup ? "Saving Group..." : "Save Group"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading || isSubmitDisabled}>
            {loading ? "Saving..." : "Add Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
