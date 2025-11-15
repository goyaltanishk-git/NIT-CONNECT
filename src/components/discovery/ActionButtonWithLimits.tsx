import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, RotateCcw, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonsWithLimitsProps {
  onPass: () => void;
  onLike: () => void;
  onRewind?: () => void;
  onBoost?: () => void;
  disabled?: boolean;
  likesRemaining: number;
  canLike: boolean;
}

export function ActionButtonsWithLimits({
  onPass,
  onLike,
  onRewind,
  onBoost,
  disabled = false,
  likesRemaining,
  canLike
}: ActionButtonsWithLimitsProps) {
  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      {/* Likes Remaining Indicator */}
      <div className="flex items-center justify-center space-x-2">
        <Badge 
          variant={canLike ? "default" : "destructive"} 
          className={cn(
            "px-6 py-3 rounded-full font-semibold transition-all duration-300 text-sm",
            canLike 
              ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg animate-pulse-glow border-pink-400/30" 
              : "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400/30"
          )}
        >
          <Heart className="w-4 h-4 mr-2 animate-heartbeat" />
          {likesRemaining} likes left today
        </Badge>
      </div>

      {/* Main Action Buttons */}
      <div className="flex items-center justify-center space-x-8">
        {/* Rewind Button */}
        {onRewind && (
          <Button
            variant="ghost"
            size="lg"
            onClick={onRewind}
            disabled={disabled}
            className="rounded-full w-16 h-16 glass-light border-2 border-yellow-500/30 hover:border-yellow-400 hover:bg-yellow-500/20 transition-all duration-300 hover:scale-110 group shadow-lg hover:shadow-xl interactive"
          >
            <RotateCcw className="w-6 h-6 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300 group-hover:animate-spin" />
          </Button>
        )}

        {/* Pass Button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={onPass}
          disabled={disabled}
          className="rounded-full w-18 h-18 glass-light border-3 border-red-500/30 hover:border-red-400 hover:bg-red-500/20 transition-all duration-300 hover:scale-110 group shadow-lg hover:shadow-xl interactive"
        >
          <X className="w-8 h-8 text-red-400 group-hover:text-red-300 transition-colors duration-300 group-hover:rotate-90" />
        </Button>

        {/* Like Button - Main CTA */}
        <Button
          size="lg"
          onClick={onLike}
          disabled={disabled || !canLike}
          className={cn(
            "rounded-full w-24 h-24 transition-all duration-300 hover:scale-110 group shadow-xl relative overflow-hidden interactive",
            canLike
              ? "bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 animate-pulse-glow"
              : "bg-gray-600 cursor-not-allowed opacity-50"
          )}
        >
          <Heart className={cn(
            "w-10 h-10 text-white transition-all duration-300",
            canLike && "group-hover:animate-heartbeat group-hover:scale-110"
          )} />
          {canLike && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
              <div className="absolute inset-0 bg-pink-400/20 rounded-full blur-xl animate-pulse-glow"></div>
            </>
          )}
        </Button>

        {/* Boost Button */}
        {onBoost && (
          <Button
            variant="ghost"
            size="lg"
            onClick={onBoost}
            disabled={disabled}
            className="rounded-full w-16 h-16 glass-light border-2 border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/20 transition-all duration-300 hover:scale-110 group shadow-lg hover:shadow-xl interactive"
          >
            <Zap className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors duration-300 group-hover:animate-bounce" />
          </Button>
        )}
      </div>

      {/* Limit Warning */}
      {!canLike && (
        <div className="text-center space-y-3 animate-fade-in glass-light p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-center space-x-2">
            <Heart className="w-5 h-5 text-red-400" />
            <p className="text-base font-semibold text-red-400">
              You've reached your daily limit
            </p>
          </div>
          <p className="text-sm text-gray-400">
            Limits reset at midnight ⏰
          </p>
        </div>
      )}

      {/* Premium Upgrade Hint */}
      {likesRemaining <= 1 && canLike && (
        <div className="text-center space-y-3 p-6 glass-light rounded-2xl animate-fade-in border border-pink-500/20">
          <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
            <p className="text-base font-semibold gradient-text">Almost out of likes!</p>
          </div>
          <p className="text-sm text-gray-400">
            Upgrade to Premium for unlimited likes ✨
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="btn-secondary text-pink-400 hover:text-pink-300 border-pink-500/30 hover:bg-pink-500/10"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Go Premium
          </Button>
        </div>
      )}
    </div>
  );
}