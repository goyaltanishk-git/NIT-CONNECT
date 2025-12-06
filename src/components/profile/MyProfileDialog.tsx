import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  X,
  Heart,
  Star,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Ruler,
  Home,
  BookOpen
} from "lucide-react";
import { Database } from "@/integrations/supabase/types"; 

type ProfilePhoto = Database["public"]["Tables"]["user_photos"]["Row"];
type UserPrompt = Database["public"]["Tables"]["user_prompts"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  photos: ProfilePhoto[];
  interests: string[];
  prompts: UserPrompt[];
  elo_rating?: number | null; 
};

interface MyProfileDialogProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

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

export function MyProfileDialog({
  profile,
  isOpen,
  onClose,
}: MyProfileDialogProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setCurrentPhotoIndex(0);
      setIsImageLoading(true);
    }
  }, [profile]);

  if (!profile) return null;

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (profile.photos && profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length);
      setIsImageLoading(true);
    }
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (profile.photos && profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
      setIsImageLoading(true);
    }
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const profileName = profile.first_name || 'Unknown';
  const profileAge = calculateAge(profile.date_of_birth);
  const profilePhotos = profile.photos || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] p-0 overflow-hidden border-white/10 bg-gradient-to-br from-black via-gray-900/50 to-black glass backdrop-blur-xl shadow-2xl rounded-3xl flex flex-col">
        
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>{profileName}'s Profile</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 bg-pink-500/20 hover:bg-pink-500/40 border border-pink-500/30 rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* --- TOP SECTION: IMAGE (60% Height) --- */}
        <div className="relative w-full h-[60%] shrink-0 bg-black/20">
          
          {/* NAVIGATION ARROWS (Smaller & Thinner) */}
          {profilePhotos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                // UPDATED: p-1 for smaller touch target area visually
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 transition-all duration-200 group"
              >
                {/* UPDATED: w-4 h-4 for smaller icon */}
                <ChevronLeft className="w-4 h-4 text-white/90 group-hover:text-white" />
              </button>
              
              <button
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 transition-all duration-200 group"
              >
                {/* UPDATED: w-4 h-4 for smaller icon */}
                <ChevronRight className="w-4 h-4 text-white/90 group-hover:text-white" />
              </button>
            </>
          )}

          {/* Main Photo */}
          {isImageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-pink-600/20 animate-pulse flex items-center justify-center">
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

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />

          {/* Photo Indicators */}
          {profilePhotos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1.5 border border-white/20">
              {profilePhotos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentPhotoIndex(index);
                    setIsImageLoading(true);
                  }}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentPhotoIndex
                      ? 'w-6 bg-pink-500'
                      : 'w-1.5 bg-pink-500/20 hover:bg-pink-500/40'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-3 right-3 z-10 text-[10px] font-semibold text-white bg-white/10 backdrop-blur-sm rounded-full px-2 py-1 border border-white/20">
            {currentPhotoIndex + 1}/{profilePhotos.length || 1}
          </div>
        </div>

        {/* --- BOTTOM SECTION: DETAILS (Compact Scale) --- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Name and Basic Info */}
          <div>
            <h2 className="text-4xl font-bold gradient-text-animated mb-1">
              {profileName}
              {profileAge && (
                <span className="text-3xl text-gray-300 font-normal">, {profileAge}</span>
              )}
            </h2>
          </div>

          {/* ELO Rating */}
          {profile.elo_rating && (
            <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/20 rounded-lg px-2 py-1 text-sm text-white">
              <Star className="w-4 h-4 text-yellow-400" />
              Rating: {profile.elo_rating}
            </div>
          )}

          {/* Education Card (Compact) */}
          {(profile.year_of_study || profile.branch) && (
            <Card className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-pink-400 flex-shrink-0" />
                <span className="text-base text-white">
                  {profile.year_of_study}
                  {profile.branch && ` • ${profile.branch}`}
                </span>
              </CardContent>
            </Card>
          )}

          {/* Bio Section (Compact) */}
          {profile.bio && (
            <Card className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-4 space-y-1.5">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  About Me
                </h3>
                <p className="text-base text-gray-300 leading-snug">{profile.bio}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Hometown Card */}
          {profile.hometown && (
            <Card className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-gray-400 mb-1 flex items-center gap-2">
                  <Home className={`w-4 h-4 text-purple-400`} />
                  Hometown
                </p>
                <p className="text-base text-white font-medium">{profile.hometown}</p>
              </CardContent>
            </Card>
          )}

          {/* Personal Details - UPDATED: STACKED VERTICALLY */}
          {/* Changed 'grid grid-cols-2' to 'space-y-3' so no two items are in the same row */}
          <div className="space-y-3">
            {[
              { icon: Ruler, label: "Height", value: profile.height ? `${profile.height} cm` : null, color: "text-green-400" },
              { icon: User, label: "Gender", value: profile.gender ? (profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)) : null, color: "text-blue-400" },
              { icon: Calendar, label: "Age", value: profileAge && `${profileAge} years`, color: "text-orange-400" },
            ].filter(item => item.value).map((item, index) => (
              <Card key={index} className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-gray-400 mb-1 flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    {item.label}
                  </p>
                  <p className="text-base text-white font-medium">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Interests Section */}
          {profile.interests && profile.interests.length > 0 && (
            <Card className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, index) => (
                    <Badge
                      key={index}
                      className="text-sm bg-gradient-to-r from-pink-500/20 to-pink-600/20 border border-pink-500/40 text-pink-300 hover:from-pink-500/30 hover:to-pink-600/30 transition-all duration-300"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prompts Section */}
          {profile.prompts && profile.prompts.length > 0 && (
            <Card className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-pink-400" />
                  Get to Know Me
                </h3>
                {profile.prompts.map((prompt, index) => (
                  <div key={index} className="border-t border-white/10 pt-2 first:border-t-0 first:pt-0">
                    <p className="text-sm font-semibold text-gray-400 mb-1">{prompt.prompt_question}</p>
                    <p className="text-base text-white leading-relaxed">{prompt.prompt_answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}