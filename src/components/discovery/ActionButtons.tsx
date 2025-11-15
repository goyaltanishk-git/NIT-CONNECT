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
      {/* Enhanced Usage indicators with premium styling */}
      <div className="flex justify-center items-center gap-6 mb-8">
        <div className="flex items-center gap-2 glass-light px-4 py-2 rounded-full border border-pink-500/30 hover:border-pink-500/50 transition-all duration-300 interactive hover-glow">
          <Heart className="h-4 w-4 text-pink-400 animate-heartbeat" />
          <span className="text-sm font-medium text-pink-300">{likesRemaining} likes</span>
        </div>
        <div className="flex items-center gap-2 glass-light px-4 py-2 rounded-full border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 interactive hover-glow">
          <Star className="h-4 w-4 text-purple-400 animate-pulse" />
          <span className="text-sm font-medium text-purple-300">{superLikesRemaining} super likes</span>
        </div>
      </div>
      
      {/* Enhanced Action buttons with premium animations */}
      <div className="flex justify-center items-center gap-6 pb-4">
        {/* Rewind with enhanced effects */}
        {onRewind && (
          <Button
            size="lg"
            variant="outline"
            className={cn(
              "h-14 w-14 rounded-full border-2 transition-all duration-500 group relative overflow-hidden",
              "glass-light border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/60 hover:scale-125",
              "shadow-lg hover:shadow-yellow-500/40 active:scale-95 hover:shadow-2xl animate-pulse-glow interactive",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={onRewind}
            disabled={disabled}
          >
            <RotateCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
          </Button>
        )}

        {/* Pass with enhanced animations */}
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-16 w-16 rounded-full border-2 transition-all duration-500 group relative overflow-hidden",
            "glass-light border-red-500/40 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 hover:scale-125",
            "shadow-lg hover:shadow-red-500/40 active:scale-95 hover:shadow-2xl interactive",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={onPass}
          disabled={disabled}
        >
          <X className="h-7 w-7 group-hover:rotate-90 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
          
          {/* Ripple effect on click */}
          <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-100 bg-red-400/30 animate-ping"></div>
        </Button>
      
        {/* Super Like with premium effects */}
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-18 w-18 rounded-full border-2 transition-all duration-500 group relative overflow-hidden",
            "glass-light border-blue-500/40 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/60 hover:scale-125",
            "shadow-lg hover:shadow-blue-500/40 active:scale-95 hover:shadow-2xl animate-pulse-glow interactive",
            disabled && "opacity-50 cursor-not-allowed",
            superLikesRemaining === 0 && "opacity-30 cursor-not-allowed"
          )}
          onClick={onSuperLike}
          disabled={disabled || superLikesRemaining === 0}
        >
          <Star className="h-8 w-8 group-hover:rotate-12 group-hover:scale-125 transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
          <Sparkles className="absolute top-1 right-1 w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300" />
          
          {/* Star burst effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-20px)`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </Button>
      
        {/* Like with enhanced heart animation */}
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "h-20 w-20 rounded-full border-2 transition-all duration-500 group relative overflow-hidden",
            "glass-light border-pink-500/40 text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/60 hover:scale-125",
            "shadow-lg hover:shadow-pink-500/40 active:scale-95 hover:shadow-2xl animate-pulse-glow interactive",
            disabled && "opacity-50 cursor-not-allowed",
            likesRemaining === 0 && "opacity-30 cursor-not-allowed"
          )}
          onClick={onLike}
          disabled={disabled || likesRemaining === 0}
        >
          <Heart className="h-9 w-9 group-hover:scale-125 group-hover:animate-heartbeat transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
          
          {/* Heart particles effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {Array.from({ length: 8 }).map((_, i) => (
              <Heart
                key={i}
                className="absolute w-2 h-2 text-pink-400 animate-float"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-25px)`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </Button>

        {/* Boost with lightning effects */}
        {onBoost && (
          <Button
            size="lg"
            variant="outline"
            className={cn(
              "h-14 w-14 rounded-full border-2 transition-all duration-500 group relative overflow-hidden",
              "glass-light border-purple-500/40 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/60 hover:scale-125",
              "shadow-lg hover:shadow-purple-500/40 active:scale-95 hover:shadow-2xl animate-pulse-glow interactive",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={onBoost}
            disabled={disabled}
          >
            <Zap className="h-5 w-5 group-hover:rotate-12 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
            
            {/* Lightning bolt effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-purple-400 transform -translate-x-1/2 -translate-y-1/2 rotate-45 animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-purple-400 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 animate-pulse"></div>
            </div>
          </Button>
        )}
      </div>

      {/* Enhanced Action hints with better animations */}
      <div className="flex justify-center items-center gap-8 text-xs text-gray-400">
        <div className="flex items-center gap-1 hover:text-red-300 transition-all duration-300 interactive hover:scale-110">
          <X className="h-3 w-3 text-red-400" />
          <span>Pass</span>
        </div>
        <div className="flex items-center gap-1 hover:text-blue-300 transition-all duration-300 interactive hover:scale-110">
          <Star className="h-3 w-3 text-blue-400" />
          <span>Super Like</span>
        </div>
        <div className="flex items-center gap-1 hover:text-pink-300 transition-all duration-300 interactive hover:scale-110">
          <Heart className="h-3 w-3 text-pink-400" />
          <span>Like</span>
        </div>
      </div>
    </div>
  );
}