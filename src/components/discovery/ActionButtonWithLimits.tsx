import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, RotateCcw, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionButtonsWithLimitsProps {
  onPass: () => void;
  onLike: () => void;
  onRewind?: () => void;
  onBoost?: () => void;
  disabled?: boolean;
  likesRemaining?: number;
  canLike?: boolean;
  isLikeLoading?: boolean;
  isPassLoading?: boolean;
}

export function ActionButtonsWithLimits({
  onPass,
  onLike,
  onRewind,
  onBoost,
  disabled = false,
  likesRemaining,
  canLike = true,
  isLikeLoading = false,
  isPassLoading = false
}: ActionButtonsWithLimitsProps) {
  const likesLabel = likesRemaining !== undefined && !Number.isFinite(likesRemaining)
    ? "Unlimited"
    : likesRemaining;

  return (
    <div className="flex items-center justify-center gap-6 py-4 w-full max-w-md mx-auto relative z-20">
      
      {/* Rewind Button (Small) */}
      {onRewind && (
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500 transition-all duration-300 bg-black/50 backdrop-blur-sm"
          onClick={onRewind}
          disabled={disabled || isLikeLoading || isPassLoading}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      )}

      {/* PASS BUTTON (Large - Left) */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-16 w-16 rounded-full border-2 transition-all duration-300 shadow-xl bg-black/50 backdrop-blur-md hover:scale-110",
          "border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
        )}
        onClick={onPass}
        disabled={disabled || isLikeLoading || isPassLoading}
      >
        {isPassLoading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <X className="h-8 w-8" />
        )}
      </Button>

      {/* LIKE BUTTON (Large - Right) */}
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-16 w-16 rounded-full border-2 transition-all duration-300 shadow-xl bg-black/50 backdrop-blur-md hover:scale-110",
            canLike 
              ? "border-green-500/50 text-green-500 hover:bg-green-500/10 hover:border-green-500" 
              : "border-gray-500/50 text-gray-500 hover:bg-gray-500/10 cursor-not-allowed"
          )}
          onClick={onLike}
          disabled={disabled || !canLike || isLikeLoading || isPassLoading}
        >
          {isLikeLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Heart className={cn("h-8 w-8", canLike && "fill-current")} />
          )}
        </Button>
        
        {/* Likes Remaining Badge */}
        {likesRemaining !== undefined && canLike && (
          <Badge className={cn(
            "absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] px-1.5 border border-black shadow-sm z-30",
            (Number.isFinite(likesRemaining) ? likesRemaining > 3 : true)
              ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white" 
              : "bg-red-500 text-white animate-pulse"
          )}>
            {likesLabel}
          </Badge>
        )}
      </div>

      {/* Boost Button (Small) */}
      {onBoost && (
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-2 border-purple-500/50 text-purple-500 hover:bg-purple-500/10 hover:border-purple-500 transition-all duration-300 bg-black/50 backdrop-blur-sm"
          onClick={onBoost}
          disabled={disabled || isLikeLoading || isPassLoading}
        >
          <Zap className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}