import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Star, Settings2, TrendingUp, Zap, Filter, RotateCcw, Sparkles } from "lucide-react";
import { ProfileCard } from "./ProfileCard";
import { ActionButtons } from "./ActionButtons";
import { useProfiles, DatabaseProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-4">
      {/* Debug Header */}
      <div className="bg-green-100 p-2 rounded mb-4 text-sm">
        <strong>Debug:</strong> User: {user.email} | Profiles: {profiles.length} | Current: {currentIndex + 1}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Discover</h1>
          <p className="text-sm text-muted-foreground">
            {profiles.length - currentIndex} profiles remaining
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Profile {currentIndex + 1} of {profiles.length}
          </Badge>
        </div>
      </div>

      {/* Profile Stack */}
      <div className="relative max-w-sm mx-auto">
        {/* Current Profile */}
        <div className={`transition-all duration-300 ${
          swipeAnimation === 'left' ? 'transform -translate-x-full opacity-0' :
          swipeAnimation === 'right' ? 'transform translate-x-full opacity-0' :
          swipeAnimation === 'up' ? 'transform -translate-y-full opacity-0' :
          ''
        }`}>
          <ProfileCard
            profile={currentProfile}
            onLike={() => handleSwipe('like')}
            onPass={() => handleSwipe('pass')}
            onSuperLike={() => handleSwipe('superlike')}
          />
        </div>

        {/* Next profile preview */}
        {profiles[currentIndex + 1] && (
          <div className="absolute inset-0 -z-10 scale-95 opacity-50">
            <ProfileCard
              profile={transformProfileForCard(profiles[currentIndex + 1])}
              onLike={() => {}}
              onPass={() => {}}
              onSuperLike={() => {}}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6">
        <ActionButtons
          onPass={() => handleSwipe('pass')}
          onSuperLike={() => handleSwipe('superlike')}
          onLike={() => handleSwipe('like')}
          disabled={loading || swipeAnimation !== null}
          likesRemaining={100} // You can implement daily limits later
          superLikesRemaining={5}
        />
      </div>
    </div>
  );
}