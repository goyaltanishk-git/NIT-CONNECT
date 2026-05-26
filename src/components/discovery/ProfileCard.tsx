// src/components/discovery/ProfileCard.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, X, Star, EyeOff, Info } from "lucide-react";
import { CompatibilityScore } from "./CompatibilityScore";
import { getDisplayName, getDisplayPhotos, getDisplayBio, getDisplayDetails, shouldDisplayAnonymously } from "@/utils/incognitoUtils";

// Import the new CSS for the glowing card effect
import './NewProfileCard.css';

// --- Helper functions for the tilt effect from ProfileCard.jsx ---
const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);
const round = (value: number, precision = 3) => parseFloat(value.toFixed(precision));
const adjust = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) =>
  round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

interface ProfileCardProps {
  profile: any;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
}

export function ProfileCard({ profile, onLike, onPass, onSuperLike }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // --- Data Logic from your original ProfileCard.tsx ---
  const displayName = getDisplayName(profile);
  const displayPhotos = getDisplayPhotos(profile, profile.photos || []);
  const photos =displayPhotos.length > 0 ? displayPhotos: ['/placeholder-profile.png'];
  const displayBio = getDisplayBio(profile);
  const displayDetails = getDisplayDetails(profile);
  const isAnonymous = shouldDisplayAnonymously(profile);
  const age = displayDetails.age;
  const title = isAnonymous ? 'Student at NIT Kurukshetra' : `${displayDetails.year} • ${displayDetails.branch}`;

  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % (displayPhotos.length || 1));
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + (displayPhotos.length || 1)) % (displayPhotos.length || 1));

  // --- UI Tilt/Glow Effect Logic from ProfileCard.jsx ---
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const animationHandlers = useMemo(() => {
    let rafId: number | null = null;
    const updateCardTransform = (offsetX: number, offsetY: number, card: HTMLElement, wrap: HTMLElement) => {
      const { clientWidth: width, clientHeight: height } = card;
      const percentX = clamp((100 / width) * offsetX);
      const percentY = clamp((100 / height) * offsetY);
      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--rotate-x': `${round(-(centerX / 5))}deg`,
        '--rotate-y': `${round(centerY / 4)}deg`
      };
      Object.entries(properties).forEach(([p, v]) => wrap.style.setProperty(p, v.toString()));
    };

    const createSmoothAnimation = (duration: number, startX: number, startY: number, card: HTMLElement, wrap: HTMLElement) => {
      const startTime = performance.now();
      const targetX = wrap.clientWidth / 2;
      const targetY = wrap.clientHeight / 2;
      const animationLoop = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = clamp(elapsed / duration);
        const easedProgress = easeInOutCubic(progress);
        const currentX = adjust(easedProgress, 0, 1, startX, targetX);
        const currentY = adjust(easedProgress, 0, 1, startY, targetY);
        updateCardTransform(currentX, currentY, card, wrap);
        if (progress < 1) rafId = requestAnimationFrame(animationLoop);
      };
      rafId = requestAnimationFrame(animationLoop);
    };

    return { updateCardTransform, createSmoothAnimation, cancelAnimation: () => rafId && cancelAnimationFrame(rafId) };
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    const wrap = wrapRef.current;
    if (!card || !wrap || !animationHandlers) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      animationHandlers.updateCardTransform(e.clientX - rect.left, e.clientY - rect.top, card, wrap);
    };
    const handlePointerEnter = () => {
      animationHandlers.cancelAnimation();
      wrap.classList.add('active');
      card.classList.add('active');
    };
    const handlePointerLeave = (e: PointerEvent) => {
      animationHandlers.createSmoothAnimation(600, e.offsetX, e.offsetY, card, wrap);
      wrap.classList.remove('active');
      card.classList.remove('active');
    };

    card.addEventListener('pointerenter', handlePointerEnter);
    card.addEventListener('pointermove', handlePointerMove);
    card.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      card.removeEventListener('pointerenter', handlePointerEnter);
      card.removeEventListener('pointermove', handlePointerMove);
      card.removeEventListener('pointerleave', handlePointerLeave);
      animationHandlers.cancelAnimation();
    };
  }, [animationHandlers]);

  return (
    <div ref={wrapRef} className="pc-card-wrapper h-[600px] w-full max-w-sm mx-auto">
      <section ref={cardRef} className="pc-card" style={{ maxHeight: '600px', height: '100%' }}>
        <div className="pc-inside">
          <div className="pc-shine" />
          <div className="pc-glare" />

          {/* --- Content Layer: Merging your data with the new UI --- */}
          <div className="pc-content pc-avatar-content">
            <img
              className={`avatar ${isAnonymous ? 'blur-sm' : ''}`}
              src={photos[currentPhotoIndex]}
              alt={displayName}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          <div className="pc-content z-10 p-4 flex flex-col justify-between h-full text-white pointer-events-none">
            {/* Top Section: Badges and Photo Indicators */}
            <div className="flex justify-between items-start">
              {isAnonymous ? (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 pointer-events-auto">
                  <EyeOff className="h-3 w-3 mr-1" /> Anonymous
                </Badge>
              ) : <div />}
              <div className="pointer-events-auto">
                <CompatibilityScore score={profile.compatibility_score || 85} />
              </div>
            </div>
            {displayPhotos.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
                {displayPhotos.map((_, index) => (
                  <div key={index} className={`h-1 w-8 rounded-full ${index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            )}

            {/* Bottom Section: User Info and Action Buttons */}
            <div className="relative">
              {/* Invisible navigation areas for photos */}
              <div className="absolute inset-0 flex">
                  <div className="w-1/2 h-full cursor-pointer pointer-events-auto" onClick={prevPhoto} />
                  <div className="w-1/2 h-full cursor-pointer pointer-events-auto" onClick={nextPhoto} />
              </div>

              <div className="relative text-left z-10">
                <h3 className="text-3xl font-bold text-shadow-lg">{displayName}{age && !isAnonymous && `, ${age}`}</h3>
                <p className="text-md text-shadow">{title}</p>
              </div>

              {/* Action Buttons from your original ProfileCard.tsx */}
              <div className="absolute bottom-0 right-0 flex gap-2 z-20 pointer-events-auto">
                <Button size="sm" variant="outline" className="rounded-full w-12 h-12 bg-white/90 hover:bg-white border-2 border-gray-200" onClick={onPass}>
                  <X className="h-5 w-5 text-gray-600" />
                </Button>
                <Button size="sm" variant="outline" className="rounded-full w-12 h-12 bg-blue-500/90 hover:bg-blue-600 border-2 border-blue-400 text-white" onClick={onSuperLike}>
                  <Star className="h-5 w-5" />
                </Button>
                <Button size="sm" variant="outline" className="rounded-full w-12 h-12 bg-green-500/90 hover:bg-green-600 border-2 border-green-400 text-white" onClick={onLike}>
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Add a simple text-shadow utility class to your global CSS if you don't have one
// e.g., in `src/app/globals.css`:
// .text-shadow { text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.5); }
// .text-shadow-lg { text-shadow: 0px 4px 8px rgba(0, 0, 0, 0.6); }