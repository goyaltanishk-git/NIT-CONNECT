import { Button } from "@/components/ui/button";
import { Heart, X, Star, Zap, RotateCcw } from "lucide-react";
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
    <div className="px-4">
      {/* Usage indicators */}
      <div className="flex justify-center items-center gap-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Heart className="h-3 w-3 text-like" />
          <span>{likesRemaining} likes left</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-superlike" />
          <span>{superLikesRemaining} super likes</span>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-center items-center gap-4 pb-2">
      {/* Rewind */}
      {onRewind && (
        <Button
          size="sm"
          variant="outline"
          className="h-12 w-12 rounded-full border-yellow-500/50 text-yellow-500 hover:bg-yellow-50 hover:border-yellow-600 disabled:opacity-50"
          onClick={onRewind}
          disabled={disabled}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}

        {/* Pass */}
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-16 w-16 rounded-full border-2 transition-all duration-300",
            "border-nope/60 text-nope hover:bg-nope/10 hover:border-nope hover:scale-110",
            "shadow-lg hover:shadow-nope/30 active:scale-95 hover:shadow-xl",
            "bg-gradient-to-br from-background to-nope/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={onPass}
          disabled={disabled}
        >
          <X className="h-7 w-7" />
        </Button>
      
        {/* Super Like */}
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-16 w-16 rounded-full border-2 transition-all duration-300",
            "border-superlike/60 text-superlike hover:bg-superlike/10 hover:border-superlike hover:scale-110",
            "shadow-lg hover:shadow-superlike/30 active:scale-95 hover:shadow-xl hover:star-glow",
            "bg-gradient-to-br from-background to-superlike/5",
            disabled && "opacity-50 cursor-not-allowed",
            superLikesRemaining === 0 && "opacity-30 cursor-not-allowed"
          )}
          onClick={onSuperLike}
          disabled={disabled || superLikesRemaining === 0}
        >
          <Star className="h-7 w-7" />
        </Button>
      
        {/* Like */}
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-18 w-18 rounded-full border-2 transition-all duration-300",
            "border-like/60 text-like hover:bg-like/10 hover:border-like hover:scale-110",
            "shadow-lg hover:shadow-like/30 active:scale-95 hover:shadow-xl hover:heart-float",
            "bg-gradient-to-br from-background to-like/5",
            disabled && "opacity-50 cursor-not-allowed",
            likesRemaining === 0 && "opacity-30 cursor-not-allowed"
          )}
          onClick={onLike}
          disabled={disabled || likesRemaining === 0}
        >
          <Heart className="h-8 w-8" />
        </Button>

      {/* Boost */}
      {onBoost && (
        <Button
          size="sm"
          variant="outline"
          className="h-12 w-12 rounded-full border-purple-500/50 text-purple-500 hover:bg-purple-50 hover:border-purple-600 disabled:opacity-50"
          onClick={onBoost}
          disabled={disabled}
        >
          <Zap className="h-4 w-4" />
        </Button>
      )}
      </div>
    </div>
  );
}