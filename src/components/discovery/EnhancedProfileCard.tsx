import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  MapPin, 
  GraduationCap, 
  Heart, 
  X, 
  Star, 
  Info, 
  Clock,
  Shield,
  Camera,
  MessageCircle
} from "lucide-react";

interface ProfileCardProps {
  profile: {
    id: string;
    full_name: string;
    age: number;
    bio: string;
    year: number;
    branch: string;
    hometown: string;
    interests: string[];
    photos: { url: string; order: number }[];
    height: string;
    looking_for: string;
    verified: boolean;
  };
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
}

export function EnhancedProfileCard({ profile, onLike, onPass, onSuperLike }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const nextPhoto = () => {
    if (profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length);
    }
  };

  const prevPhoto = () => {
    if (profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto aspect-[3/4] relative overflow-hidden border-0 shadow-2xl rounded-3xl bg-gradient-to-b from-background to-background/95">
      {/* Photo Section */}
      <div className="relative h-3/5 overflow-hidden rounded-t-3xl">
        {/* Photo Navigation Areas */}
        <div 
          className="absolute left-0 top-0 w-1/3 h-full z-20 cursor-pointer"
          onClick={prevPhoto}
        />
        <div 
          className="absolute right-0 top-0 w-1/3 h-full z-20 cursor-pointer"
          onClick={nextPhoto}
        />
        <div 
          className="absolute center-0 top-0 w-1/3 h-full z-20 cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        />

        {/* Main Photo */}
        <div className="relative w-full h-full">
          <img
            src={profile.photos[currentPhotoIndex]?.url || '/placeholder-profile.jpg'}
            alt={profile.full_name}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          
          {/* Verified Badge */}
          {profile.verified && (
            <div className="absolute top-4 right-4 bg-blue-500 text-white p-1.5 rounded-full">
              <Shield className="h-3 w-3" />
            </div>
          )}

          {/* Photo Indicators */}
          {profile.photos.length > 1 && (
            <div className="absolute top-4 left-4 flex gap-1">
              {profile.photos.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentPhotoIndex 
                      ? 'bg-white w-8' 
                      : 'bg-white/50 w-2'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Active now</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 border-0">
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 border-0">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <CardContent className="p-6 h-2/5 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Name and Age */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">
              {profile.full_name}, {profile.age}
            </h3>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">2.5 km</span>
            </div>
          </div>

          {/* Education Info */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span className="text-sm">Year {profile.year} • {profile.branch}</span>
          </div>

          {/* Bio Preview */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {profile.bio}
          </p>

          {/* Interests Preview */}
          {profile.interests.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {profile.interests.slice(0, 3).map((interest, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{profile.interests.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            onClick={onPass}
            size="lg"
            variant="outline"
            className="h-14 w-14 rounded-full border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-500 hover:text-red-600"
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            onClick={onSuperLike}
            size="lg"
            variant="outline"
            className="h-12 w-12 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-500 hover:text-blue-600"
          >
            <Star className="h-5 w-5" />
          </Button>

          <Button
            onClick={onLike}
            size="lg"
            className="h-14 w-14 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
          >
            <Heart className="h-6 w-6" />
          </Button>
        </div>
      </CardContent>

      {/* Detailed Info Modal Overlay */}
      {showDetails && (
        <div 
          className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 p-6 overflow-y-auto"
          onClick={() => setShowDetails(false)}
        >
          <div className="space-y-4 text-white">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-3 text-sm">
              <p><strong>Age:</strong> {profile.age}</p>
              <p><strong>Year:</strong> {profile.year}</p>
              <p><strong>Branch:</strong> {profile.branch}</p>
              <p><strong>Hometown:</strong> {profile.hometown}</p>
              <p><strong>Height:</strong> {profile.height}</p>
              <p><strong>Looking for:</strong> {profile.looking_for}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            </div>

            {profile.interests.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="bg-white/20 text-white">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}