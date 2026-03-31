import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface JobLimitAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JobLimitAlert({ isOpen, onClose }: JobLimitAlertProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-white/10 bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4 py-3 text-center">
          <div className="rounded-full border border-amber-300/40 bg-amber-500/20 p-3">
            <Lock className="h-6 w-6 text-amber-200" />
          </div>

          <DialogHeader>
            <DialogTitle>Daily Job Limit Reached</DialogTitle>
            <DialogDescription className="text-zinc-300">
              You have already interacted with 2 jobs today. The feed unlocks automatically at midnight IST.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="w-full">
            <Button onClick={onClose} className="w-full">OK</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
