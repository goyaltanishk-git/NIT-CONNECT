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
  MessageCircle,
  Tag,
  Sparkles,
  Crown,
  Zap
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
  const [isHovered, setIsHovered] = useState(false);

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
    <Card 
      className="w-full max-w-sm mx-auto glass border-white/10 rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] group card-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0 relative">
        {/* Photo Section with Enhanced Gradients */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-900 to-black overflow-hidden">
          {/* Photo Navigation Areas */}
          <div className="absolute inset-0 z-10 flex">
            <div 
              className="flex-1 cursor-pointer interactive" 
              onClick={prevPhoto}
            />
            <div 
              className="flex-1 cursor-pointer interactive" 
              onClick={nextPhoto}
            />
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
            />
          </div>

          {/* Main Photo with Enhanced Overlay */}
          <img
            src={profile.photos[currentPhotoIndex]?.url || "/api/placeholder/300/400"}
            alt={profile.full_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Enhanced Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 opacity-60" />

          {/* Verified Badge with Glow */}
          {profile.verified && (
            <div className="absolute top-4 right-4 relative">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-2.5 rounded-full shadow-lg animate-heartbeat">
                <Shield className="w-4 h-4" />
              </div>
              <div className="absolute inset-0 bg-pink-500/50 rounded-full blur-lg animate-pulse-glow"></div>
            </div>
          )}

          {/* Enhanced Photo Indicators */}
          {profile.photos.length > 1 && (
            <div className="absolute top-4 left-4 flex space-x-2">
              {profile.photos.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentPhotoIndex 
                      ? 'bg-white shadow-lg w-8 animate-pulse-glow' 
                      : 'bg-white/40 hover:bg-white/60 w-2'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Active Status with Floating Animation */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="glass-light text-white px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-xl animate-bounce border border-white/20">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Active now
            </div>
          </div>

          {/* Floating Hearts Animation on Hover */}
          {isHovered && (
            <div className="absolute inset-0 pointer-events-none">
              <Heart className="absolute top-1/4 left-1/4 w-6 h-6 text-pink-400 animate-heartbeat opacity-60" />
              <Sparkles className="absolute top-3/4 right-1/4 w-4 h-4 text-purple-400 animate-pulse opacity-80" />
              <Star className="absolute bottom-1/4 left-1/3 w-5 h-5 text-pink-300 animate-bounce opacity-50" />
            </div>
          )}
        </div>

        {/* Enhanced Profile Information */}
        <div className="p-6 space-y-5 glass-light">
          {/* Name and Age with Enhanced Typography */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold gradient-text-animated">
                {profile.full_name}, {profile.age}
              </h3>
              <div className="flex items-center text-gray-400 text-sm mt-2">
                <MapPin className="w-4 h-4 mr-2 text-pink-400" />
                <span className="font-medium">2.5 km away</span>
              </div>
            </div>
          </div>

          {/* Education Info with Enhanced Styling */}
          <div className="flex items-center text-gray-300 glass-light p-3 rounded-xl border border-white/10">
            <GraduationCap className="w-5 h-5 mr-3 text-pink-400" />
            <span className="text-sm font-medium">Year {profile.year} • {profile.branch}</span>
          </div>

          {/* Bio Preview with Better Formatting */}
          <div className="glass-light p-4 rounded-xl border border-white/10">
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 font-medium">
              {profile.bio}
            </p>
          </div>

          {/* Enhanced Interests Preview */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <Tag className="w-4 h-4 mr-2 text-pink-400" />
                <span className="text-sm font-semibold text-gray-300">Interests</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests.slice(0, 3).map((interest, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30 text-xs font-medium px-3 py-1.5 hover:scale-105 transition-transform duration-200 interactive"
                  >
                    {interest}
                  </Badge>
                ))}
                {profile.interests.length > 3 && (
                  <Badge variant="outline" className="text-xs border-pink-500/30 text-pink-400 hover:bg-pink-500/10 transition-colors duration-200 interactive">
                    +{profile.interests.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex justify-center space-x-4 pt-4">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full w-16 h-16 glass-light border-2 border-red-500/30 hover:border-red-400 hover:bg-red-500/20 transition-all duration-300 hover:scale-110 group interactive"
              onClick={onPass}
            >
              <X className="w-6 h-6 text-red-400 group-hover:text-red-300 transition-colors duration-300" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full w-16 h-16 glass-light border-2 border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/20 transition-all duration-300 hover:scale-110 group interactive"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Info className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
            </Button>
            
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group animate-pulse-glow interactive"
              onClick={onLike}
            >
              <Heart className="w-6 h-6 text-white group-hover:animate-heartbeat" />
            </Button>
            
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-400 hover:via-indigo-400 hover:to-blue-400 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group interactive"
              onClick={onSuperLike}
            >
              <Star className="w-6 h-6 text-white group-hover:animate-spin" />
            </Button>
          </div>
        </div>

        {/* Enhanced Detailed Info Modal Overlay */}
        {showDetails && (
          <div className="absolute inset-0 glass z-20 flex items-end animate-fade-in">
            <div className="w-full glass-light rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto shadow-2xl animate-slide-up border-t border-white/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold gradient-text-animated">
                  {profile.full_name}
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDetails(false)}
                  className="rounded-full hover:bg-white/10 transition-colors duration-200 interactive"
                >
                  <X className="w-5 h-5 text-white" />
                </Button>
              </div>

              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Age", value: profile.age },
                    { label: "Year", value: profile.year },
                    { label: "Branch", value: profile.branch },
                    { label: "Hometown", value: profile.hometown },
                    { label: "Height", value: profile.height },
                    { label: "Looking for", value: profile.looking_for }
                  ].map((item, index) => (
                    <div key={index} className="glass-light p-3 rounded-lg border border-white/10">
                      <span className="font-semibold text-pink-400">{item.label}:</span>
                      <span className="ml-2 text-gray-300">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="glass-light p-4 rounded-xl border border-white/10">
                  <h3 className="font-semibold text-white mb-3 flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2 text-pink-400" />
                    About
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {profile.bio}
                  </p>
                </div>

                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <div className="flex items-center mb-4">
                      <Tag className="w-5 h-5 mr-2 text-pink-400" />
                      <h3 className="font-semibold text-white">Interests</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30 font-medium px-3 py-1.5 hover:scale-105 transition-transform duration-200 interactive"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}