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

  const handleSwipe = async (action: 'like' | 'pass' | 'superlike') => {
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    
    // Set animation
    setSwipeAnimation(action === 'like' ? 'right' : action === 'pass' ? 'left' : 'up');
    
    try {
      const success = await handleInteraction(profile.user_id, action);
      
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
    return {
      id: profile.id,
      user_id: profile.user_id,
      full_name: `${profile.first_name} ${profile.last_name}`,
      age: calculateAge(profile.date_of_birth),
      bio: profile.bio || '',
      year: parseInt(profile.year_of_study || '1'),
      branch: profile.branch || '',
      hometown: profile.hometown || '',
      interests: profile.interests || [],
      photos: profile.photos?.map(p => ({ url: p.url, order: p.order })) || [],
      height: profile.height ? `${Math.floor(profile.height / 12)}'${profile.height % 12}"` : '',
      looking_for: profile.interested_in || '',
      elo_rating: 1000,
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
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-primary/5">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Finding amazing people for you...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-background to-primary/5">
        <div className="h-32 w-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-16 w-16 text-primary/60" />
        </div>
        <h2 className="text-3xl font-bold mb-4 gradient-text">No profiles available 😢</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          Create your profile to start discovering amazing people!
        </p>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-background to-primary/5">
        <div className="h-32 w-32 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mb-8 animate-pulse">
          <Heart className="h-16 w-16 text-primary-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-4 gradient-text">You're all caught up! 🎉</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          Check back later for new people to connect with.
        </p>
      </div>
    );
  }

  const currentProfile = transformProfileForCard(profiles[currentIndex]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Discover
              </h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {profiles.length - currentIndex} left
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="flex-1 p-4 relative overflow-hidden">
        <div className={`h-full transition-all duration-300 ${
          swipeAnimation === 'left' ? 'transform -translate-x-full rotate-12 opacity-0' :
          swipeAnimation === 'right' ? 'transform translate-x-full rotate-12 opacity-0' :
          swipeAnimation === 'up' ? 'transform -translate-y-full scale-110 opacity-0' : ''
        }`}>
          <ProfileCard
            profile={currentProfile}
            onLike={() => handleSwipe('like')}
            onPass={() => handleSwipe('pass')}
            onSuperLike={() => handleSwipe('superlike')}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-sm">
        <ActionButtons
          onPass={() => handleSwipe('pass')}
          onSuperLike={() => handleSwipe('superlike')}
          onLike={() => handleSwipe('like')}
          onBoost={() => {}}
          onRewind={() => {}}
          superLikesRemaining={5}
          likesRemaining={100}
        />
      </div>
    </div>
  );
}