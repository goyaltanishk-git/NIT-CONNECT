import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Heart, Lock, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface DailyLimitAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyLimitAlert({ isOpen, onClose }: DailyLimitAlertProps) {
  const [timeLeft, setTimeLeft] = useState("");

  // Calculate time until midnight
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/90 border-pink-500/20 backdrop-blur-xl text-white shadow-[0_0_50px_rgba(236,72,153,0.3)]">
        
        {/* Animated Background Glow */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6 py-6 relative z-10">
          {/* Icon Stack */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-black border border-gray-700 flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full p-2 border-4 border-black">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
          </div>

          <DialogHeader className="space-y-3 text-center">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Daily Limit Reached
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-base max-w-xs mx-auto">
              You've sent all your likes for today! Quality over quantity. 
              <br /><br />
              <span className="flex items-center justify-center gap-2 text-pink-300 font-medium bg-pink-500/10 py-1 px-3 rounded-full border border-pink-500/20">
                <Clock className="w-4 h-4" />
                Refreshes in {timeLeft}
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 w-full mt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl py-6"
            >
              I'll wait
            </Button>
            {/* Optional Premium Upsell Button */}
            <Button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-none rounded-xl py-6 shadow-lg shadow-pink-500/20 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Zap className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                Get Unlimited Likes
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}