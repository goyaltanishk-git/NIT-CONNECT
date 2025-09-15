import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Star, Settings2, TrendingUp, Zap, Filter, RotateCcw, Sparkles, MapPin, Clock, Shield, Users } from "lucide-react";
import { EnhancedProfileCard } from "./EnhancedProfileCard";
import { ActionButtons } from "./ActionButtons";
import { useProfiles, DatabaseProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DisabledStoriesCarousel } from "../stories/DisabledStories";

export function DiscoveryScreenIntegrated() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | 'up' | null>(null);
  const { profiles, loading, handleInteraction } = useProfiles();
  const { user } = useAuth();
  const { toast } = useToast();

  // Add debugging
  useEffect(() => {
    console.log("🔍 DiscoveryScreenIntegrated - Profiles:", profiles.length);
    console.log("📊 Loading state:", loading);
    console.log("👤 User:", user?.email);
  }, [profiles, loading, user]);

  const handleSwipe = async (action: 'like' | 'pass' | 'superlike') => {
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    console.log(`💫 Handling ${action} for profile:`, profile.email);

    // Set animation
    setSwipeAnimation(action === 'like' ? 'right' : action === 'pass' ? 'left' : 'up');

    try {
      // Pass email instead of user_id
      const success = await handleInteraction(profile.email, action);
      
      if (success) {
        // Move to next profile after animation
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setSwipeAnimation(null);
        }, 300);

        // Show feedback
        if (action === 'like') {
          toast({
            title: "Like sent! 💚",
            description: `You liked ${profile.first_name}. Hope they like you back!`,
          });
        } else if (action === 'superlike') {
          toast({
            title: "Super Like sent! ⭐",
            description: `${profile.first_name} will see you super liked them!`,
          });
        }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Finding amazing people for you...</p>
        </div>
      </div>
    );
  }

  // Debug: Show what we have
  console.log("📊 Final render state:", {
    profilesCount: profiles.length,
    currentIndex,
    currentProfile: profiles[currentIndex]?.first_name
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="text-center space-y-4">
          <Heart className="h-16 w-16 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800">Please log in</h2>
          <p className="text-muted-foreground">Create your profile to start discovering amazing people!</p>
          <div className="bg-yellow-100 p-4 rounded-lg mt-4">
            <p className="text-sm text-gray-600">
              <strong>Debug Info:</strong><br/>
              User: {user ? user.email : 'undefined'}<br/>
              Loading: {loading ? 'true' : 'false'}<br/>
              Profiles: {profiles.length}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="text-center space-y-4">
          <Heart className="h-16 w-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800">No profiles available</h2>
          <p className="text-muted-foreground">
            No profiles found in the database. Add some profiles to Supabase or check your filters.
          </p>
          <div className="bg-blue-100 p-4 rounded-lg mt-4">
            <p className="text-sm text-gray-600">
              <strong>Debug Info:</strong><br/>
              Current User: {user.email}<br/>
              Profiles in DB: Check console logs<br/>
              Loading: {loading ? 'true' : 'false'}
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="text-center space-y-4">
          <Sparkles className="h-16 w-16 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800">You're all caught up! 🎉</h2>
          <p className="text-muted-foreground">
            Check back later for new people to connect with.
          </p>
          <Button 
            onClick={() => {
              setCurrentIndex(0);
              window.location.reload();
            }}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  const currentProfile = transformProfileForCard(profiles[currentIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Enhanced Header with Stats */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Discover</h1>
                <p className="text-xs text-muted-foreground">
                  {profiles.length - currentIndex} profiles remaining
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-2">
            <Card className="flex-1 p-2">
              <CardContent className="p-0 flex items-center gap-2">
                <div className="p-1 rounded bg-green-100 dark:bg-green-900">
                  <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">{profiles.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="flex-1 p-2">
              <CardContent className="p-0 flex items-center gap-2">
                <div className="p-1 rounded bg-blue-100 dark:bg-blue-900">
                  <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium">Nearby</p>
                  <p className="text-xs text-muted-foreground">5km</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="flex-1 p-2">
              <CardContent className="p-0 flex items-center gap-2">
                <div className="p-1 rounded bg-orange-100 dark:bg-orange-900">
                  <Clock className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-medium">Online</p>
                  <p className="text-xs text-muted-foreground">Now</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Stories Section - Disabled for now */}
      <DisabledStoriesCarousel />
      
      <div className="p-4">

        {/* Enhanced Profile Stack with Better UI */}
        <div className="relative max-w-sm mx-auto">
          {/* Profile Stack Background Cards */}
          {profiles[currentIndex + 2] && (
            <div className="absolute inset-0 -z-20 scale-90 opacity-20 rotate-1 transform">
              <Card className="h-full aspect-[3/4] bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl" />
            </div>
          )}
          
          {/* Next profile preview */}
          {profiles[currentIndex + 1] && (
            <div className="absolute inset-0 -z-10 scale-95 opacity-60 transform -rotate-1">
            <EnhancedProfileCard
              profile={transformProfileForCard(profiles[currentIndex + 1])}
              onLike={() => {}}
              onPass={() => {}}
              onSuperLike={() => {}}
            />
            </div>
          )}

          {/* Current Profile with Enhanced Animations */}
          <div className={`relative transition-all duration-300 ${
            swipeAnimation === 'left' ? 'transform -translate-x-full -rotate-12 opacity-0' :
            swipeAnimation === 'right' ? 'transform translate-x-full rotate-12 opacity-0' :
            swipeAnimation === 'up' ? 'transform -translate-y-full scale-125 opacity-0' :
            ''
          }`}>
            {/* Swipe Indicators */}
            <div className={`absolute inset-0 rounded-2xl border-4 transition-all duration-200 z-10 pointer-events-none ${
              swipeAnimation === 'right' ? 'border-green-500 bg-green-500/20' :
              swipeAnimation === 'left' ? 'border-red-500 bg-red-500/20' :
              swipeAnimation === 'up' ? 'border-blue-500 bg-blue-500/20' :
              'border-transparent'
            }`}>
              {swipeAnimation === 'right' && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg rotate-12">
                    LIKE ❤️
                  </div>
                </div>
              )}
              {swipeAnimation === 'left' && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg -rotate-12">
                    NOPE ❌
                  </div>
                </div>
              )}
              {swipeAnimation === 'up' && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                    SUPER LIKE ⭐
                  </div>
                </div>
              )}
            </div>

            <EnhancedProfileCard
              profile={currentProfile}
              onLike={() => handleSwipe('like')}
              onPass={() => handleSwipe('pass')}
              onSuperLike={() => handleSwipe('superlike')}
            />
          </div>

          {/* Profile Progress Indicator */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1">
              {Array.from({ length: Math.min(profiles.length, 5) }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-200 ${
                    i <= currentIndex ? 'bg-primary w-8' : 'bg-muted w-2'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="mt-10 px-4">
          <ActionButtons
            onPass={() => handleSwipe('pass')}
            onSuperLike={() => handleSwipe('superlike')}
            onLike={() => handleSwipe('like')}
            disabled={loading || swipeAnimation !== null}
            likesRemaining={100}
            superLikesRemaining={5}
          />
        </div>

        {/* Bottom Tips */}
        <div className="mt-6 px-4">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Dating Tip</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Swipe right to like, left to pass, or up for super like! 
                Be genuine and respectful in your interactions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}