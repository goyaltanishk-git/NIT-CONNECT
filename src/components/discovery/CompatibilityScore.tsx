import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, TrendingUp, Sparkles } from "lucide-react";
import { getCompatibilityTier } from "@/utils/matchingAlgorithm";

interface CompatibilityScoreProps {
  score: number;
  breakdown?: { [key: string]: number };
  showDetails?: boolean;
}

export function CompatibilityScore({ score, breakdown, showDetails = false }: CompatibilityScoreProps) {
  const { tier, color, description } = getCompatibilityTier(score);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main Score with Thursday styling */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-400 animate-heartbeat" />
          <span className="font-medium text-white">Compatibility</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30 font-semibold px-3 py-1.5 hover:scale-105 transition-transform duration-200 interactive"
          >
            <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
            {score}% Match
          </Badge>
        </div>
      </div>

      {/* Progress Bar with Thursday styling */}
      <div className="space-y-2">
        <div className="relative">
          <Progress 
            value={score} 
            className="h-3 glass-light border border-white/10 rounded-full overflow-hidden"
          />
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 via-pink-600 to-purple-500 rounded-full transition-all duration-1000 animate-pulse-glow"
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-pink-400 font-medium">{tier}</span>
          <span className="text-gray-400">{description}</span>
        </div>
      </div>

      {/* Detailed Breakdown with Thursday styling */}
      {showDetails && breakdown && (
        <div className="space-y-3 p-4 glass-light rounded-xl border border-white/10 animate-slide-up">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <TrendingUp className="h-4 w-4 text-pink-400" />
            Compatibility Breakdown
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(breakdown).map(([category, value]) => (
              <div key={category} className="flex justify-between items-center p-2 glass-light rounded-lg border border-white/5">
                <span className="capitalize text-gray-300 font-medium">{category}:</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-pink-300">{value}%</span>
                  <div className="w-8 h-1 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}