console.log("Imported SAMPLE_PROFILES:", SAMPLE_PROFILES);
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Star, Settings2, TrendingUp, Zap, Filter, RotateCcw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileCard } from "./ProfileCard";
import { ActionButtons } from "./ActionButtons";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DiscoveryScreenIntegrated } from "./DiscoveryScreenIntegrated";
import { SAMPLE_PROFILES, Profile } from "@/data/sampleProfiles";
import { useEloRating } from "@/hooks/useEloRating";
import { filterProfile } from "@/utils/contentFilter";

export function DiscoveryScreen() {
  const { user, loading: authLoading } = useAuth();
  
  // If user is authenticated, use backend integration
  if (user && !authLoading) {
    return <DiscoveryScreenIntegrated />;
  }
  
  // Fallback to demo mode with sample profiles
  return <DiscoveryScreenDemo />;
}

function DiscoveryScreenDemo() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeCount, setSwipeCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | 'up' | null>(null);
  const [userEloRating, setUserEloRating] = useState(1000);
  const [dailyLikes, setDailyLikes] = useState(0);
  const [dailySuperLikes, setDailySuperLikes] = useState(0);
  const [passedProfiles, setPassedProfiles] = useState<string[]>([]);
  const { toast } = useToast();
  const { updateRating, getUserRating, getRatingTier } = useEloRating();

  // ✅ initialize user data first
  useEffect(() => {
    initializeUserData();
  }, []);

  // ✅ once userEloRating is ready, load profiles
  useEffect(() => {
    if (userEloRating) {
      loadProfiles();
    }
  }, [userEloRating]);

  const initializeUserData = async () => {
    try {
      // In demo mode, use localStorage
      const tempUser = localStorage.getItem('temp-user');
      if (tempUser) {
        const userData = JSON.parse(tempUser);
        setUserEloRating(userData.eloRating || 1000);
        setDailyLikes(userData.dailyLikes || 0);
        setDailySuperLikes(userData.dailySuperLikes || 0);
        setPassedProfiles(userData.passedProfiles || []);
      } else {
        // In real mode, fetch from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const rating = await getUserRating(user.id);
          setUserEloRating(rating?.rating || 1000);
          
          // Get daily limits
          const today = new Date().toISOString().split('T')[0];
          const { data: limits } = await supabase
            .from('daily_limits')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();
            
          setDailyLikes(limits?.likes_used || 0);
          setDailySuperLikes(limits?.superlikes_used || 0);
        }
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      // Filter inappropriate content and sort by ELO rating for better matches
      const filteredProfiles = SAMPLE_PROFILES
        .filter(profile => {
          const contentCheck = filterProfile(profile);
          console.log("Checking profile:", profile.full_name, contentCheck);
          return (contentCheck.isAppropriate || contentCheck.severity === 'low') && 
                 !passedProfiles.includes(profile.user_id);
        })
        .sort((a, b) => {
          // Sort by ELO rating similarity to user for better matches
          const userRating = userEloRating || 1000;
          const diffA = Math.abs((a.elo_rating || 1000) - userRating);
          const diffB = Math.abs((b.elo_rating || 1000) - userRating);
          return diffA - diffB;
        });

      // Fallback to all sample profiles if filtering removed everything
      const result = filteredProfiles.length > 0 ? filteredProfiles : SAMPLE_PROFILES.filter(p => !passedProfiles.includes(p.user_id));
      console.log("✅ Loaded profiles:", result);   // 👈 check what's inside
      setProfiles(result);
      setCurrentIndex(0);
      setLoading(false);
    } catch (error) {
      console.error("Error loading profiles:", error);
      setLoading(false);
    }
  };

  const handleRewind = useCallback(() => {
    if (passedProfiles.length > 0) {
      const lastPassedId = passedProfiles[passedProfiles.length - 1];
      const lastPassedProfile = SAMPLE_PROFILES.find(p => p.user_id === lastPassedId);
      
      if (lastPassedProfile) {
        setPassedProfiles(prev => prev.slice(0, -1));
        setProfiles(prev => [lastPassedProfile, ...prev]);
        setCurrentIndex(0);
        
        // Update localStorage
        const tempUser = localStorage.getItem('temp-user');
        if (tempUser) {
          const userData = JSON.parse(tempUser);
          userData.passedProfiles = passedProfiles.slice(0, -1);
          localStorage.setItem('temp-user', JSON.stringify(userData));
        }
        
        toast({
          title: "Profile restored! ↩️",
          description: `${lastPassedProfile.full_name} is back in your stack.`,
        });
      }
    } else {
      toast({
        title: "No profiles to rewind",
        description: "You haven't passed any profiles yet.",
      });
    }
  }, [passedProfiles, toast]);

  const handleBoost = useCallback(() => {
    toast({
      title: "Boost activated! 🚀",
      description: "Your profile will be shown to more people for the next 30 minutes.",
    });
  }, [toast]);

  const handleSwipe = useCallback(async (action: 'like' | 'pass' | 'superlike') => {
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    
    // Check daily limits
    if (action === 'like' && dailyLikes >= 100) {
      toast({
        title: "Daily like limit reached",
        description: "You've used all your likes today. Try again tomorrow.",
      });
      return;
    }
    
    if (action === 'superlike' && dailySuperLikes >= 5) {
      toast({
        title: "Daily super like limit reached",
        description: "You've used all your super likes today. Try again tomorrow.",
      });
      return;
    }

    // Set animation
    setSwipeAnimation(action === 'like' ? 'right' : action === 'pass' ? 'left' : 'up');
    
    // Update counts
    setSwipeCount(prev => prev + 1);
    if (action === 'like') setDailyLikes(prev => prev + 1);
    if (action === 'superlike') setDailySuperLikes(prev => prev + 1);
    if (action === 'pass') setPassedProfiles(prev => [...prev, profile.user_id]);
    
    try {
      const tempUser = localStorage.getItem('temp-user');
      let isMatch = false;
      
      if (tempUser) {
        // Simulate match probability based on ELO ratings
        const userRating = userEloRating || 1000;
        const profileRating = profile.elo_rating || 1000;
        const ratingDiff = Math.abs(userRating - profileRating);
        
        // Higher chance of match with similar ELO ratings
        let matchChance = action === 'superlike' ? 0.6 : 0.25;
        if (ratingDiff < 100) matchChance += 0.2;
        if (ratingDiff < 50) matchChance += 0.1;
        
        isMatch = action !== 'pass' && Math.random() < matchChance;
        
        // Update local storage with new stats
        const userData = JSON.parse(tempUser);
        userData.dailyLikes = dailyLikes + (action === 'like' ? 1 : 0);
        userData.dailySuperLikes = dailySuperLikes + (action === 'superlike' ? 1 : 0);
        userData.passedProfiles = action === 'pass' ? [...passedProfiles, profile.user_id] : passedProfiles;
        localStorage.setItem('temp-user', JSON.stringify(userData));
        
        if (isMatch) {
          setTimeout(() => {
            toast({
              title: "It's a Match! 🎉",
              description: `You and ${profile.full_name} liked each other!`,
            });
          }, 300);
        } else if (action === 'superlike') {
          setTimeout(() => {
            toast({
              title: "Super Like sent! ⭐",
              description: `${profile.full_name} will see you super liked them!`,
            });
          }, 300);
        } else if (action === 'like') {
          setTimeout(() => {
            toast({
              title: "Like sent! 💚",
              description: `You liked ${profile.full_name}. Hope they like you back!`,
            });
          }, 300);
        }
      } else {
        // Real database operations
         const userd  = localStorage.getItem('current-user');
         const user = JSON.parse(userd);

        
        if (user) {
          // Record interaction
          await supabase.from('user_interactions').insert({
            user_id: user.email,
            target_user_id: profile.user_id,
            interaction_type: action
          });
          console.log("liked");
          
          // Update ELO ratings
          await updateRating(user.id, profile.user_id, action, isMatch);
          
          // Update daily limits
          const today = new Date().toISOString().split('T')[0];
          const { data: limits } = await supabase
            .from('daily_limits')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();
            
          if (limits) {
            await supabase
              .from('daily_limits')
              .update({
                likes_used: action === 'like' ? limits.likes_used + 1 : limits.likes_used,
                superlikes_used: action === 'superlike' ? limits.superlikes_used + 1 : limits.superlikes_used
              })
              .eq('id', limits.id);
          } else {
            await supabase
              .from('daily_limits')
              .insert({
                user_id: user.id,
                date: today,
                likes_used: action === 'like' ? 1 : 0,
                superlikes_used: action === 'superlike' ? 1 : 0
              });
          }
        }
      }

      // Move to next profile after animation
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSwipeAnimation(null);
      }, 300);
      
    } catch (error) {
      console.error("Error recording interaction:", error);
      setSwipeAnimation(null);
    }
  }, [currentIndex, profiles, dailyLikes, dailySuperLikes, userEloRating, passedProfiles, toast, updateRating]);

  // ✅ clear UI states
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
          Try adjusting your filters or check back later for new people to connect with.
        </p>
        <div className="flex gap-4">
          <Button onClick={loadProfiles} className="bg-gradient-to-r from-primary to-primary/80">
            <Sparkles className="h-4 w-4 mr-2" />
            Reload Profiles
          </Button>
          {passedProfiles.length > 0 && (
            <Button variant="outline" onClick={handleRewind}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Rewind Last
            </Button>
          )}
        </div>
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
          You've seen {swipeCount} profiles today.<br/>
          Check back later for new people to connect with.
        </p>
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              setCurrentIndex(0);
              setSwipeCount(0);
              loadProfiles();
            }}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Show me more profiles
          </Button>
          {passedProfiles.length > 0 && (
            <Button variant="outline" onClick={handleRewind}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Rewind Last
            </Button>
          )}
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Enhanced Header
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
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-green-500/10 to-green-600/5 border-green-500/20">
                  <Heart className="h-3 w-3 mr-1 text-green-600" />
                  {100 - dailyLikes} likes
                </Badge>
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border-yellow-500/20">
                  <Star className="h-3 w-3 mr-1 text-yellow-600" />
                  {5 - dailySuperLikes} ⭐
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="font-medium">{getRatingTier(userEloRating).tier}</span>
              <span className="text-muted-foreground">({userEloRating})</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="hover:bg-primary/10"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div> */}

      {/* Profile Card with Enhanced Animation */}
      <div className="flex p-4 relative overflow-hidden">
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
        
        {/* Next profile preview with enhanced styling */}
        {profiles[currentIndex + 1] && (
          <div className="absolute inset-0 p-4 z-[-1] opacity-30 scale-95 transform rotate-1">
            <ProfileCard
              profile={profiles[currentIndex + 1]}
              onLike={() => {}}
              onPass={() => {}}
              onSuperLike={() => {}}
            />
          </div>
        )}

        {/* Third profile preview */}
        {profiles[currentIndex + 2] && (
          <div className="absolute inset-0 p-4 z-[-2] opacity-15 scale-90 transform -rotate-1">
            <ProfileCard
              profile={profiles[currentIndex + 2]}
              onLike={() => {}}
              onPass={() => {}}
              onSuperLike={() => {}}
            />
          </div>
        )}
      </div>

      {/* Enhanced Action Buttons */}
      <div className="bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-sm">
        <ActionButtons
          onPass={() => handleSwipe('pass')}
          onSuperLike={() => handleSwipe('superlike')}
          onLike={() => handleSwipe('like')}
          onRewind={passedProfiles.length > 0 ? handleRewind : undefined}
          onBoost={handleBoost}
          disabled={loading || swipeAnimation !== null}
          likesRemaining={100 - dailyLikes}
          superLikesRemaining={5 - dailySuperLikes}
        />
      </div>
    </div>
  );
}
//vvrrbruhrhrufhrufhruhfurhruhfrufhrhffhurfvfvf
//bvrr
//frfhurf