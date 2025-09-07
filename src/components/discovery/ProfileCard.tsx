import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, GraduationCap, Heart, Coffee, Camera, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  age: number;
  bio: string;
  year: number;
  branch: string;
  hometown: string;
  interests: string[];
  photos: { url: string; order: number }[];
  height?: string;
  looking_for?: string;
  prompts?: { question: string; answer: string }[];
}

interface ProfileCardProps {
  profile: Profile;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
}

export function ProfileCard({ profile, onLike, onPass, onSuperLike }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === profile.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? profile.photos.length - 1 : prev - 1
    );
  };

  const currentPhoto = profile.photos[currentPhotoIndex];

  return (
    <Card className="h-full overflow-hidden bg-gradient-to-b from-transparent to-black/20 relative group">
      <div 
        className="h-full bg-cover bg-center relative transition-all duration-500"
        style={{ 
          backgroundImage: `url(${currentPhoto?.url})` 
        }}
      >
        {/* Photo navigation */}
        {profile.photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={prevPhoto}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={nextPhoto}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Photo indicators */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {profile.photos.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    index === currentPhotoIndex 
                      ? "bg-white w-6" 
                      : "bg-white/50 w-1"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        
        {/* Info button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40 z-10"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Info className="h-4 w-4" />
        </Button>

        {/* Profile info */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-6 text-white transition-all duration-300",
          showDetails ? "translate-y-0" : "translate-y-8"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-3xl font-bold">{profile.full_name}</h2>
            <span className="text-2xl font-light">{profile.age}</span>
            {profile.looking_for && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {profile.looking_for}
              </Badge>
            )}
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-white/90">
              <GraduationCap className="h-4 w-4" />
              <span className="text-sm">Year {profile.year} • {profile.branch}</span>
            </div>
            
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{profile.hometown}</span>
            </div>

            {profile.height && (
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-sm">📏 {profile.height}</span>
              </div>
            )}
          </div>
          
          <p className="text-white/90 mb-4 text-sm leading-relaxed line-clamp-3">
            {profile.bio}
          </p>

          {/* Prompts */}
          {profile.prompts && showDetails && (
            <div className="space-y-3 mb-4">
              {profile.prompts.slice(0, 2).map((prompt, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-white/70 mb-1">{prompt.question}</p>
                  <p className="text-sm text-white">{prompt.answer}</p>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {profile.interests.slice(0, showDetails ? 8 : 4).map((interest) => (
              <Badge 
                key={interest} 
                variant="secondary" 
                className="bg-white/15 text-white border-white/30 hover:bg-white/25 text-xs backdrop-blur-sm"
              >
                {interest}
              </Badge>
            ))}
            {profile.interests.length > 4 && !showDetails && (
              <Badge 
                variant="secondary" 
                className="bg-white/15 text-white border-white/30 text-xs"
              >
                +{profile.interests.length - 4} more
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}