import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Sparkles } from "lucide-react";
import { EnhancedProfileCard } from "./EnhancedProfileCard";
import { ActionButtonsWithLimits } from "./ActionButtonWithLimits";
import { useProfiles, DatabaseProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { useDailyLimits } from "@/hooks/useDailyLimits";
import { useToast } from "@/hooks/use-toast";
import { supabase, syncAppSession } from "@/integrations/supabase/client";import { encryptedStorage } from "@/utils/encryptedStorage";
import { GlowCard } from "@/components/ui/GlowCard";
import { DailyLimitAlert } from "./DailyLimitAlert";
import { getDisplayBio,getDisplayDetails,getDisplayName,getDisplayPhotos,shouldDisplayAnonymously } from "@/utils/incognitoUtils";

export function DiscoveryScreenIntegrated() {


  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | null>(null);

  // State for alert dialog
  const [showLimitAlert, setShowLimitAlert] = useState(false);
 

  
  // ⭐ NEW: Track if user has interacted to prevent popup on reload
  const hasUserInteracted = useRef(false);

  const { profiles, loading } = useProfiles();
  const { user } = useAuth();
  const { toast } = useToast();

  const currentUserData = encryptedStorage.get('current-user');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const userEmail = currentUser?.email || user?.email;

  const {
    dailyLikes,
    canLike,
    loading: limitsLoading,
    incrementLikes
  } = useDailyLimits(userEmail);

  // Ref to track previous state
  const prevCanLikeRef = useRef(canLike);

  // ⭐ UPDATED EFFECT: Only trigger if user has interacted
  useEffect(() => {
    // If we transition from Can Like -> Cannot Like AND user has been using the app
    if (hasUserInteracted.current && prevCanLikeRef.current === true && canLike === false) {
       setShowLimitAlert(true);
    }
    prevCanLikeRef.current = canLike;
  }, [canLike]);


  const handleSwipe = async (direction: 'like' | 'pass') => {
    if (direction === 'like' && !canLike) {
      setShowLimitAlert(true);
      return;
    }
   
    setSwipeAnimation(direction === 'like' ? 'right' : 'left');

    const targetProfile = profiles[currentIndex];
    const stored = encryptedStorage.get("current-user");
    if (!targetProfile || !stored) return;

    const { email } = JSON.parse(stored);
  
    try {
      // ✅ CALL THE SECURE RPC INSTEAD OF .upsert()
      const { error: swipeError } = await supabase.rpc('record_swipe', {
        p_user_id: email,
        p_target_user_id: targetProfile.email,
        p_action: direction
      });
      
      if (swipeError) throw swipeError;

      if (direction === 'like') {
        await incrementLikes();
      }
    } catch (err) {
      console.error("Swipe recording failed:", err);
    } finally {
      // Always move to next profile
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSwipeAnimation(null);
      }, 300);
    }
  };

  const transformProfileForCard = (profile: DatabaseProfile) => {

           const displayDetails = getDisplayDetails(profile);
            const displayName = getDisplayName(profile);
            const displayBio = getDisplayBio(profile);
            const displayPhotos = getDisplayPhotos(profile, profile.photos?.map(p => p.url) || []);


    return {
      id: profile.email,
      user_id: profile.email,
      full_name: displayName,
      age: calculateAge(profile.date_of_birth),
      bio: displayBio || 'No bio available',
      year: parseInt(profile.year_of_study || '1'),
      branch: displayDetails.branch  || 'Not specified',
      hometown: displayDetails.hometown|| 'Not specified',
        college:profile.college,
      interests: profile.interests || [],
    
      // Inside transformProfileForCard, replace the photos mapping logic:
photos: (displayPhotos || []).map((url: string, index: number) => {
  // ✅ Ensure we apply transformation if it wasn't already applied by utils
  const optimizedUrl = url.includes('?width=') 
    ? url 
    : url ;

  return {
    url: optimizedUrl,
    order: index,
  };
}),
      height: displayDetails.height || 'Not specified',
      looking_for: profile.interested_in || 'Anyone',
      verified: profile.is_verified || false,
      lives_in: profile.hometown || '',
      distance_from_you: 'Nearby'
    };
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading || limitsLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-pink-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold gradient-text-animated">Finding amazing people...</h3>
            <p className="text-gray-400">Preparing your perfect matches</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-8 animate-fade-in">
          <Heart className="h-20 w-20 text-pink-500 mx-auto animate-heartbeat" />
          <div className="space-y-4">
            <h2 className="text-3xl font-bold gradient-text">Please log in</h2>
            <p className="text-gray-400 text-lg">Create your profile to start discovering amazing people!</p>
          </div>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            <Heart className="h-20 w-20 text-gray-600 mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-pink-500/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">We’re a new app</h2>
            <p className="text-gray-400 text-lg">New users are joining soon .</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-black">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            <Sparkles className="h-20 w-20 text-pink-500 mx-auto animate-heartbeat" />
            <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-pulse-glow"></div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold gradient-text">We’re a new app</h2>
            <p className="text-gray-400 text-lg">New users are joining soon .</p>
          </div>
        </div>
      </div>   
    );  
  }

  const currentProfile = transformProfileForCard(profiles[currentIndex]); 

  return (
    <div className="h-full bg-black text-white">
      
      {/* Alert Dialog */}
      <DailyLimitAlert 
        isOpen={showLimitAlert} 
        onClose={() => setShowLimitAlert(false)} 
      />

      <div className="p-0 m-0 w-full">
       <div className="relative w-[90%] max-w-[420px]  h-[78dvh] mx-auto mt-[4%]  profile-stack overflow-visible">

          {/* Background Card */}
          {profiles[currentIndex + 2] && (
            <div className="absolute inset-0 -z-20 scale-90 opacity-20 rotate-1 transform">
              <Card className="h-full w-full glass-light rounded-3xl border-white/10" />
            </div>
          )}
          
          {/* Next Profile Preview */}
          {profiles[currentIndex + 1] && (
            <div className="absolute inset-0 -z-10 scale-95 opacity-60 transform -rotate-1">
              <EnhancedProfileCard
                profile={transformProfileForCard(profiles[currentIndex + 1])}
                onLike={() => {handleSwipe('like')}}
                onPass={() => {handleSwipe('pass')}}
                key={profiles[currentIndex+1].email}
              />
            </div>
          )}

          {/* Current Active Profile with GlowCard */}
          <div className={`relative w-full h-full transition-all duration-300 ${
            swipeAnimation === 'left' ? 'swipe-left' :
            swipeAnimation === 'right' ? 'swipe-right' :
            ''
          }`}>
            {/* Swipe Indicators */}
            <div className={`absolute inset-0 rounded-3xl border-4 transition-all duration-200 z-10 pointer-events-none ${
              swipeAnimation === 'right' ? 'border-green-500 bg-green-500/20 animate-pulse-glow' :
              swipeAnimation === 'left' ? 'border-red-500 bg-red-500/20 animate-pulse-glow' :
              'border-transparent'
            }`}>
              {swipeAnimation === 'right' && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-3 rounded-full font-bold text-xl rotate-12 shadow-lg animate-bounce">
                    LIKE 💖
                  </div>
                </div>
              )}
              {swipeAnimation === 'left' && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-gradient-to-r from-red-400 to-red-600 text-white px-6 py-3 rounded-full font-bold text-xl -rotate-12 shadow-lg animate-bounce">
                    NOPE ❌
                  </div>
                </div>
              )}
            </div>

           
              <EnhancedProfileCard
                profile={currentProfile}
                onLike={() => handleSwipe('like')}
                onPass={() => handleSwipe('pass')}
                key={currentProfile.id}
              />
          
          </div>
        </div>
      </div>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}