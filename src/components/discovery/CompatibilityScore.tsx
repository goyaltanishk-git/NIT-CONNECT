import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, TrendingUp } from "lucide-react";
import { getCompatibilityTier } from "@/utils/matchingAlgorithm";

interface CompatibilityScoreProps {
  score: number;
  breakdown?: { [key: string]: number };
  showDetails?: boolean;
}

export function CompatibilityScore({ score, breakdown, showDetails = false }: CompatibilityScoreProps) {
  const { tier, color, description } = getCompatibilityTier(score);

  return (
    <div className="space-y-3">
      {/* Main Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <span className="font-medium">Compatibility</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={`${color} bg-gradient-to-r from-primary/10 to-primary/5`}>
            {score}% Match
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <Progress value={score} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{tier}</span>
          <span>{description}</span>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && breakdown && (
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-3 w-3" />
            Compatibility Breakdown
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(breakdown).map(([category, value]) => (
              <div key={category} className="flex justify-between">
                <span className="capitalize text-muted-foreground">{category}:</span>
                <span className="font-medium">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}