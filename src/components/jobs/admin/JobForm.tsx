import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, X, Building, MapPin, Link as LinkIcon, Calendar, CheckCircle2, ShieldAlert } from "lucide-react";
import { SavedBranchGroup } from "@/hooks/useJobsAdmin";
import { cn } from "@/lib/utils";

export interface JobFormData {
  title: string;
  company_name: string;
  location_text: string;
  employment_type: "internship" | "full_time" | "part_time" | "contract";
  work_mode: "onsite" | "remote" | "hybrid";
  stipend_salary_label: string;
  application_url: string;
  tag_pills: string;
  expires_at: string;
  target_batches: string[]; // Changed to array
  selected_manual_branches: string[];
  selected_group_ids: string[];
}

export interface JobFormProps {
  mode: "create" | "review";
  initialData?: Partial<JobFormData>;
  availableBranches: string[];
  savedGroups: SavedBranchGroup[];
  loading?: boolean;
  onSubmit?: (data: JobFormData) => Promise<void>;
  onApprove?: (data: JobFormData) => Promise<void>;
  onReject?: (reason: string) => Promise<void>;
  onCreateGroup?: (name: string, branches: string[]) => Promise<void>;
}

export function JobForm({
  mode,
  initialData,
  availableBranches,
  savedGroups,
  loading,
  onSubmit,
  onApprove,
  onReject,
  onCreateGroup,
}: JobFormProps) {
  // Setup default exactly 7 days from now for expiry
  const defaultExpiry = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16); // format for datetime-local
  }, []);

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    company_name: "",
    location_text: "",
    employment_type: "internship",
    work_mode: "onsite",
    stipend_salary_label: "",
    application_url: "",
    tag_pills: "",
    expires_at: defaultExpiry,
    target_batches: ["2027"], // Changed to array
    selected_manual_branches: [],
    selected_group_ids: [],
  });

  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Group creation state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupBranches, setNewGroupBranches] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Sync initialData when provided (useful for Review mode)
  useEffect(() => {
    if (initialData) {
      // Map singular to plural if coming from old pending_jobs column
      const data = { ...initialData };
      if ((data as any).target_batch && !data.target_batches) {
        data.target_batches = [String((data as any).target_batch)];
      }
      setFormData((prev) => ({ 
        ...prev, 
        ...data,
        // Ensure arrays are preserved
        target_batches: data.target_batches || prev.target_batches,
        selected_manual_branches: data.selected_manual_branches || prev.selected_manual_branches,
        selected_group_ids: data.selected_group_ids || prev.selected_group_ids
      }));
    }
  }, [initialData]);

  const handleChange = (field: keyof JobFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleBatch = (batch: string) => {
    setFormData(prev => {
      const current = prev.target_batches || [];
      return {
        ...prev,
        target_batches: current.includes(batch) 
           ? current.filter(b => b !== batch) 
           : [...current, batch]
      };
    });
  };

  const toggleBranch = (branch: string) => {
    setFormData((prev) => {
      const isSelected = prev.selected_manual_branches.includes(branch);
      return {
        ...prev,
        selected_manual_branches: isSelected
          ? prev.selected_manual_branches.filter((b) => b !== branch)
          : [...prev.selected_manual_branches, branch],
      };
    });
  };

  const toggleGroup = (groupId: string) => {
    setFormData((prev) => {
      const isSelected = prev.selected_group_ids.includes(groupId);
      return {
        ...prev,
        selected_group_ids: isSelected
          ? prev.selected_group_ids.filter((g) => g !== groupId)
          : [...prev.selected_group_ids, groupId],
      };
    });
  };

  const toggleNewGroupBranch = (branch: string) => {
    setNewGroupBranches((prev) => 
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );
  };

  const handleCreateGroup = async () => {
    if (!onCreateGroup) return;
    if (!newGroupName.trim() || newGroupBranches.length === 0) return;

    setCreatingGroup(true);
    try {
      await onCreateGroup(newGroupName.trim(), newGroupBranches);
      setNewGroupName("");
      setNewGroupBranches([]);
    } finally {
      setCreatingGroup(false);
    }
  };

  const isSubmitDisabled = useMemo(() => {
    if (!formData.title.trim() || !formData.company_name.trim() || !formData.location_text.trim() || !formData.application_url.trim()) return true;
    if (formData.target_batches.length === 0) return true;

    // Branches derived from groups + manual branches
    const selectedGroupBranches = savedGroups
      .filter((group) => formData.selected_group_ids.includes(group.group_id))
      .flatMap((group) => group.branches || []);

    const allBranches = new Set([
      ...formData.selected_manual_branches,
      ...selectedGroupBranches,
    ].map((b) => b.trim()).filter(Boolean));

    return allBranches.size === 0;
  }, [formData, savedGroups]);

  const handleAction = async (action: "submit" | "approve" | "reject") => {
    if (action === "submit" && onSubmit) {
      await onSubmit(formData);
      // Reset form if successful
      if (mode === "create") {
         setFormData({
            title: "", company_name: "", location_text: "",
            employment_type: "internship", work_mode: "onsite",
            stipend_salary_label: "", application_url: "", tag_pills: "",
            expires_at: defaultExpiry, target_batches: ["2027"],
            selected_manual_branches: [], selected_group_ids: []
         });
      }
    } else if (action === "approve" && onApprove) {
      await onApprove(formData);
    } else if (action === "reject" && onReject) {
      if (!showRejectInput) {
        setShowRejectInput(true);
        return;
      }
      await onReject(rejectionReason);
      setShowRejectInput(false);
      setRejectionReason("");
    }
  };

  return (
    <div className="glass w-full rounded-3xl border border-white/10 bg-black/60 p-6 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-pink-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />

      <div className="relative z-10 grid gap-6">
        
        {/* Row 1: Core details */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Job Title <span className="text-pink-500">*</span></Label>
            <div className="relative">
              <Input
                className="bg-white/5 border-white/10 focus:border-pink-500/50 transition-colors"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g. SDE Intern"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Company Name <span className="text-pink-500">*</span></Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                className="pl-9 bg-white/5 border-white/10 focus:border-pink-500/50"
                value={formData.company_name}
                onChange={(e) => handleChange("company_name", e.target.value)}
                placeholder="e.g. Acme Labs"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Location and URL */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Location <span className="text-pink-500">*</span></Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                className="pl-9 bg-white/5 border-white/10 focus:border-pink-500/50"
                value={formData.location_text}
                onChange={(e) => handleChange("location_text", e.target.value)}
                placeholder="e.g. Gurugram / Remote"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Application URL <span className="text-pink-500">*</span></Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                className="pl-9 bg-white/5 border-white/10 focus:border-pink-500/50"
                value={formData.application_url}
                onChange={(e) => handleChange("application_url", e.target.value)}
                placeholder="https://company.com/apply"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Standard Selects */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-zinc-300">Employment Type</Label>
             <Select value={formData.employment_type} onValueChange={(v) => handleChange("employment_type", v)}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="internship" className="focus:bg-white/10 focus:text-white">Internship</SelectItem>
                <SelectItem value="full_time" className="focus:bg-white/10 focus:text-white">Full Time</SelectItem>
                <SelectItem value="part_time" className="focus:bg-white/10 focus:text-white">Part Time</SelectItem>
                <SelectItem value="contract" className="focus:bg-white/10 focus:text-white">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Work Mode</Label>
            <Select value={formData.work_mode} onValueChange={(v) => handleChange("work_mode", v)}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="onsite" className="focus:bg-white/10 focus:text-white">Onsite</SelectItem>
                <SelectItem value="remote" className="focus:bg-white/10 focus:text-white">Remote</SelectItem>
                <SelectItem value="hybrid" className="focus:bg-white/10 focus:text-white">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Stipend / Salary</Label>
            <Input
              className="bg-white/5 border-white/10 focus:border-pink-500/50"
              value={formData.stipend_salary_label}
              onChange={(e) => handleChange("stipend_salary_label", e.target.value)}
              placeholder="e.g. INR 50k-70k PM"
            />
          </div>
        </div>

        {/* Row 4: Targeting & Tags */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-zinc-300">Target Graduation Years <span className="text-pink-500">*</span></Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {["2025", "2026", "2027", "2028"].map(year => (
                <button
                  key={year}
                  type="button"
                  onClick={() => toggleBatch(year)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                    formData.target_batches.includes(year)
                      ? "bg-pink-500/20 border-pink-500/50 text-pink-400"
                      : "bg-white/5 border-white/10 text-zinc-500 hover:border-white/20"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Expires At</Label>
             <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                type="datetime-local"
                className="pl-9 bg-white/5 border-white/10 focus:border-pink-500/50 [color-scheme:dark]"
                value={formData.expires_at}
                onChange={(e) => handleChange("expires_at", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Tag Pills</Label>
             <Input
                className="bg-white/5 border-white/10 focus:border-pink-500/50"
                value={formData.tag_pills}
                onChange={(e) => handleChange("tag_pills", e.target.value)}
                placeholder="Comma separated: CS/IT, PPO"
              />
          </div>
        </div>

        {/* Branch Targeting Section */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white/80">Target Branches <span className="text-pink-500">*</span></h3>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Use Saved Groups</Label>
              {savedGroups.length === 0 ? (
                <p className="text-sm text-zinc-600">No saved groups.</p>
              ) : (
                <div className="grid gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                  {savedGroups.map((g) => (
                    <label key={g.group_id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/5 p-3 cursor-pointer hover:bg-white/10 transition-colors">
                      <Checkbox
                        className="mt-0.5"
                        checked={formData.selected_group_ids.includes(g.group_id)}
                        onCheckedChange={() => toggleGroup(g.group_id)}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{g.group_name}</span>
                        <span className="text-xs text-zinc-400 line-clamp-1">{g.branches.join(", ")}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Specific Branches</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {availableBranches.map((branch) => (
                  <label key={branch} className="flex items-center gap-2 text-sm cursor-pointer border border-white/5 bg-white/5 p-2 rounded-md hover:bg-white/10 transition-colors">
                    <Checkbox
                      checked={formData.selected_manual_branches.includes(branch)}
                      onCheckedChange={() => toggleBranch(branch)}
                    />
                    <span className="truncate">{branch}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Create Branch Group Section */}
            {onCreateGroup && (
              <div className="grid gap-3 mt-4 rounded-xl border border-emerald-500/20 p-4 bg-emerald-500/5">
                <Label className="text-emerald-400 font-medium">Create Branch Group</Label>
                <p className="text-xs text-zinc-400">Save a preset of branches to use later.</p>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name (e.g., Core Branches)"
                  className="bg-black/50 border-emerald-500/30 text-emerald-100 placeholder:text-emerald-800"
                />

                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto mt-2 custom-scrollbar">
                  {availableBranches.map((branch) => (
                    <label key={`group-${branch}`} className="flex items-center gap-2 text-sm cursor-pointer border border-emerald-500/10 bg-black/40 p-2 rounded-md hover:bg-emerald-500/10 transition-colors text-emerald-100">
                      <Checkbox
                        checked={newGroupBranches.includes(branch)}
                        onCheckedChange={() => toggleNewGroupBranch(branch)}
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <span className="truncate">{branch}</span>
                    </label>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateGroup}
                  disabled={creatingGroup || !newGroupName.trim() || newGroupBranches.length === 0}
                  className="w-fit mt-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                >
                  {creatingGroup ? "Saving Group..." : "Save Template"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-4 mt-2">
           {mode === "create" && (
             <Button 
                onClick={() => handleAction("submit")} 
                disabled={isSubmitDisabled || loading}
                className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-none shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all"
             >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Publish Live Job
             </Button>
           )}

           {mode === "review" && (
             <div className="flex w-full flex-col sm:flex-row gap-3">
                {showRejectInput ? (
                  <div className="flex-1 flex gap-2 w-full animate-in slide-in-from-right-4">
                     <Input 
                        placeholder="Reason for rejection..." 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="bg-red-500/10 border-red-500/30 text-white placeholder:text-red-400/50"
                     />
                     <Button 
                        variant="destructive" 
                        onClick={() => handleAction("reject")}
                        disabled={loading || !rejectionReason.trim()}
                     >
                        Confirm Reject
                     </Button>
                     <Button variant="ghost" onClick={() => setShowRejectInput(false)}>
                        <X className="w-4 h-4" />
                     </Button>
                  </div>
                ) : (
                  <Button 
                     variant="outline" 
                     className="w-full sm:w-auto border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                     onClick={() => handleAction("reject")}
                     disabled={loading}
                  >
                     <ShieldAlert className="w-4 h-4 mr-2" />
                     Reject
                  </Button>
                )}
                
                {!showRejectInput && (
                   <Button 
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all sm:ml-auto"
                      onClick={() => handleAction("approve")}
                      disabled={isSubmitDisabled || loading}
                   >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Approve Job
                   </Button>
                )}
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
