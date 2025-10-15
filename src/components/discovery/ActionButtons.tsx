import { Button } from "@/components/ui/button";
import { Heart, X, Star, Zap, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonsProps {
  onPass: () => void;
  onSuperLike: () => void;
  onLike: () => void;
  onBoost?: () => void;
  onRewind?: () => void;
  disabled?: boolean;
  likesRemaining?: number;
  superLikesRemaining?: number;
}

export function ActionButtons({ 
  onPass, 
  onSuperLike, 
  onLike, 
  onBoost, 
  onRewind,
  disabled = false,
  likesRemaining = 50,
  superLikesRemaining = 5
}: ActionButtonsProps) {
  return (
    <div className="px-6 pb-2 animate-fade-in">
      {/* Enhanced Usage indicators with Thursday styling */}
      <div className="flex justify-center items-center gap-6 mb-8">
        <div className="flex items-center gap-2 glass-light px-4 py-2 rounded-full border border-pink-500/30 hover:border-pink-500/50 transition-all duration-300 interactive">
          <Heart className="h-4 w-4 text-pink-400 animate-heartbeat" />
          <span className="text-sm font-medium text-pink-300">{likesRemaining} likes</span>
        </div>
        <div className="flex items-center gap-2 glass-light px-4 py-2 rounded-full border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 interactive">
          <Star className="h-4 w-4 text-purple-400 animate-pulse" />
          <span className="text-sm font-medium text-purple-300">{superLikesRemaining} super likes</span>
        </div>
      </div>
      
      {/* Enhanced Action buttons with Thursday styling */}
      <div className="flex justify-center items-center gap-6 pb-4">
        {/* Rewind */}
        {onRewind && (
          <Button
            size="lg"
            variant="outline"
            className={cn(
              "h-14 w-14 rounded-full border-2 transition-all duration-300 group",
              "glass-light border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/60 hover:scale-110",
              "shadow-lg hover:shadow-yellow-500/30 active:scale-95 hover:shadow-xl animate-pulse-glow",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={onRewind}
            disabled={disabled}
          >
            <RotateCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
          </Button>
        )}

        {/* Pass */}
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-16 w-16 rounded-full border-2 transition-all duration-300 group",
            "glass-light border-red-500/40 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 hover:scale-110",
            "shadow-lg hover:shadow-red-500/30 active:scale-95 hover:shadow-xl",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={onPass}
          disabled={disabled}
        >
          <X className="h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      
        {/* Super Like */}
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-18 w-18 rounded-full border-2 transition-all duration-300 group relative overflow-hidden",
            "glass-light border-blue-500/40 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/60 hover:scale-110",
            "shadow-lg hover:shadow-blue-500/30 active:scale-95 hover:shadow-xl animate-pulse-glow",
            disabled && "opacity-50 cursor-not-allowed",
            superLikesRemaining === 0 && "opacity-30 cursor-not-allowed"
          )}
          onClick={onSuperLike}
          disabled={disabled || superLikesRemaining === 0}
        >
          <Star className="h-8 w-8 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
          <Sparkles className="absolute top-1 right-1 w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300" />
        </Button>
      
        {/* Like */}
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-20 w-20 rounded-full border-2 transition-all duration-300 group relative overflow-hidden",
            "glass-light border-pink-500/40 text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/60 hover:scale-110",
            "shadow-lg hover:shadow-pink-500/30 active:scale-95 hover:shadow-xl animate-pulse-glow",
            disabled && "opacity-50 cursor-not-allowed",
            likesRemaining === 0 && "opacity-30 cursor-not-allowed"
          )}
          onClick={onLike}
          disabled={disabled || likesRemaining === 0}
        >
          <Heart className="h-9 w-9 group-hover:scale-110 group-hover:animate-heartbeat transition-all duration-300" />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
        </Button>

        {/* Boost */}
        {onBoost && (
          <Button
            size="lg"
            variant="outline"
            className={cn(
              "h-14 w-14 rounded-full border-2 transition-all duration-300 group",
              "glass-light border-purple-500/40 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/60 hover:scale-110",
              "shadow-lg hover:shadow-purple-500/30 active:scale-95 hover:shadow-xl animate-pulse-glow",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={onBoost}
            disabled={disabled}
          >
            <Zap className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
          </Button>
        )}
      </div>

      {/* Action hints with Thursday styling */}
      <div className="flex justify-center items-center gap-8 text-xs text-gray-400">
        <div className="flex items-center gap-1 hover:text-red-300 transition-colors duration-200">
          <X className="h-3 w-3 text-red-400" />
          <span>Pass</span>
        </div>
        <div className="flex items-center gap-1 hover:text-blue-300 transition-colors duration-200">
          <Star className="h-3 w-3 text-blue-400" />
          <span>Super Like</span>
        </div>
        <div className="flex items-center gap-1 hover:text-pink-300 transition-colors duration-200">
          <Heart className="h-3 w-3 text-pink-400" />
          <span>Like</span>
        </div>
      </div>
    </div>
  );
}