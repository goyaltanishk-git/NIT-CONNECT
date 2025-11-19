import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Settings2, TrendingUp, Zap, Filter, RotateCcw, Sparkles, MapPin, Clock, Shield, Users, Star } from "lucide-react";
import { EnhancedProfileCard } from "./EnhancedProfileCard";
import { ActionButtonsWithLimits } from "./ActionButtonWithLimits";
import { useProfiles, DatabaseProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { useDailyLimits } from "@/hooks/useDailyLimits";
import { useToast } from "@/hooks/use-toast";
import { DisabledStoriesCarousel } from "../stories/DisabledStories";
import { supabase } from "@/integrations/supabase/client";

export function DiscoveryScreenIntegrated() {
  console.log("✅ SUCCESS: DiscoveryScreenIntegrated is running!");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | null>(null);
  const { profiles, loading } = useProfiles();
  const { user } = useAuth();
  const { toast } = useToast();

  // Get current user email for daily limits
  const currentUserData = localStorage.getItem('current-user');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const userEmail = currentUser?.email || user?.email;

  console.log("📧 Passing this email to useDailyLimits:", userEmail);

  // Use daily limits hook
  const {
    dailyLikes,
    canLike,
    loading: limitsLoading,
    incrementLikes
  } = useDailyLimits(userEmail);

  // Add debugging
  useEffect(() => {
    console.log("DiscoveryScreenIntegrated state:", {
      profiles: profiles.length,
      loading,
      user: user?.email,
      currentUser: currentUser?.email,
      dailyLikes,
      canLike
    });
  }, [profiles, loading, user, dailyLikes, canLike]);

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    
    // 🆕 Check daily limits and show popup if out of likes
    if (action === 'like' && !canLike) {
      toast({
        title: "Daily Limit Reached 🚫",
        description: "You have ran out of likes for today. Please come back tomorrow!",
        variant: "destructive",
      });
      return;
    }

    // Set animation
    setSwipeAnimation(action === 'like' ? 'right' : 'left');

    try {
      // Increment daily limits for likes
      if (action === 'like') {
        const success = await incrementLikes();
        if (!success) {
          setSwipeAnimation(null);
          return;
        }
      }

      // Record interaction in database
      if (userEmail) {
        const { error } = await supabase.from('user_interactions').insert({
          user_id: userEmail,
          target_user_id: profile.email,
          interaction_type: action
        });

        if (error) {
          console.error("Error recording interaction:", error);
        } else {
          console.log("Interaction recorded successfully");
        }
      }
      
      // Move to next profile after animation
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSwipeAnimation(null);
      }, 300);

      // Show feedback with enhanced styling
      if (action === 'like') {
        toast({
          title: "Like sent! 💖",
          description: `You liked ${profile.first_name}. Hope they like you back!`,
        });
      }
    } catch (error) {
      console.error("Error handling swipe:", error);
      setSwipeAnimation(null);
    }
  };

  const transformProfileForCard = (profile: DatabaseProfile) => {
    console.log("🔄 Transforming profile:", profile.first_name, profile.email);
    
    return {
      id: profile.email, // Use email as ID since it's now primary key
      user_id: profile.email, // For compatibility with ProfileCard
      full_name: `${profile.first_name} ${profile.last_name}`,
      age: calculateAge(profile.date_of_birth),
      bio: profile.bio || 'No bio available',
      year: parseInt(profile.year_of_study || '1'),
      branch: profile.branch || 'Not specified',
      hometown: profile.hometown || 'Not specified',
      interests: profile.interests || [],
      photos: profile.photos?.map(p => ({ url: p.url, order: p.order })) || [
        // Fallback photo if none available
        { url: '/placeholder-profile.jpg', order: 1 }
      ],
      height: profile.height ? `${Math.floor(profile.height / 12)}'${profile.height % 12}"` : 'Not specified',
      looking_for: profile.interested_in || 'Anyone',
      elo_rating: 1000, // Default rating
      last_active: "Active now",
      verified: profile.is_verified || false
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-pink-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold gradient-text-animated">
              Finding amazing people for you...
            </h3>
            <p className="text-gray-400">Preparing your perfect matches</p>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Show what we have
  console.log("📊 Final render state:", {
    profilesCount: profiles.length,
    currentIndex,
    currentProfile: profiles[currentIndex]?.first_name,
    dailyLikes,
    canLike
  });

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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            <Heart className="h-20 w-20 text-gray-600 mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-pink-500/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">No profiles available</h2>
            <p className="text-gray-400 text-lg">
              Check back later for new people to connect with.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            <Sparkles className="h-20 w-20 text-pink-500 mx-auto animate-heartbeat" />
            <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-pulse-glow"></div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold gradient-text">No more profiles available</h2>
            <p className="text-gray-400 text-lg">
              Check back later for new people to connect with.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentProfile = transformProfileForCard(profiles[currentIndex]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-6">
        {/* Enhanced Profile Stack with Better UI */}
        <div className="relative max-w-sm mx-auto profile-stack">
          {/* Profile Stack Background Cards */}
          {profiles[currentIndex + 2] && (
            <div className="absolute inset-0 -z-20 scale-90 opacity-20 rotate-1 transform">
              <Card className="h-full aspect-[3/4] glass-light rounded-3xl border-white/10" />
            </div>
          )}
          
          {/* Next profile preview */}
          {profiles[currentIndex + 1] && (
            <div className="absolute inset-0 -z-10 scale-95 opacity-60 transform -rotate-1">
              <EnhancedProfileCard
                profile={transformProfileForCard(profiles[currentIndex + 1])}
                onLike={() => {handleSwipe('like')}}
                onPass={() => {handleSwipe('pass')}}
                onSuperLike={() => {}}
              />
            </div>
          )}

          {/* Current Profile with Enhanced Animations */}
          <div className={`relative transition-all duration-300 ${
            swipeAnimation === 'left' ? 'swipe-left' :
            swipeAnimation === 'right' ? 'swipe-right' :
            ''
          }`}>
            {/* Swipe Indicators with Enhanced Styling */}
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
              onSuperLike={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}