import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, X, Star, MapPin, GraduationCap, User, EyeOff, Info } from "lucide-react";
import { CompatibilityScore } from "./CompatibilityScore";
import { getDisplayName, getDisplayPhotos, getDisplayBio, getDisplayDetails, shouldDisplayAnonymously } from "@/utils/incognitoUtils";

interface ProfileCardProps {
  profile: any;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
}

export function ProfileCard({ profile, onLike, onPass, onSuperLike }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showFullBio, setShowFullBio] = useState(false);

  // Use incognito utils to get display information
  const displayName = getDisplayName(profile);
  const displayPhotos = getDisplayPhotos(profile, profile.photos || []);
  const displayBio = getDisplayBio(profile);
  const displayDetails = getDisplayDetails(profile);
  const isAnonymous = shouldDisplayAnonymously(profile);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % displayPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
  };

  // Calculate age if available
  const age = displayDetails.age;

  return (
    <Card className="w-full max-w-sm mx-auto h-[600px] overflow-hidden shadow-xl">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Photo Section */}
        <div className="relative flex-1 bg-gray-100">
          {/* Incognito Badge */}
          {isAnonymous && (
            <div className="absolute top-3 left-3 z-20">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                <EyeOff className="h-3 w-3 mr-1" />
                Anonymous
              </Badge>
            </div>
          )}

          {/* Compatibility Score */}
          <div className="absolute top-3 right-3 z-20">
            <CompatibilityScore score={profile.compatibility_score || 85} />
          </div>

          {/* Photo Navigation */}
          {displayPhotos.length > 0 && (
            <>
              <img
                src={displayPhotos[currentPhotoIndex]}
                alt={displayName}
                className={`w-full h-full object-cover ${isAnonymous ? 'blur-sm' : ''}`}
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNTAgMTQwQzUwIDEyMC45IDY1LjkgMTA1IDg1IDEwNUgxMTVDMTM0LjEgMTA1IDE1MCAxMjAuOSAxNTAgMTQwVjE2MEg1MFYxNDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=";
                }}
              />

              {/* Photo indicators */}
              {displayPhotos.length > 1 && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                  {displayPhotos.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 w-8 rounded-full ${
                        index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Navigation areas */}
              {displayPhotos.length > 1 && (
                <>
                  <div
                    className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10"
                    onClick={prevPhoto}
                  />
                  <div
                    className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10"
                    onClick={nextPhoto}
                  />
                </>
              )}
            </>
          )}

          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">
                {displayName}
                {age && !isAnonymous && `, ${age}`}
              </h2>
              {isAnonymous && (
                <Info className="h-4 w-4 text-purple-300" />
              )}
            </div>
          </div>

          {!isAnonymous && (
            <div className="flex items-center gap-4 text-sm opacity-90 mb-2">
              {displayDetails.year !== "Hidden" && (
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>{displayDetails.year} • {displayDetails.branch}</span>
                </div>
              )}
              {displayDetails.hometown !== "Hidden" && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{displayDetails.hometown}</span>
                </div>
              )}
            </div>
          )}

          <p className={`text-sm leading-relaxed ${showFullBio ? '' : 'line-clamp-2'}`}>
            {displayBio}
          </p>

          {displayBio.length > 100 && (
            <button
              onClick={() => setShowFullBio(!showFullBio)}
              className="text-xs text-white/80 hover:text-white mt-1 underline"
            >
              {showFullBio ? 'Show less' : 'Read more'}
            </button>
          )}

          {/* Interests (hidden for anonymous users) */}
          {!isAnonymous && profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {profile.interests.slice(0, 3).map((interest: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                  +{profile.interests.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Anonymous user notice */}
          {isAnonymous && (
            <div className="mt-3 p-2 bg-purple-900/50 rounded-lg border border-purple-400/30">
              <p className="text-xs text-purple-200">
                This user is browsing anonymously. Match to start a conversation and learn more!
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-20">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full w-12 h-12 bg-white/90 hover:bg-white border-2 border-gray-200"
            onClick={onPass}
          >
            <X className="h-5 w-5 text-gray-600" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="rounded-full w-12 h-12 bg-blue-500/90 hover:bg-blue-600 border-2 border-blue-400 text-white"
            onClick={onSuperLike}
          >
            <Star className="h-5 w-5" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="rounded-full w-12 h-12 bg-green-500/90 hover:bg-green-600 border-2 border-green-400 text-white"
            onClick={onLike}
          >
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}