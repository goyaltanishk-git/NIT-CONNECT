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
  Tag
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
    <Card className="w-full max-w-sm mx-auto bg-white shadow-xl rounded-3xl overflow-hidden">
      <CardContent className="p-0">
        {/* Photo Section */}
        <div className="relative aspect-[3/4] bg-gray-200">
          {/* Photo Navigation Areas */}
          <div className="absolute inset-0 z-10 flex">
            <div 
              className="flex-1 cursor-pointer" 
              onClick={prevPhoto}
            />
            <div 
              className="flex-1 cursor-pointer" 
              onClick={nextPhoto}
            />
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
            />
          </div>

          {/* Main Photo */}
          <img
            src={profile.photos[currentPhotoIndex]?.url || "/api/placeholder/300/400"}
            alt={profile.full_name}
            className="w-full h-full object-cover"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Verified Badge */}
          {profile.verified && (
            <div className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded-full">
              <Shield className="w-4 h-4" />
            </div>
          )}

          {/* Photo Indicators */}
          {profile.photos.length > 1 && (
            <div className="absolute top-4 left-4 flex space-x-1">
              {profile.photos.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
              <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
              Active now
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="p-6 space-y-4">
          {/* Name and Age */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{profile.full_name}, {profile.age}</h3>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                2.5 km
              </div>
            </div>
          </div>

          {/* Education Info */}
          <div className="flex items-center text-gray-600">
            <GraduationCap className="w-4 h-4 mr-2" />
            <span className="text-sm">Year {profile.year} • {profile.branch}</span>
          </div>

          {/* Bio Preview */}
          <div>
            <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
              {profile.bio}
            </p>
          </div>

          {/* Interests Preview */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <Tag className="w-4 h-4 mr-2 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Interests</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests.slice(0, 3).map((interest, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-purple-100 text-purple-700 text-xs"
                  >
                    {interest}
                  </Badge>
                ))}
                {profile.interests.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{profile.interests.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-4">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 border-2 border-gray-300"
              onClick={onPass}
            >
              <X className="w-6 h-6 text-gray-500" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 border-2 border-blue-300"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Info className="w-6 h-6 text-blue-500" />
            </Button>
            <Button
              size="lg"
              className="rounded-full w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              onClick={onLike}
            >
              <Heart className="w-6 h-6 text-white" />
            </Button>
           
          </div>
        </div>

        {/* Detailed Info Modal Overlay */}
        {showDetails && (
          <div className="absolute inset-0 bg-black/80 z-20 flex items-end">
            <div className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{profile.full_name}</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-600">Age:</span> {profile.age}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Year:</span> {profile.year}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Branch:</span> {profile.branch}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Hometown:</span> {profile.hometown}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Height:</span> {profile.height}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Looking for:</span> {profile.looking_for}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">About</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {profile.bio}
                  </p>
                </div>

                {profile.interests && profile.interests.length > 0 && (
                  <div>
                    <div className="flex items-center mb-3">
                      <Tag className="w-4 h-4 mr-2 text-purple-500" />
                      <h3 className="font-medium text-gray-800">Interests</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-purple-100 text-purple-700"
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