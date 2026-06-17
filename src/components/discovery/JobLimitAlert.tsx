import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { encryptedStorage } from "@/utils/encryptedStorage";

interface JobLimitAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JobLimitAlert({ isOpen, onClose }: JobLimitAlertProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const currentUserData = encryptedStorage.get("current-user");
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const userEmail = currentUser?.email || "";

  return (
    <>
      <Dialog open={isOpen && !showUpgrade} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md overflow-hidden border border-pink-500/25 bg-black/95 text-white shadow-[0_0_0_1px_rgba(255,20,83,0.2),0_30px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl select-none">
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

            .auth-display {
              font-family: 'Bebas Neue', sans-serif;
              letter-spacing: 0.04em;
            }

            .auth-body {
              font-family: 'IBM Plex Sans', sans-serif;
            }
          `}</style>

          {/* Highlight top line accent */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
          <div className="absolute right-4 top-4 h-24 w-24 rounded-full border border-pink-500/15 bg-pink-500/8 blur-2xl pointer-events-none" />

          <div className="flex flex-col items-center gap-4 py-4 text-center">
            {/* Box-framed Lock Icon matching Login style */}
            <div className="flex h-14 w-14 items-center justify-center border border-pink-500/30 bg-pink-500/15">
              <Lock className="h-6 w-6 text-pink-400 animate-pulse" />
            </div>

            <DialogHeader className="w-full">
              <DialogTitle className="auth-display text-4xl leading-none text-white md:text-5xl text-center">
                DAILY JOB LIMIT REACHED
              </DialogTitle>
              <DialogDescription className="auth-body text-white/55 text-sm leading-relaxed text-center mt-3 space-y-2">
                <p>Free users get <span className="text-white font-semibold">2 job swipes/day</span>.</p>
                <p className="text-pink-400 font-bold text-base mt-1">Upgrade to Premium for 5 jobs/day!</p>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="w-full flex flex-col gap-2 mt-4">
              {/* Pink active style button */}
              <Button
                onClick={() => { onClose(); setShowUpgrade(true); }}
                className="group h-14 w-full border border-pink-500/30 bg-pink-500 text-black hover:bg-pink-400 font-bold uppercase tracking-[0.16em] auth-body transition-all duration-300"
              >
                <Crown className="h-4 w-4 mr-2" /> Upgrade to Premium
              </Button>
              <Button 
                variant="ghost" 
                onClick={onClose} 
                className="w-full text-white/45 hover:text-white transition-colors h-12 auth-body uppercase tracking-[0.16em] text-xs font-semibold"
              >
                Maybe later
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        userEmail={userEmail}
        userName={currentUser?.first_name}
      />
    </>
  );
}
