import React, { useEffect, useRef, useState } from "react";
import { Heart, X, ChevronLeft, ChevronRight, GraduationCap, Calendar } from "lucide-react";
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
  lives_in: string;
  distance_from_you: string;
}
interface ProfileCardProps {
  profile: Profile;
  onLike: () => void;
  onPass: () => void;
}

const getFirstName = (fullName: string) => fullName.split(" ")[0];

export function EnhancedProfileCard({ profile, onLike, onPass }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const directionRef = useRef<number>(1);
  const [burst, setBurst] = useState(false);

  const toggleFlip = () => setIsFlipped((prev) => !prev);

  const nextPhoto = () => {
    if (isFlipped || profile.photos.length <= 1) return;
    directionRef.current = 1;
    setCurrentPhotoIndex((p) => (p + 1) % profile.photos.length);
  };

  const prevPhoto = () => {
    if (isFlipped || profile.photos.length <= 1) return;
    directionRef.current = -1;
    setCurrentPhotoIndex((p) => (p - 1 + profile.photos.length) % profile.photos.length);
  };

  const handleMouseEnter = () => setShowArrows(true);
  const handleMouseLeave = () => setShowArrows(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isFlipped) return;
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isFlipped) return;
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0].screenX;
    const dx = touchStartX.current - endX;
    if (dx > 60) nextPhoto();
    if (dx < -60) prevPhoto();
    touchStartX.current = null;
  };

  const triggerBurst = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike();
    setBurst(true);
    setTimeout(() => setBurst(false), 400);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (isFlipped && ev.key === "Escape") setIsFlipped(false);
      if (!isFlipped && ev.key === "ArrowRight") nextPhoto();
      if (!isFlipped && ev.key === "ArrowLeft") prevPhoto();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profile.photos, isFlipped]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 800) {
      setIsFlipped(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      
      {/* CARD WRAPPER WITH SCALE-IN ANIMATION */}
      <motion.div
        className="
          relative w-[68vw] max-w-[360px] h-[590px]
          perspective-[1000px]
          animate-scale-in
        "
        style={{ transformStyle: "preserve-3d" }}
      >

        {/* FRONT FACE */}
        <motion.div
          className="
            absolute inset-0 
            border-2 border-pink-300 rounded-3xl overflow-hidden 
            shadow-2xl 
            bg-gradient-to-br from-pink-500/40 to-purple-600/40 
            backdrop-blur-3xl
            cursor-pointer 
            card-hover
          "
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 120, damping: 20 }}
          style={{ backfaceVisibility: "hidden" }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={toggleFlip}
        >

          {/* PHOTO SECTION */}
          <div className="relative w-full h-[63%] overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <img
                key={currentPhotoIndex}
                src={profile.photos[currentPhotoIndex]?.url || "/api/placeholder/800/1000"}
                alt={profile.full_name}
                className={`
                  absolute inset-0 w-full h-full object-cover object-center
                  ${directionRef.current === 1 ? "animate-slide-in-right" : "animate-slide-in-left"}
                `}
                draggable={false}
              />
            </AnimatePresence>

            {/* ARROWS */}
            {showArrows && profile.photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="interactive absolute left-3 top-1/2 -translate-y-1/2 z-30 opacity-80"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="interactive absolute right-3 top-1/2 -translate-y-1/2 z-30 opacity-80"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}
          </div>

          {/* INFO SECTION */}
          <div className="relative w-full h-[37%] bg-black backdrop-blur-2xl">
            
            {/* NAME + AGE WITH HEARTBEAT */}
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-4xl my-2 ms-5 font-bold text-pink-500 animate-heartbeat">
                {getFirstName(profile.full_name)},
              </h2>
              <span className="text-2xl text-pink-100/90">{profile.age}</span>
            </div>

            {/* TAGS */}
            <div className="flex flex-wrap ms-3 text-xs text-white/80 mb-4">
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full gradient-text">
                <GraduationCap className="w-3 h-3" />
                {profile.branch} Engineering
              </div>

              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full gradient-text">
                <Calendar className="w-3 h-3" />
                B.Tech {profile.year} Year
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-evenly">
              <motion.button
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.12 }}
                onClick={(e) => { e.stopPropagation(); onPass(); }}
                className="interactive hover-glow w-14 h-14 rounded-full bg-pink-200/50 backdrop-blur-2xl border-2 border-pink-100 flex items-center justify-center mt-2"
              >
                <X className="w-8 h-8 text-rose-300" />
              </motion.button>

              {/* LIKE BUTTON WITH PULSE + EXPLOSION */}
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.88 }}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerBurst(e);
                }}
                className="
                  relative w-20 h-20 rounded-full overflow-hidden interactive
                  bg-gradient-to-br from-pink-700 to-purple-400
                  shadow-[0_0_25px_rgba(255,120,170,0.55)]
                  border border-pink-300/100
                  flex items-center justify-center
                  transition-all duration-300
                  animate-pulse-glow
                "
              >
                {burst && (
                  <span className="absolute inset-0 animate-like-explosion bg-pink-300/60 rounded-full"></span>
                )}

                <Heart className="w-10 h-10 text-white drop-shadow-xl z-10" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* BACK FACE */}
        <motion.div
          className="
            absolute inset-0 w-full h-full 
            rounded-3xl overflow-hidden
            bg-black/90 backdrop-blur-xl
            border-2 border-pink-300
            shadow-2xl
            cursor-pointer
          "
          initial={false}
          animate={{ rotateY: isFlipped ? 0 : -180 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 120, damping: 20 }}
          style={{ backfaceVisibility: "hidden" }}
          onClick={toggleFlip}
        >
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            dragElastic={0.5}
            className="
              h-full overflow-y-auto hide-scrollbar
              bg-gradient-to-b from-black/30 via-black/40 to-black/60
            "
          >

            {/* TOP LIKE BUTTON */}
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className="interactive absolute top-4 right-4 z-10 w-10 h-10 rounded-full hover-glow bg-gradient-to-br from-pink-700 to-purple-400 shadow-[0_0_25px_rgba(255,120,170,0.55)] border border-pink-300/100 flex items-center justify-center text-white"
            >
              <Heart className="w-6 h-6" />
            </button>

            {/* SMALL PREVIEW IMAGE */}
            <div className="relative w-full p-2 animate-shimmer">
              <div className="
                relative w-full h-60 rounded-3xl overflow-hidden
                bg-white/5 backdrop-blur-xl
                border border-white/10
                shadow-[0_8px_30px_rgba(0,0,0,0.5)]
              ">
                <img
                  src={profile.photos[currentPhotoIndex]?.url}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            </div>

            {/* CONTENT */}
            <div className="px-6 pb-20">

              {/* NAME */}
              <h2 className="text-4xl font-bold text-pink-500 mb-1 mt-4 animate-heartbeat">
                {getFirstName(profile.full_name)}
                <span className="text-2xl text-white/60">, {profile.age}</span>
              </h2>

              {/* TAGS */}
              <div className="flex flex-wrap gap-3 mt-4 mb-10">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-pink-200 text-xs shadow-sm gradient-text-animated">
                  <GraduationCap className="w-3 h-3" />
                  {profile.branch} Engg.
                </div>

                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-pink-200 text-xs shadow-sm gradient-text-animated">
                  <Calendar className="w-3 h-3" />
                  B.Tech {profile.year} Year
                </div>
              </div>

              {/* ABOUT */}
              <h3 className="text-lg font-semibold text-pink-300 mb-2">About Me</h3>
              <p className="text-white/80">{profile.bio}</p>

              {/* DIVIDER */}
              <div className="my-6 border-t border-pink-500/40" />

              {/* DETAILS */}
              <h3 className="text-lg font-semibold text-pink-300 mb-4">Details</h3>

              <div className="grid grid-cols-2 gap-4">
                {["height", "hometown", "looking_for"].map((key) =>
                  (profile as any)[key] && (
                    <div
                      key={key}
                      className="
                        p-4 rounded-2xl bg-white/10 backdrop-blur-xl
                        border border-pink-500 shadow-sm
                        hover:bg-white/15 transition-all
                        interactive
                      "
                    >
                      <p className="text-xs text-white/50 uppercase tracking-wide">
                        {key.replace("_", " ")}
                      </p>
                      <p className="text-white font-small mt-1">
                        {(profile as any)[key]}
                      </p>
                    </div>
                  )
                )}
              </div>

              {/* DIVIDER */}
              <div className="my-10 border-t border-pink-500/40" />

              {/* INTERESTS */}
              <h3 className="text-lg font-semibold text-pink-300 mb-3">
                Interests
              </h3>

              <div className="flex flex-wrap gap-3">
                {profile.interests.map((i) => (
                  <span
                    key={i}
                    className="
                      px-4 py-2 rounded-full text-sm font-medium border border-pink-500 
                      text-pink-200 backdrop-blur-xl shadow-sm 
                      gradient-text-animated
                    "
                  >
                    {i}
                  </span>
                ))}
              </div>

            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
