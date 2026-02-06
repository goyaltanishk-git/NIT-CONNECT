import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { motion, AnimatePresence } from "framer-motion"; // ⭐ Import Framer Motion
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
  School,
  BookOpen
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type ProfilePhoto = Database["public"]["Tables"]["user_photos"]["Row"];
type UserPrompt = Database["public"]["Tables"]["user_prompts"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  photos: ProfilePhoto[];
  interests: string[];
  full_name?: string;
};

interface UserProfileDialogProps {
  profile: Profile | null;
  isOpen: boolean;
  onClose: () => void;
 onLikeBack?: (email: string) => void; // ✅ Change from id to email
  onPass?: (email: string) => void;
  showActionButtons?: boolean;
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

// ⭐ Swipe Logic Constants
const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

// ⭐ Animation Variants
const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

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
  const [direction, setDirection] = useState(0); // ⭐ Direction State

  useEffect(() => {
    if (profile) {
      setCurrentPhotoIndex(0);
      setIsImageLoading(true);
      setDirection(0);
    }
  }, [profile]);

  if (!profile) return null;

  const nextPhoto = () => {
    if (profile.photos && profile.photos.length > 1) {
      setDirection(1); // ⭐ Set slide direction
      setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length);
      setIsImageLoading(true);
    }
  };

  const prevPhoto = () => {
    if (profile.photos && profile.photos.length > 1) {
      setDirection(-1); // ⭐ Set slide direction
      setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length);
      setIsImageLoading(true);
    }
  };

  const handleImageLoad = () => {
    setIsImageLoading(false);
  };

  const rawFullName = `${profile.first_name || 'Unknown'} ${profile.last_name || ''}`.trim();
  const profileName = (() => {
    if (profile.full_name) return profile.full_name;

    const f = profile.first_name || 'Unknown';
    const l = profile.last_name || '';
    const combined = `${f} ${l}`.trim();
    
    let cleaned = combined;
    if (l && f.toLowerCase().includes(l.toLowerCase())) cleaned = f;
    if (cleaned.toLowerCase().endsWith('null')) cleaned = f;
    
    return cleaned;
  })();
  const profileAge = calculateAge(profile.date_of_birth);
  const profilePhotos = profile.photos || [];
const profileActionId = profile?.email || "";
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="    w-full max-w-[420px]
   h-[90vh] p-0 overflow-y-auto border-white/10 bg-gradient-to-br from-black via-gray-900/50 to-black glass backdrop-blur-xl shadow-2xl rounded-3xl flex flex-col">
        
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>{profileName}'s Profile</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-[999] bg-pink-500/20 hover:bg-pink-500/40 border border-pink-500/30 rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
        >
          <X className="w-4 h-4 text-white" />
        </button>
        
        <div className="overflow-y-auto h-full  [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* --- TOP SECTION: IMAGE --- */}
          {/* ⭐ Added overflow-hidden */}
          <div className="relative w-full h-[60%] shrink-0 bg-black/20 overflow-hidden">
            
            {/* NAVIGATION ARROWS */}
            {profilePhotos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 transition-all duration-200 group"
                >
                  <ChevronLeft className="w-5 h-5 text-white/90 group-hover:text-white" />
                </button>
                
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 transition-all duration-200 group"
                >
                  <ChevronRight className="w-5 h-5 text-white/90 group-hover:text-white" />
                </button>
              </>
            )}

            {/* Loading Spinner */}
            {isImageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-pink-600/20 animate-pulse flex items-center justify-center z-0">
                <Sparkles className="w-8 h-8 text-white/30 animate-spin" />
              </div>
            )}

            {/* ⭐ Framer Motion Image Slider */}
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={currentPhotoIndex}
src={profilePhotos[currentPhotoIndex]?.photo_url
  ? profilePhotos[currentPhotoIndex].photo_url
  : undefined
}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);

                  if (swipe < -swipeConfidenceThreshold) {
                    nextPhoto();
                  } else if (swipe > swipeConfidenceThreshold) {
                    prevPhoto();
                  }
                }}
                onLoad={handleImageLoad}
                alt={profileName}
                className="absolute inset-0 w-full h-full object-cover "
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none z-10" />

            {/* Photo Indicators */}
            {profilePhotos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1.5 border border-white/20">
                {profilePhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentPhotoIndex ? 1 : -1);
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

            <div className="absolute bottom-3 right-3 z-20 text-[10px] font-semibold text-white bg-white/10 backdrop-blur-sm rounded-full px-2 py-1 border border-white/20">
              {currentPhotoIndex + 1}/{profilePhotos.length || 1}
            </div>
          </div>

          {/* --- BOTTOM SECTION: DETAILS --- */}
          <div className="flex-1  p-4 space-y-4">
            
            {/* Name and Basic Info - UPDATED SIZE (Reduced) */}
            <div>
              <h2 className="text-2xl font-bold gradient-text-animated mb-1">
                {profileName}
                {profileAge && (
                  <span className="text-xl text-gray-300 font-normal">, {profileAge}</span>
                )}
              </h2>
            </div>
            <Card className="glass-light border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-4 flex items-center gap-2">
                  <School className="w-5 h-5 text-pink-400 flex-shrink-0" />
                  <span className="text-base text-white">
                    {profile.college}
                 
                   
                  </span>
                </CardContent>
              </Card>

            {/* Education Card */}
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
             

            {/* Bio Section */}
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

            {/* Personal Details Grid */}
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
          </div>

          {/* Action Buttons (Fixed at bottom) */}
          {showActionButtons && (onLikeBack || onPass) && (
            <div className="px-4 pb-4 pt-2 flex gap-3 border-t border-white/10 bg-black/40 backdrop-blur-md">
              {onPass && (
                <Button
                  onClick={() => onPass(profileActionId)}
                  className="flex-1 border border-pink-500/40 text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 hover:border-pink-500/60
  transition-all duration-300 py-6 rounded-xl text-lg"
                >
                  Pass
                </Button>
              )}
              {onLikeBack && (
                <Button
                  onClick={() => onLikeBack(profileActionId)}
                  className="flex-1 bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 animate-pulse-glow
  text-white shadow-lg hover:shadow-pink-500/25 transition-all duration-300 py-6 rounded-xl text-lg"
                >
                  Like Back
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}