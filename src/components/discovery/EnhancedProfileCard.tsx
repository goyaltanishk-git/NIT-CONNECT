// EnhancedProfileCard — cleaned & fixed
// - Direction-aware slide animation between photos
// - Arrows fade slowly on hover and remain visible while hovered
// - Touch swipe + keyboard support
// - Drop-up sheet animates bottom→up and closes on tap

import React, { useEffect, useRef, useState } from "react";
import { Heart, X, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface Photo { url: string; order?: number }

interface Profile {
  id: string;
  full_name: string;
  age: number;
  bio: string;
  year: string | number;
  branch: string;
  hometown: string;
  interests: string[];
  photos: Photo[];
  height: string;
  looking_for: string;
  verified: boolean;
}

interface ProfileCardProps {
  profile: Profile;
  onLike: () => void;
  onPass: () => void;
}

export function EnhancedProfileCard({ profile, onLike, onPass }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const directionRef = useRef<number>(1); // 1 forward, -1 backward

  const nextPhoto = () => {
    if (!profile.photos || profile.photos.length <= 1) return;
    directionRef.current = 1;
    setCurrentPhotoIndex((p) => (p + 1) % profile.photos.length);
  };

  const prevPhoto = () => {
    if (!profile.photos || profile.photos.length <= 1) return;
    directionRef.current = -1;
    setCurrentPhotoIndex((p) => (p - 1 + profile.photos.length) % profile.photos.length);
  };

  const handleMouseEnter = () => setShowArrows(true);
  const handleMouseLeave = () => setShowArrows(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0].screenX;
    const dx = touchStartX.current - endX;
    if (dx > 60) nextPhoto();
    if (dx < -60) prevPhoto();
    touchStartX.current = null;
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setShowDetails(false);
      if (ev.key === "ArrowRight") nextPhoto();
      if (ev.key === "ArrowLeft") prevPhoto();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profile.photos]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 800) {
      setShowDetails(false);
    }
  };

  const photoVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  } as const;

  const arrowInitial = { opacity: 0, x: 0 };
  const arrowAnimate = { opacity: 1, x: 0, transition: { duration: 0.55 } };
  const arrowExit = { opacity: 0, x: 0, transition: { duration: 0.4 } };

  return (
    <div
      className="relative w-[68vw] max-w-[360px] h-[calc(90vh-7rem)] rounded-[36px] overflow-hidden border-[2px] border-pink-400/40 /60 flex flex-col justify-start backdrop-blur-xl shadow-[0_0_28px_rgba(255,90,200,0.55)]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo area (takes ~80%) */}
      <div className="relative h-[70%] w-full overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={directionRef.current}>
          <motion.img
            key={currentPhotoIndex}
            src={profile.photos?.[currentPhotoIndex]?.url || "/api/placeholder/800/1000"}
            alt={profile.full_name}
            className="absolute inset-0 w-full h-full object-cover object-center"
            draggable={false}
            custom={directionRef.current}
            variants={photoVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: "easeOut" }}
            onClick={() => setShowDetails(true)}
          />
        </AnimatePresence>

        {/* Top fade */}
        <div className="absolute top-0 left-0 w-full h-[14%] bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

        {/* Arrows (overlayed on photo) */}
        <AnimatePresence>
          {showArrows && profile.photos && profile.photos.length > 1 && (
            <motion.button
              key="prev-arrow"
              initial={arrowInitial}
              animate={arrowAnimate}
              exit={arrowExit}
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30"
              aria-label="Previous photo"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="bg-black/45 backdrop-blur-md p-2 rounded-full">
                <ChevronLeft className="w-6 h-6 text-white" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showArrows && profile.photos && profile.photos.length > 1 && (
            <motion.button
              key="next-arrow"
              initial={arrowInitial}
              animate={arrowAnimate}
              exit={arrowExit}
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30"
              aria-label="Next photo"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="bg-black/45 backdrop-blur-md p-2 rounded-full">
                <ChevronRight className="w-6 h-6 text-white" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 20% blurred transition (over photo bottom) */}
      <div className="absolute bottom-[30%] left-0 w-full h-[15%] bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none z-20" />

      {/* Bottom black blurred block (20%) with name + buttons */}
      <div className="absolute bottom-0 left-0 w-full h-[30%] bg-black/85 backdrop-blur-2xl border-t border-pink-500/50 shadow-[0_0_45px_rgba(255,0,170,0.75)] flex flex-col justify-between pb-3 pt-4 px-6 z-30">
        <div className="pointer-events-none">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-pink-500 drop-shadow-[0_0_10px_rgba(255,0,170,0.9)]" style={{ fontFamily: "'Playfair Display', serif" }}>{profile.full_name}</h2>
            <span className="text-lg opacity-90">{profile.age}</span>
            {profile.verified && <Shield className="w-5 h-5 text-green-400" />}
          </div>
          <p className="text-white/85 mt-1 max-w-xs line-clamp-1 text-sm">{profile.bio}</p>
        </div>

        <div className="w-full flex justify-center">
          <div className="flex gap-6 bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-pink-500/40 shadow-[0_0_18px_rgba(255,0,170,0.7)]">
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => { e.stopPropagation(); onPass(); }}
              className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-red-400/40 shadow-[0_0_14px_rgba(255,70,70,0.5)] flex items-center justify-center"
              aria-label="Pass"
            >
              <X className="w-6 h-6 text-red-300" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 border border-pink-300/30 shadow-[0_0_16px_rgba(255,120,200,0.6)] flex items-center justify-center text-white"
              aria-label="Like"
            >
              <Heart className="w-6 h-6 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Drop-up sheet */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            onClick={(e) => { e.stopPropagation(); setShowDetails(false); }}
            className="absolute bottom-0 left-0 w-full rounded-t-[40px] bg-black/70 backdrop-blur-3xl border-t border-white/30 shadow-[0_-25px_55px_rgba(0,0,0,0.7)] p-7 z-50 max-h-[80%] overflow-y-auto"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
          >
            <div className="w-full flex justify-center mb-5">
              <div className="w-16 h-1.5 bg-white/50 rounded-full" />
            </div>

            <h2 className="text-[26px] font-semibold text-pink-500 drop-shadow-[0_0_12px_rgba(255,0,150,0.9)]">{profile.full_name}, {profile.age}</h2>
            <p className="text-white/80 mt-3 leading-relaxed drop-shadow-sm">{profile.bio}</p>

            <div className="mt-7">
              <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
              <div className="grid grid-cols-2 gap-3">
                {["year", "branch", "height", "hometown", "looking_for"].map((key) => (
                  <div key={key} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 text-white/90">
                    <p className="text-pink-500 text-xs capitalize">{key.replace("_", " ")}</p>
                    <p className="mt-1">{(profile as any)[key]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <h3 className="text-lg font-semibold text-pink-500 mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((i) => (
                  <span key={i} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm">{i}</span>
                ))}
              </div>
            </div>

            <div className="h-12" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}