import { useCallback, useEffect, useMemo, useState } from "react";
import { usePendingJobsAdmin, PendingJob, PendingQueueSort } from "@/hooks/usePendingJobsAdmin";
import { useJobsAdmin } from "@/hooks/useJobsAdmin";
import { useToast } from "@/hooks/use-toast";
import { JobForm, JobFormData } from "./JobForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, CopySlash, ExternalLink, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function PendingJobsApprovalTab({ userEmail }: { userEmail?: string }) {
  const { toast } = useToast();
  const { pendingJobs, loading, fetchPending, fetchCount, approveJob, rejectJob, bulkRejectJobs } = usePendingJobsAdmin(userEmail);
  const { branches, savedGroups, groupsLoading, refreshGroups } = useJobsAdmin(userEmail);

  const [selectedJob, setSelectedJob] = useState<PendingJob | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [quickActionJobId, setQuickActionJobId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<PendingQueueSort>("newest");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === pendingJobs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingJobs.map(j => j.id)));
    }
  };

  // Branch Grouping Logic
  const groupedBranches = useMemo(() => {
    const groups: Record<string, string[]> = {
      "Computer/IT": ["Computer Science", "Information Technology", "Software Engineering", "AI & ML", "Data Science", "Cyber Security"],
      "Electrical/Electronics": ["ECE", "Electronics", "Electrical", "EE", "IOT", "Instrumentation"],
      "Core Engineering": ["Mechanical", "Civil", "Mechanical & Automation", "Production", "PIE", "Civil & Structural"],
      "Chemical/Bio": ["Chemical", "Biotechnology", "Food Technology"],
      "Others": []
    };

    const allGrouped = Object.values(groups).flat();
    const availableOthers = branches.filter(b => !allGrouped.includes(b));
    groups["Others"] = availableOthers;

    return groups;
  }, [branches]);

  const activeFilters = useMemo(() => ({
      sortBy,
      branchFilter: branchFilter?.startsWith("GROUP:") ? null : (branchFilter === "all" ? null : branchFilter),
      branchList: branchFilter?.startsWith("GROUP:") ? groupedBranches[branchFilter.replace("GROUP:", "")] : null,
      batchFilter: batchFilter === "all" ? null : Number.parseInt(batchFilter, 10),
      expiringBefore: expiringSoonOnly ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
   }), [sortBy, branchFilter, groupedBranches, batchFilter, expiringSoonOnly]);
   const queueBatches = useMemo(() => {
      const set = new Set<number>();
      for (const job of pendingJobs) {
         if (job.guessed_batch) set.add(job.guessed_batch);
      }
      return Array.from(set).sort((a, b) => a - b);
   }, [pendingJobs]);

   const loadQueue = useCallback(async () => {
      await fetchPending(0, 40, activeFilters);
      await fetchCount();
   }, [activeFilters, fetchCount, fetchPending]);

   useEffect(() => {
      void refreshGroups();
   }, [refreshGroups]);

   useEffect(() => {
      void loadQueue();
   }, [loadQueue]);

   const toDateTimeLocalValue = (iso: string | null | undefined) => {
      if (!iso) return "";
      const parsed = new Date(iso);
      if (Number.isNaN(parsed.getTime())) return "";
      return parsed.toISOString().slice(0, 16);
   };

   const inferFallbackBatch = (employmentType: PendingJob["employment_type"]) => {
      const currentYear = new Date().getFullYear();
      return employmentType === "internship" ? currentYear + 2 : currentYear + 1;
   };

   const getGuessedBatch = (job: PendingJob) => {
      if (job.guessed_batch) return job.guessed_batch;
      for (const tag of job.tag_pills) {
         const match = tag.match(/^(\d{4})\s+Batch$/i);
         if (match) return parseInt(match[1], 10);
      }
      return null;
   };

   const mapGuessedBranchesToSystem = (guessed: string[], systemBranches: string[]): string[] => {
      const mapped = new Set<string>();
      guessed.forEach(gb => {
         const norm = gb.toLowerCase().trim();
         
         const exactMatch = systemBranches.find(sb => sb.toLowerCase() === norm);
         if (exactMatch) {
            mapped.add(exactMatch);
            return;
         }

         if (norm === "cs/it") {
            systemBranches.forEach(sb => {
               const lsb = sb.toLowerCase();
               if (lsb.includes("computer") || lsb.includes("information technology") || lsb.includes("software")) {
                  mapped.add(sb);
               }
            });
         } else if (norm === "ece") {
            systemBranches.forEach(sb => {
               const lsb = sb.toLowerCase();
               if (lsb.includes("ece") || lsb.includes("electronics")) {
                  mapped.add(sb);
               }
            });
         } else if (norm === "ee") {
            systemBranches.forEach(sb => {
               const lsb = sb.toLowerCase();
               if (lsb.includes("ee") || lsb.includes("electrical")) {
                  mapped.add(sb);
               }
            });
         } else if (norm === "mechanical") {
            systemBranches.forEach(sb => {
               const lsb = sb.toLowerCase();
               if (lsb.includes("mechanical")) {
                  mapped.add(sb);
               }
            });
         } else if (norm === "civil") {
            systemBranches.forEach(sb => {
               const lsb = sb.toLowerCase();
               if (lsb.includes("civil")) {
                  mapped.add(sb);
               }
            });
         } else if (norm === "pie") {
            systemBranches.forEach(sb => {
               const lsb = sb.toLowerCase();
               if (lsb.includes("pie") || lsb.includes("production") || lsb.includes("industrial")) {
                  mapped.add(sb);
               }
            });
         } else {
            systemBranches.forEach(sb => {
               const lsb = sb.toLowerCase();
               if (lsb.includes(norm) || norm.includes(lsb)) {
                  mapped.add(sb);
               }
            });
         }
      });

      if (mapped.size === 0) {
         const allBranchesOpt = systemBranches.find(sb => sb.toLowerCase() === "all branches");
         if (allBranchesOpt) {
            mapped.add(allBranchesOpt);
         } else {
            guessed.forEach(g => mapped.add(g));
         }
      }
      return Array.from(mapped);
   };

    const isComputerRelated = (job: PendingJob): boolean => {
       const text = (job.title + " " + (job.description || "")).toLowerCase();
       const keywords = [
          "computer", "software", "developer", "frontend", "backend", "fullstack", "sde", 
          "ai", "artificial intelligence", "machine learning", "data science", "cyber", 
          "web", "coding", "programmer", "it", "cs/it", "cs"
       ];
       if (keywords.some(kw => text.includes(kw))) {
          return true;
       }
       if (job.guessed_branches) {
          const lowerGuessed = job.guessed_branches.map(b => b.toLowerCase());
          if (lowerGuessed.some(b => b.includes("cs/it") || b.includes("data science") || b.includes("cybersecurity"))) {
             return true;
          }
       }
       return false;
    };

    const getQuickTargetGroups = (job: PendingJob) => {
       let finalBranches: string[] = [];
       const filterGroup = branchFilter?.startsWith("GROUP:") ? branchFilter.replace("GROUP:", "") : null;
       
       if (filterGroup && groupedBranches[filterGroup]) {
          finalBranches = groupedBranches[filterGroup];
       } else if (isComputerRelated(job)) {
          // Send to the computer target group
          const exactNewComputer = savedGroups.find(g => g.group_name.toLowerCase() === "new computer");
          const computerGroup = exactNewComputer || savedGroups.find(g => {
             const name = g.group_name.toLowerCase();
             return name.includes("computer") || name.includes("cs/it") || name.includes("cs") || name.includes("it");
          });
          if (computerGroup && computerGroup.branches && computerGroup.branches.length > 0) {
             finalBranches = computerGroup.branches;
          } else {
             // Fallback computer/IT branches in our system
             finalBranches = ["Computer Science", "Information Technology", "Software Engineering", "AI & ML", "Data Science", "Cyber Security"];
          }
       } else if (job.guessed_branches && job.guessed_branches.length > 0) {
          finalBranches = mapGuessedBranchesToSystem(job.guessed_branches, branches);
       } else {
          finalBranches = ["All Branches"];
       }

       // Get quick batches
       const finalBatches: number[] = [];
       const currentYear = new Date().getFullYear();
       const allBatches = Array.from({ length: 5 }, (_, i) => currentYear + i); // e.g. [2026, 2027, 2028, 2029, 2030]

       const needsReview = job.tag_pills.some(t => t.toLowerCase().includes("needs review"));
       if (needsReview) {
          allBatches.forEach(b => finalBatches.push(b));
       } else {
          // Look in tag pills for specific batch years
          for (const tag of job.tag_pills) {
             const match = tag.match(/^(\d{4})\s+Batch$/i);
             if (match) {
                finalBatches.push(parseInt(match[1], 10));
             }
          }
          if (finalBatches.length === 0) {
             const guessed = getGuessedBatch(job);
             if (guessed) {
                finalBatches.push(guessed);
             } else {
                finalBatches.push(2027);
             }
          }
       }

        // Map to target groups payload
        const targetGroups: { branch: string; graduation_batch: number }[] = [];
        finalBranches.forEach((branch) => {
           if (!branch || !branch.trim()) return;
           finalBatches.forEach((batch) => {
              if (!batch || Number.isNaN(batch)) return;
              targetGroups.push({
                 branch: branch.trim(),
                 graduation_batch: batch,
              });
           });
        });

        if (targetGroups.length === 0) {
           targetGroups.push({
              branch: "All Branches",
              graduation_batch: 2027
           });
        }

        return targetGroups;
     };

  const handleApprove = async (formData: JobFormData) => {
    if (!selectedJob) return;
    setIsActionLoading(true);
    try {
      const selectedGroupBranches = savedGroups
        .filter((group) => formData.selected_group_ids.includes(group.group_id))
        .flatMap((group) => group.branches || []);

      const uniqueBranches = Array.from(
        new Set([...formData.selected_manual_branches, ...selectedGroupBranches].map(b => b.trim()).filter(Boolean))
      );

      if (uniqueBranches.length === 0) {
          throw new Error("You must select at least one target branch.");
      }

      const targetGroupsFormatted = uniqueBranches.flatMap((branch) => 
        formData.target_batches.map(batchStr => ({
          branch: branch,
          graduation_batch: parseInt(batchStr.trim(), 10),
        }))
      );

      const expiryDate = formData.expires_at ? new Date(formData.expires_at).toISOString() : null;

      await approveJob(selectedJob.id, targetGroupsFormatted, expiryDate);
      toast({ title: "Approved! ✅", description: "Job published to the live matching feed." });
      setSelectedJob(null);
         await loadQueue();
    } catch (err: any) {
      toast({ title: "Failed to approve", description: err.message, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
     if (!selectedJob) return;
     setIsActionLoading(true);
     try {
        await rejectJob(selectedJob.id, reason);
        toast({ title: "Job Rejected ❌", description: "Job has been removed from the pending queue." });
        setSelectedJob(null);
            await loadQueue();
     } catch (err: any) {
        toast({ title: "Failed to reject", description: err.message, variant: "destructive" });
     } finally {
        setIsActionLoading(false);
     }
  };

   const handleQuickApprove = async (event: React.MouseEvent, job: PendingJob) => {
      event.stopPropagation();
      setQuickActionJobId(job.id);
      try {
         const targetGroups = getQuickTargetGroups(job);
         await approveJob(job.id, targetGroups, job.expires_at || null);
         toast({ title: "Approved", description: "Job moved to live feed." });
         await loadQueue();
      } catch (err: any) {
         toast({
            title: "Quick approve failed",
            description: err?.message || "Open the job and review manually.",
            variant: "destructive",
         });
      } finally {
         setQuickActionJobId(null);
      }
   };

   const handleQuickReject = async (event: React.MouseEvent, job: PendingJob) => {
      event.stopPropagation();
      setQuickActionJobId(job.id);
      try {
         await rejectJob(job.id, "Rejected from review queue quick action");
         toast({ title: "Rejected", description: "Job removed from pending queue." });
         await loadQueue();
      } catch (err: any) {
         toast({
            title: "Quick reject failed",
            description: err?.message || "Please retry.",
            variant: "destructive",
         });
      } finally {
         setQuickActionJobId(null);
      }
   };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    setIsActionLoading(true);
    try {
      await bulkRejectJobs(Array.from(selectedIds), "Bulk rejected from queue");
      toast({ title: "Bulk Rejected ❌", description: `${selectedIds.size} jobs removed.` });
      setSelectedIds(new Set());
    } catch (err: any) {
      toast({ title: "Bulk reject failed", description: err.message, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsActionLoading(true);
    let successCount = 0;
    let failCount = 0;
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
         const job = pendingJobs.find(j => j.id === id);
         if (!job) continue;
         try {
            const targetGroups = getQuickTargetGroups(job);
            await approveJob(job.id, targetGroups, job.expires_at || null);
            successCount++;
         } catch (err) {
            console.error(`Failed to approve ${job.id}:`, err);
            failCount++;
         }
      }
      toast({ 
         title: "Bulk Approval Complete ✅", 
         description: `Approved ${successCount} jobs successfully.${failCount > 0 ? ` Failed to approve ${failCount} jobs.` : ''}` 
      });
      setSelectedIds(new Set());
      await loadQueue();
    } catch (err: any) {
      toast({ title: "Bulk approve failed", description: err.message, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pt-4 pb-12">
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
           <h2 className="text-xl font-bold flex items-center gap-2">Review Queue</h2>
           <p className="text-sm text-zinc-400">Review jobs fetched by the automated scraping engine.</p>
        </div>
        <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  size="sm" 
                  onClick={handleBulkApprove} 
                  disabled={isActionLoading}
                >
                  Approve Selected ({selectedIds.size})
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleBulkReject} 
                  disabled={isActionLoading}
                >
                  Reject Selected ({selectedIds.size})
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => void loadQueue()} disabled={loading} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Refresh Queue
            </Button>
        </div>
      </div>

         <div className="mb-5 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as PendingQueueSort)}>
               <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Sort by" />
               </SelectTrigger>
               <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="expiry_soon">Expiry Soon</SelectItem>
                  <SelectItem value="batch_desc">Batch (High to Low)</SelectItem>
                  <SelectItem value="company_az">Company A-Z</SelectItem>
               </SelectContent>
            </Select>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
               <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter branch" />
               </SelectTrigger>
               <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-[400px]">
                  <SelectItem value="all">All Branches</SelectItem>
                  {Object.entries(groupedBranches).map(([groupName, branches]) => (
                    branches.length > 0 && (
                      <div key={groupName} className="px-2 py-2 border-b border-white/5 last:border-0">
                        <SelectItem value={`GROUP:${groupName}`} className="font-bold text-pink-400 bg-pink-500/5 hover:bg-pink-500/10 mb-1">
                          ALL {groupName.toUpperCase()}
                        </SelectItem>
                        {branches.map(branch => (
                          <SelectItem key={branch} value={branch} className="pl-6">
                            {branch}
                          </SelectItem>
                        ))}
                      </div>
                    )
                  ))}
               </SelectContent>
            </Select>

            <Select value={batchFilter} onValueChange={setBatchFilter}>
               <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter batch" />
               </SelectTrigger>
               <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  <SelectItem value="all">All Batches</SelectItem>
                  {queueBatches.map((batch) => (
                     <SelectItem key={String(batch)} value={String(batch)}>{batch}</SelectItem>
                  ))}
               </SelectContent>
            </Select>

            <div className="h-10 px-3 rounded-md border border-white/10 bg-white/5 flex items-center justify-between">
               <span className="text-sm text-zinc-300">Only expiring in 3 days</span>
               <Checkbox checked={expiringSoonOnly} onCheckedChange={(checked) => setExpiringSoonOnly(Boolean(checked))} />
            </div>
         </div>

      <div className="mb-4 flex items-center gap-2 px-2">
        <Checkbox 
          id="select-all" 
          checked={pendingJobs.length > 0 && selectedIds.size === pendingJobs.length}
          onCheckedChange={selectAll}
        />
        <label htmlFor="select-all" className="text-sm text-zinc-400 cursor-pointer">
          Select All on Page
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : pendingJobs.length === 0 ? (
        <div className="text-center py-20 border border-white/10 rounded-3xl bg-white/[0.02]">
           <CopySlash className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
           <h3 className="text-xl font-medium text-zinc-300">All Caught Up!</h3>
           <p className="text-zinc-500 mt-2">No pending jobs in the queue right now.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingJobs.map(job => (
             <div 
                key={job.id} 
                className="p-5 rounded-2xl border border-white/10 bg-black/40 hover:bg-white/5 transition-all group cursor-pointer flex flex-col shadow-sm hover:shadow-pink-500/10 hover:border-pink-500/30" 
                onClick={() => setSelectedJob(job)}
             >
                <div className="flex-1">
                   <div className="flex justify-between items-start mb-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                            <Checkbox 
                               checked={selectedIds.has(job.id)}
                               onCheckedChange={() => toggleSelect(job.id)}
                               className="border-white/20 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                            />
                            <div className="text-[10px] text-pink-400 font-bold uppercase tracking-widest bg-pink-500/10 px-2 py-0.5 rounded-full">
                                {job.source_api || "Scraper"}
                            </div>
                        </div>
                   </div>
                   <h4 className="font-bold text-lg leading-tight mb-1 text-white">{job.title}</h4>
                   <p className="text-zinc-400 text-sm mb-3 font-medium">
                      {job.company_name} <span className="opacity-50 mx-1">•</span> {job.location_text}
                   </p>

                            <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                               {job.guessed_batch ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium whitespace-nowrap">
                                     Batch {job.guessed_batch}
                                  </span>
                               ) : null}
                               {job.expires_at ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium whitespace-nowrap">
                                     Expires {new Date(job.expires_at).toLocaleDateString()}
                                  </span>
                               ) : null}
                               {job.stipend_salary_label ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium whitespace-nowrap">
                                     {job.stipend_salary_label}
                                  </span>
                               ) : null}
                            </div>

                            {job.tag_pills.length > 0 && (
                               <div className="flex flex-wrap gap-1.5 mt-1">
                                  {job.tag_pills.slice(0, 4).map((pill) => (
                                     <span key={pill} className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 font-medium whitespace-nowrap">
                                        {pill}
                                     </span>
                                  ))}
                               </div>
                            )}
                   
                   {job.guessed_branches.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                         {job.guessed_branches.map(b => (
                            <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-medium whitespace-nowrap">
                              {b}
                            </span>
                         ))}
                      </div>
                   )}
                </div>
                        <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-zinc-500 gap-3">
                            <span>Fetched {new Date(job.scraped_at).toLocaleDateString()}</span>
                            <div className="flex items-center gap-2">
                               <Button
                                  type="button"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-500"
                                  disabled={quickActionJobId === job.id}
                                  onClick={(event) => void handleQuickApprove(event, job)}
                               >
                                  {quickActionJobId === job.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                                  Accept
                               </Button>
                               <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2 text-[11px]"
                                  disabled={quickActionJobId === job.id}
                                  onClick={(event) => void handleQuickReject(event, job)}
                               >
                                  {quickActionJobId === job.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
                                  Reject
                               </Button>
                               <span className="flex items-center gap-1.5 group-hover:text-pink-400 transition-colors font-medium">
                                     Review <ExternalLink className="w-3.5 h-3.5" />
                               </span>
                            </div>
                </div>
             </div>
          ))}
        </div>
      )}

      {/* Review & Edit Modal overlaying JobForm */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
         <DialogContent className="max-w-4xl p-0 border-none bg-transparent shadow-none [&>button]:hidden overflow-y-auto max-h-[95dvh] custom-scrollbar">
            {selectedJob && (
               <div className="w-full relative">
                 <button 
                    onClick={() => setSelectedJob(null)}
                    className="absolute top-4 right-4 z-50 rounded-full p-2 bg-black/50 text-white/50 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all"
                 >
                    <CopySlash className="w-4 h-4 hidden" /> {/* Dummy to import icon */}
                    <span className="sr-only">Close</span>
                 </button>
                 <JobForm 
                    mode="review"
                    availableBranches={branches}
                    savedGroups={savedGroups}
                    loading={isActionLoading || groupsLoading}
                    initialData={{
                       title: selectedJob.title,
                       company_name: selectedJob.company_name,
                       location_text: selectedJob.location_text,
                       employment_type: selectedJob.employment_type as any,
                       work_mode: selectedJob.work_mode as any,
                       stipend_salary_label: selectedJob.stipend_salary_label || "",
                       application_url: selectedJob.application_url,
                       tag_pills: selectedJob.tag_pills.join(", "),
                       target_batches: [String(getGuessedBatch(selectedJob) || 2027)],
                       expires_at: toDateTimeLocalValue(selectedJob.expires_at),
                       selected_manual_branches: mapGuessedBranchesToSystem(selectedJob.guessed_branches, branches),
                       selected_group_ids: branchFilter?.startsWith("GROUP:") 
                          ? savedGroups.filter(g => g.group_name === branchFilter.replace("GROUP:", "")).map(g => g.group_id)
                          : (() => {
                             const exactNewComputer = savedGroups.find(g => g.group_name.toLowerCase() === "new computer");
                             if (exactNewComputer) return [exactNewComputer.group_id];

                             const computerGroup = savedGroups.find(g => {
                                const name = g.group_name.toLowerCase();
                                return name.includes("computer") || name.includes("cs/it") || name.includes("cs") || name.includes("it");
                             });
                             return computerGroup ? [computerGroup.group_id] : [];
                          })()
                    }}
                    onApprove={handleApprove}
                    onReject={handleReject}
                 />
               </div>
            )}
         </DialogContent>
      </Dialog>
    </div>
  )
}
