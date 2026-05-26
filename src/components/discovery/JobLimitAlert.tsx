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
        <DialogContent className="sm:max-w-md border-white/10 bg-zinc-950 text-white">
          <div className="flex flex-col items-center gap-4 py-3 text-center">
            <div className="rounded-full border border-amber-300/40 bg-amber-500/20 p-3">
              <Lock className="h-6 w-6 text-amber-200" />
            </div>

            <DialogHeader>
              <DialogTitle>Daily Job Limit Reached</DialogTitle>
              <DialogDescription className="text-zinc-300">
                Free users get 2 job swipes/day.<br />
                Upgrade to Premium for <span className="text-white font-bold">5 jobs/day</span>!
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="w-full flex flex-col gap-2">
              <Button
                onClick={() => { onClose(); setShowUpgrade(true); }}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-full"
              >
                <Crown className="h-4 w-4 mr-2" /> Upgrade to Premium
              </Button>
              <Button variant="ghost" onClick={onClose} className="w-full text-gray-400 text-sm">
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
