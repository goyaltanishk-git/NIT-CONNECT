import { Button } from "@/components/ui/button";
import { Heart, X, Zap, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonsWithLimitsProps {
  onPass: () => void;
  onLike: () => void;
  onBoost?: () => void;
  onRewind?: () => void;
  disabled?: boolean;
  likesRemaining: number;
  canLike: boolean;
}

export function ActionButtonsWithLimits({ 
  onPass, 
  onLike, 
  onBoost, 
  onRewind,
  disabled = false,
  likesRemaining,
  canLike
}: ActionButtonsWithLimitsProps) {
  return (
    <div className="px-6 pb-2">
      {/* Enhanced Usage indicators */}
      <div className="flex justify-center items-center gap-6 mb-6">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full border",
          canLike 
            ? "bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20"
            : "bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/20"
        )}>
          <Heart className={cn(
            "h-4 w-4",
            canLike ? "text-green-600" : "text-red-600"
          )} />
          <span className={cn(
            "text-sm font-medium",
            canLike ? "text-green-700" : "text-red-700"
          )}>
            {likesRemaining} likes left
          </span>
        </div>
      </div>
      
      {/* Enhanced Action buttons */}
      <div className="flex justify-center items-center gap-6 pb-4">
        {/* Rewind */}
        {onRewind && (
          <Button
            size="lg"
            variant="outline"
            className={cn(
              "h-14 w-14 rounded-full border-2 transition-all duration-300",
              "border-yellow-500/60 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-600 hover:scale-110",
              "shadow-lg hover:shadow-yellow-500/30 active:scale-95 hover:shadow-xl",
              "bg-gradient-to-br from-background to-yellow-500/5",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={onRewind}
            disabled={disabled}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        )}

        {/* Pass */}
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-16 w-16 rounded-full border-2 transition-all duration-300 group",
            "border-red-500/60 text-red-500 hover:bg-red-50 hover:border-red-600 hover:scale-110",
            "shadow-lg hover:shadow-red-500/30 active:scale-95 hover:shadow-xl",
            "bg-gradient-to-br from-background to-red-500/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={onPass}
          disabled={disabled}
        >
          <X className="h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      
        {/* Like */}
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-20 w-20 rounded-full border-2 transition-all duration-300 group relative overflow-hidden",
            canLike
              ? "border-green-500/60 text-green-500 hover:bg-green-50 hover:border-green-600 hover:scale-110"
              : "border-gray-400/60 text-gray-400 cursor-not-allowed",
            "shadow-lg hover:shadow-green-500/30 active:scale-95 hover:shadow-xl",
            "bg-gradient-to-br from-background to-green-500/5",
            (disabled || !canLike) && "opacity-30 cursor-not-allowed"
          )}
          onClick={onLike}
          disabled={disabled || !canLike}
        >
          <Heart className="h-9 w-9 group-hover:scale-110 transition-all duration-300" />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
        </Button>

        {/* Boost */}
        {onBoost && (
          <Button
            size="lg"
            variant="outline"
            className={cn(
              "h-14 w-14 rounded-full border-2 transition-all duration-300 group",
              "border-purple-500/60 text-purple-600 hover:bg-purple-50 hover:border-purple-600 hover:scale-110",
              "shadow-lg hover:shadow-purple-500/30 active:scale-95 hover:shadow-xl",
              "bg-gradient-to-br from-background to-purple-500/5",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={onBoost}
            disabled={disabled}
          >
            <Zap className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
          </Button>
        )}
      </div>

      {/* Action hints */}
      <div className="flex justify-center items-center gap-8 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <X className="h-3 w-3 text-red-500" />
          <span>Pass</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="h-3 w-3 text-green-500" />
          <span>Like</span>
        </div>
      </div>

      {/* Daily limit info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Daily limits reset at 12:00 AM
        </p>
        {!canLike && (
          <p className="text-xs text-red-600 font-medium mt-1">
            ❌ No likes remaining today
          </p>
        )}
      </div>
    </div>
  );
}