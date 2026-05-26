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
import { Heart, Lock, Crown } from "lucide-react";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { encryptedStorage } from "@/utils/encryptedStorage";

interface DailyLimitAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyLimitAlert({ isOpen, onClose }: DailyLimitAlertProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const currentUserData = encryptedStorage.get("current-user");
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const userEmail = currentUser?.email || "";

  return (
    <>
      <Dialog open={isOpen && !showUpgrade} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-black/95 border-pink-500/20 backdrop-blur-xl text-white shadow-[0_0_50px_rgba(236,72,153,0.3)]">
          <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6 py-8 relative z-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-900 to-black border border-pink-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-pink-500 rounded-full p-2 border-4 border-black">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
            </div>

            <DialogHeader className="space-y-3 text-center">
              <DialogTitle className="text-3xl font-bold text-pink-500 drop-shadow-sm">
                Daily Limit Reached
              </DialogTitle>
              <DialogDescription className="text-base text-pink-200/90 font-medium max-w-xs mx-auto pt-2">
                You've used all 2 free swipes today.<br />
                Upgrade to Premium for <span className="text-white font-bold">unlimited swipes</span>!
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="w-full mt-2 px-6 flex flex-col gap-2">
              <Button
                onClick={() => { onClose(); setShowUpgrade(true); }}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-base rounded-full py-5"
              >
                <Crown className="h-4 w-4 mr-2" /> Upgrade to Premium
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-gray-400 hover:text-white text-sm"
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
