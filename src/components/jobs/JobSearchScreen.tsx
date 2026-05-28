import { useMemo, useState } from "react";
import { BriefcaseBusiness, Plus, RefreshCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { useAuth } from "@/hooks/useAuth";
import { useJobsFeed } from "@/hooks/useJobsFeed";
import { useJobsAdmin } from "@/hooks/useJobsAdmin";
import { JobSwipeCard } from "@/components/discovery/JobSwipeCard";
import { JobLimitAlert } from "@/components/discovery/JobLimitAlert";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { JobAdminDashboard } from "@/components/jobs/admin/JobAdminDashboard";

interface JobSearchScreenProps {
  onNavigateToSettings?: () => void;
}

export function JobSearchScreen(_props: JobSearchScreenProps) {
  const [swipeAnimation, setSwipeAnimation] = useState<"left" | "right" | null>(null);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  const currentUserData = encryptedStorage.get("current-user");
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const userEmail = (currentUser?.email || user?.email || "").toLowerCase();

  const { jobs, status, loading, error, refetch, recordSwipe, consumeJobFromList } = useJobsFeed(userEmail || undefined);
  const {
    canAddJob,
    checking,
    addJobLoading,
    addJob,
    branches,
    savedGroups,
    groupsLoading,
    createBranchGroup,
  } = useJobsAdmin(userEmail || undefined);

  const activeJob = useMemo(() => jobs[0] ?? null, [jobs]);
  const showAdminButton = canAddJob;

  const handleSwipe = async (action: "like" | "pass") => {
    if (!activeJob || isSwiping) return;

    if (status?.is_locked) {
      setShowLimitAlert(true);
      return;
    }

    setSwipeAnimation(action === "like" ? "right" : "left");
    setIsSwiping(true);

    try {
      const result = await recordSwipe(activeJob.job_id, action);
      if (!result) return; // Debounced/locked call

      if (!result.success) throw new Error("Unable to record swipe");

      if (action === "like" && result.application_url) {
        const opened = window.open(result.application_url, "_blank", "noopener,noreferrer");
        if (!opened) {
          toast({
            title: "Popup Blocked",
            description: "Please allow popups to open the application link automatically.",
            variant: "destructive",
          });
        }
      }

      setTimeout(() => {
        consumeJobFromList(activeJob.job_id);
        setSwipeAnimation(null);
        setIsSwiping(false);
        void refetch(true); // background refetch
      }, 260);

      if (result.is_locked) {
        setShowLimitAlert(true);
      }
    } catch (err: any) {
      if (err?.message === "ALREADY_SWIPED" || (err?.details && err.details.includes("ALREADY_SWIPED"))) {
        console.log("Job already swiped, moving to next.");
        setTimeout(() => {
          consumeJobFromList(activeJob.job_id);
          setSwipeAnimation(null);
          setIsSwiping(false);
          void refetch(true); // background refetch
        }, 260);
      } else {
        setSwipeAnimation(null);
        setIsSwiping(false);
        console.error("Swipe error details:", err);
        toast({
          title: "Swipe failed",
          description: err?.message || "Could not complete action.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmitNewJob = async (payload: any) => {
    try {
      await addJob(payload);
      toast({
        title: "Job added",
        description: "The job is now live for matching users.",
      });
      setShowAddDialog(false);
      await refetch();
    } catch (err: any) {
      toast({
        title: "Could not add job",
        description: err?.message || "Please verify form values and retry.",
        variant: "destructive",
      });
    }
  };

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-black text-white">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold">Loading Job Feed...</h3>
            <p className="text-zinc-400">Preparing your two daily opportunities</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-white px-6">
        <div className="space-y-3 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-cyan-400" />
          <h2 className="text-xl font-bold">Sign in required</h2>
          <p className="text-sm text-zinc-300">Login to use the swipeable job and internship feed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-black text-white overflow-hidden">
      <JobLimitAlert isOpen={showLimitAlert} onClose={() => setShowLimitAlert(false)} />
      
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[100vw] w-screen h-screen sm:max-w-5xl sm:h-[90vh] p-0 border-zinc-800 bg-black/95 backdrop-blur-3xl overflow-hidden m-0 sm:rounded-2xl">
          <div className="sr-only">
            <DialogTitle>Job Administration Dashboard</DialogTitle>
            <DialogDescription>Manage jobs manually or review scraped jobs.</DialogDescription>
          </div>
          
          <div className="relative w-full h-full overflow-y-auto">
            {/* Close button layered on top */}
            <button 
              onClick={() => { setShowAddDialog(false); void refetch(); }} 
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/10"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
            <JobAdminDashboard userEmail={userEmail} />
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative w-full flex items-center justify-between px-4 py-1 h-16">
        <div className="flex-1">
          <p className="text-3xl md:text-4xl font-extrabold leading-tight">JOBS FEED</p>
          <div className="absolute left-0 right-0 bottom-0 h-px bg-white/10" />
        </div>

        <div className="flex items-center gap-2" />

        {/* centered small admin button */}
        {showAdminButton && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="h-7 w-7 p-0 rounded-full border border-emerald-400/20 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center"
              title="Admin Panel"
            >
              <Plus className="h-3 w-3 text-emerald-300" />
            </Button>
          </div>
        )}

        {/* remaining count at far right (explicit, plural-aware) */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium text-zinc-400">
          {status
            ? `${Math.max(0, status.remaining_to_interact)} interaction${Math.max(0, status.remaining_to_interact) === 1 ? "" : "s"} left`
            : null}
        </div>
      </div>

      <div className="flex-1 relative flex items-start justify-center pt-0">
        {error ? (
          <div className="text-center space-y-3 px-6 mt-20 animate-fade-in">
            <h2 className="text-lg font-bold">Could not load jobs</h2>
            <p className="text-zinc-400 text-xs">{error}</p>
            <Button onClick={() => void refetch()} className="rounded-full">Retry</Button>
          </div>
        ) : status?.is_locked ? (
          <div className="text-center space-y-4 px-6 mt-20 animate-fade-in">
            <Sparkles className="h-10 w-10 text-amber-400/70 mx-auto" />
            <h2 className="text-lg font-bold">Daily limit reached</h2>
            <p className="text-zinc-400 text-xs">
              You already interacted with {status?.daily_limit ?? 2} job{(status?.daily_limit ?? 2) === 1 ? "" : "s"} today. Feed unlocks at midnight IST.
            </p>
          </div>
        ) : !activeJob ? (
          <div className="text-center space-y-4 px-6 mt-20 animate-fade-in">
            <Sparkles className="h-10 w-10 text-cyan-500/60 mx-auto" />
            <h2 className="text-lg font-bold">No jobs available right now</h2>
            <p className="text-zinc-400 text-xs">No active jobs currently match your branch and graduation batch.</p>
            {status && status.remaining_to_interact > 0 && (
              <Button onClick={() => void refetch()} className="rounded-full" variant="secondary">Refresh</Button>
            )}
          </div>
        ) : (
          <div className="relative w-[92%] max-w-[400px] h-[75dvh]">
            <div
              className={`relative w-full h-full transition-all duration-300 ${
                swipeAnimation === "left" ? "swipe-left" : swipeAnimation === "right" ? "swipe-right" : ""
              }`}
            >
              <div
                className={`absolute inset-0 rounded-3xl border-4 transition-all duration-200 z-10 pointer-events-none ${
                  swipeAnimation === "right"
                    ? "border-green-500 bg-green-500/20 animate-pulse-glow"
                    : swipeAnimation === "left"
                      ? "border-red-500 bg-red-500/20 animate-pulse-glow"
                      : "border-transparent"
                }`}
              />

              <JobSwipeCard
                job={activeJob}
                onLike={() => handleSwipe("like")}
                onPass={() => handleSwipe("pass")}
                disabled={isSwiping}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
