import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  X,
  Heart,
  Star,
  MapPin, // Kept for Hometown
  GraduationCap,
  MessageCircle,
  Tag,
  Camera,
  Shield, // Removed from use
  Clock, // Removed from use
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  User,
  Calendar,
  Ruler,
  Search,
  Home,
  BookOpen,
  Target,
  Award,
  Mail,
  Phone,
  Instagram,
  Github,
  Linkedin
} from "lucide-react";
// --- UPDATED IMPORTS ---
import { Database } from "@/integrations/supabase/types"; // Import Database type

// --- TYPE DEFINITIONS TO MATCH YOUR `types.ts` ---
type ProfilePhoto = Database["public"]["Tables"]["user_photos"]["Row"];
type UserPrompt = Database["public"]["Tables"]["user_prompts"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  photos: ProfilePhoto[];
  interests: string[]; // Assuming interests are passed as a string array
  prompts: UserPrompt[];
  elo_rating?: number | null; // Assuming elo_rating is joined
};

interface UserProfileDialogProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onLikeBack?: (profileId: string) => void;
  onPass?: (profileId: string) => void;
  showActionButtons?: boolean;
}

// Age calculation function
function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function UserProfileDialog({
  profile,
  isOpen,
  onClose,
  onLikeBack,
  onPass,
  showActionButtons = false
}: UserProfileDialogProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setCurrentPhotoIndex(0);
      setIsImageLoading(true);
    }
  }, [profile]);

  if (!profile) return null;

  const nextPhoto = () => {
    if (profile.photos && profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length);
      setIsImageLoading(true);
    }
  };

  const prevPhoto = () => {
    if (profile.photos && profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
      setIsImageLoading(true);
    }
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  // Handle different profile structures
  const profileName = profile.first_name || 'Unknown';
  const profileAge = calculateAge(profile.date_of_birth);
  const profilePhotos = profile.photos || [];
  const profileActionId = profile.user_id; // Use user_id for actions

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* --- UPDATED: Size changed back to max-w-4xl --- */}
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-white/10 bg-gradient-to-br from-black via-gray-900/50 to-black glass border-white/10
 backdrop-blur-xl shadow-2xl rounded-3xl">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>{profileName}'s Profile</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        {/* Enhanced Header with close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-pink-500/20 hover:bg-pink-500/40 border border-pink-500/30
 rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Enhanced Photo Section */}
        {/* --- UPDATED: Height set to h-[48rem] (768px) --- */}
        <div className="relative w-full h-[48rem] bg-black/20">
          {/* Navigation Areas */}
          {profilePhotos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-0 top-0 h-full w-16 z-10 flex items-center justify-center hover:bg-white/5 transition-colors duration-200 group"
              >
                <ChevronLeft className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-0 top-0 h-full w-16 z-10 flex items-center justify-center hover:bg-white/5 transition-colors duration-200 group"
              >
                <ChevronRight className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
            </>
          )}

          {/* Main Photo */}
          {isImageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-pink-600/20
 animate-pulse flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white/30 animate-spin" />
            </div>
          )}
          <img
            src={profilePhotos[currentPhotoIndex]?.photo_url}
            alt={profileName}
            onLoad={handleImageLoad}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isImageLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />

          {/* Enhanced Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />

          {/* Enhanced Photo Indicators */}
          {profilePhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 border border-white/20">
              {profilePhotos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentPhotoIndex(index);
                    setIsImageLoading(true);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentPhotoIndex
                      ? 'w-8 bg-pink-500'
                      : 'w-2 bg-pink-500/20 hover:bg-pink-500/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Enhanced Photo Count */}
          <div className="absolute bottom-4 right-4 z-10 text-xs font-semibold text-white bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
            {currentPhotoIndex + 1}/{profilePhotos.length || 1}
          </div>
        </div>

        {/* Enhanced Profile Information Section */}
        {/* --- Increased max-h to [36rem] (576px) --- */}
        <div className="p-6 space-y-4 max-h-[36rem] overflow-y-auto">
          {/* Enhanced Name and Basic Info */}
          <div>
            {/* --- Increased text size --- */}
            <h2 className="text-5xl font-bold gradient-text-animated mb-2">
              {profileName}
              {profileAge && (
                <span className="text-4xl text-gray-300 font-normal">, {profileAge}</span>
              )}
            </h2>
          </div>

          {/* ELO Rating */}
          {profile.elo_rating && (
            // --- Increased text size ---
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 text-lg text-white">
              <Star className="w-5 h-5 text-yellow-400" />
              Rating: {profile.elo_rating}
            </div>
          )}

          {/* Enhanced Education Card */}
          {(profile.year_of_study || profile.branch) && (
            <Card className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
              {/* --- Increased padding and icon/text size --- */}
              <CardContent className="p-6 flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-pink-400 flex-shrink-0" />
                <span className="text-lg text-white">
                  {profile.year_of_study}
                  {profile.branch && ` • ${profile.branch}`}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Bio Section */}
          {profile.bio && (
            <Card className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
              {/* --- Increased padding and icon/text size --- */}
              <CardContent className="p-6 space-y-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-400" />
                  About Me
                </h3>
                <p className="text-lg text-gray-300 leading-relaxed">{profile.bio}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Hometown Card (Moved from top) */}
          {profile.hometown && (
            <Card className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
              {/* --- Increased padding and icon/text size --- */}
              <CardContent className="p-6">
                <p className="text-base font-semibold text-gray-400 mb-1.5 flex items-center gap-2">
                  <Home className={`w-5 h-5 text-purple-400`} />
                  Hometown
                </p>
                <p className="text-lg text-white font-medium">{profile.hometown}</p>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Personal Details Grid */}
          {[
            { icon: Ruler, label: "Height", value: profile.height ? `${profile.height} cm` : null, color: "text-green-400" },
            { icon: Calendar, label: "Age", value: profileAge && `${profileAge} years old`, color: "text-orange-400" },
            // ⛔️ User ID line removed
          ].filter(item => item.value).map((item, index) => (
            <Card key={index} className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
              {/* --- Increased padding and icon/text size --- */}
              <CardContent className="p-6">
                <p className="text-base font-semibold text-gray-400 mb-1.5 flex items-center gap-2">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  {item.label}
                </p>
                <p className="text-lg text-white font-medium">{item.value}</p>
              </CardContent>
            </Card>
          ))}

          {/* Enhanced Interests Section */}
          {profile.interests && profile.interests.length > 0 && (
            <Card className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
              {/* --- Increased padding and icon/text size --- */}
              <CardContent className="p-6 space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-pink-400" />
                  Interests & Hobbies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <Badge
                      key={index}
                      // --- Increased text size ---
                      className="text-base bg-gradient-to-r from-pink-500/20 to-pink-600/20 border border-pink-500/40 text-pink-300 hover:from-pink-500/30 hover:to-pink-600/30
 text-pink-300 hover:from-pink-500/30 hover:to-purple-500/30 hover:border-pink-500/50 transition-all duration-300"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Prompts Section */}
          {profile.prompts && profile.prompts.length > 0 && (
            <Card className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
              {/* --- Increased padding and icon/text size --- */}
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-pink-400" />
                  Get to Know Me
                </h3>
                {profile.prompts.map((prompt, index) => (
                  <div key={index} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
                    <p className="text-base font-semibold text-gray-400 mb-1.5">{prompt.prompt_question}</p>
                    <p className="text-lg text-white leading-relaxed">{prompt.prompt_answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enhanced Action Buttons */}
        {showActionButtons && (onLikeBack || onPass) && (
          // --- Increased padding and text size ---
          <div className="px-6 pb-6 flex gap-4 border-t border-white/10 pt-4">
            {onPass && (
              <Button
                onClick={() => onPass(profileActionId)}
                className="flex-1 border border-pink-500/40 text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 hover:border-pink-500/60
 transition-all duration-300 py-6 rounded-xl backdrop-blur-sm bg-transparent text-xl"
              >
                Pass
              </Button>
            )}
            {onLikeBack && (
              <Button
                onClick={() => onLikeBack(profileActionId)}
                className="flex-1 bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 animate-pulse-glow
 text-white shadow-lg hover:shadow-pink-500/25 transition-all duration-300 py-6 rounded-xl text-xl"
              >
                Like Back
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}