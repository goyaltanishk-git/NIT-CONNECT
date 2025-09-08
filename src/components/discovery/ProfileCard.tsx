import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, GraduationCap, Calendar, Star, X, Info, MessageCircle } from "lucide-react";
import { Profile } from "@/data/sampleProfiles";

interface ProfileCardProps {
  profile: Profile;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
}

export function ProfileCard({ profile, onLike, onPass, onSuperLike }: ProfileCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);

  const nextImage = () => {
    if (profile.photos && profile.photos.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % profile.photos.length);
    }
  };

  const prevImage = () => {
    if (profile.photos && profile.photos.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const currentPhoto = profile.photos && profile.photos.length > 0 
    ? profile.photos[currentImageIndex].url 
    : null;

  return (
    <Card className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-card via-card/95 to-card/90 shadow-2xl hover:shadow-3xl transition-all duration-500 border-2 border-gradient-to-br from-primary/20 to-transparent backdrop-blur-sm">
      {/* Enhanced Image Section */}
      <div className="relative flex-1 min-h-[400px] overflow-hidden group">
        {currentPhoto && !imageError ? (
          <div className="relative w-full h-full">
            <img
              src={currentPhoto}
              alt={`${profile.full_name}'s photo`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={handleImageError}
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                <span className="text-3xl font-bold text-primary">
                  {profile.full_name.charAt(0)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Photo not available</p>
            </div>
          </div>
        )}
        
        {/* Enhanced Image Navigation */}
        {profile.photos && profile.photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm border border-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100"
              onClick={prevImage}
            >
              ←
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm border border-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100"
              onClick={nextImage}
            >
              →
            </Button>
            
            {/* Enhanced Image Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {profile.photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentImageIndex 
                      ? 'bg-white shadow-lg scale-110' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Enhanced Quick Action Overlay */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            size="sm"
            variant="ghost"
            className="bg-red-500/20 hover:bg-red-500/40 text-white backdrop-blur-sm border border-red-500/30 transition-all duration-300 hover:scale-110"
            onClick={onPass}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="bg-yellow-500/20 hover:bg-yellow-500/40 text-white backdrop-blur-sm border border-yellow-500/30 transition-all duration-300 hover:scale-110"
            onClick={onSuperLike}
          >
            <Star className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="bg-green-500/20 hover:bg-green-500/40 text-white backdrop-blur-sm border border-green-500/30 transition-all duration-300 hover:scale-110"
            onClick={onLike}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        {/* Profile name overlay on image */}
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-2xl font-bold drop-shadow-lg">{profile.full_name}</h3>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span className="drop-shadow-md">{profile.age} years old</span>
          </div>
        </div>
      </div>

      {/* Enhanced Profile Info Section */}
      <div className="p-6 space-y-4 bg-gradient-to-b from-card to-card/80">
        {/* Rating and Academic Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm bg-primary/10 px-3 py-1 rounded-full">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="font-medium">Year {profile.year} • {profile.branch}</span>
            </div>
          </div>
          {profile.elo_rating && (
            <Badge variant="outline" className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-700 font-semibold">
              ⭐ {profile.elo_rating}
            </Badge>
          )}
        </div>

        {/* Location */}
        {profile.hometown && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
            <MapPin className="h-4 w-4 text-primary" />
            <span>From {profile.hometown}</span>
          </div>
        )}

        {/* Enhanced Bio */}
        {profile.bio && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">About</span>
            </div>
            <p className={`text-sm text-muted-foreground leading-relaxed ${
              !showFullBio ? 'line-clamp-3' : ''
            }`}>
              {profile.bio}
            </p>
            {profile.bio.length > 100 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
                onClick={() => setShowFullBio(!showFullBio)}
              >
                {showFullBio ? 'Show less' : 'Read more'}
              </Button>
            )}
          </div>
        )}

        {/* Enhanced Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Interests</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 6).map((interest, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs bg-gradient-to-r from-primary/15 to-primary/10 hover:from-primary/25 hover:to-primary/15 border border-primary/20 transition-all duration-300 hover:scale-105 cursor-default"
                >
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 6 && (
                <Badge variant="outline" className="text-xs border-dashed">
                  +{profile.interests.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Hint */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Swipe or use buttons below to make your choice
          </p>
        </div>
      </div>
    </Card>
  );
}