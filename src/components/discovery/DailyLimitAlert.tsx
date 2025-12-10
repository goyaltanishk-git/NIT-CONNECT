import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Lock } from "lucide-react";

interface DailyLimitAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyLimitAlert({ isOpen, onClose }: DailyLimitAlertProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/95 border-pink-500/20 backdrop-blur-xl text-white shadow-[0_0_50px_rgba(236,72,153,0.3)]">
        
        {/* Animated Background Glow */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6 py-8 relative z-10">
          {/* Icon Stack */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-900 to-black border border-pink-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.2)]">
              {/* ⭐ CHANGE: Icon color set to text-white */}
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-pink-500 rounded-full p-2 border-4 border-black">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
          </div>

          <DialogHeader className="space-y-3 text-center">
            {/* Title in Pink */}
            <DialogTitle className="text-3xl font-bold text-pink-500 drop-shadow-sm">
              Daily Limit Reached
            </DialogTitle>
            
            {/* Description Text */}
            <DialogDescription className="text-xl text-pink-200/90 font-medium max-w-xs mx-auto pt-2">
              You have sent all your likes for today
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="w-full mt-6 px-6">
            <Button 
              onClick={onClose}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-lg border-none rounded-full py-6 shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all hover:scale-[1.02]"
            >
              OK
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}