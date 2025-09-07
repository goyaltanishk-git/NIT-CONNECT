import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Star, Settings2, TrendingUp, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileCard } from "./ProfileCard";
import { ActionButtons } from "./ActionButtons";
import { useToast } from "@/hooks/use-toast";
import { useEloRating } from "@/hooks/useEloRating";
import { SAMPLE_PROFILES, Profile } from "@/data/sampleProfiles";
import { filterProfile } from "@/utils/contentFilter";

export function DiscoveryScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeCount, setSwipeCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | 'up' | null>(null);
  const [userEloRating, setUserEloRating] = useState(1000);
  const [dailyLikes, setDailyLikes] = useState(0);
  const [dailySuperLikes, setDailySuperLikes] = useState(0);
  const { toast } = useToast();
  const { updateRating, getUserRating, getRatingTier } = useEloRating();

  useEffect(() => {
    loadProfiles();
    initializeUserData();
  }, []);

  const initializeUserData = async () => {
    try {
      // In demo mode, use localStorage
      const tempUser = localStorage.getItem('temp-user');
      if (tempUser) {
        const userData = JSON.parse(tempUser);
        setUserEloRating(userData.eloRating || 1000);
        setDailyLikes(userData.dailyLikes || 0);
        setDailySuperLikes(userData.dailySuperLikes || 0);
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
          return contentCheck.isAppropriate || contentCheck.severity === 'low';
        })
        .sort((a, b) => {
          // Sort by ELO rating similarity to user for better matches
          const userRating = userEloRating || 1000;
          const diffA = Math.abs((a.elo_rating || 1000) - userRating);
          const diffB = Math.abs((b.elo_rating || 1000) - userRating);
          return diffA - diffB;
        });
      
      setProfiles(filteredProfiles);
      setLoading(false);
    } catch (error) {
      console.error("Error loading profiles:", error);
      setLoading(false);
    }
  };

  const handleSwipe = useCallback(async (action: 'like' | 'pass' | 'superlike') => {
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    
    // Check daily limits
    if (action === 'like' && dailyLikes >= 100) {
      toast({
        title: "Daily limit reached! 💎",
        description: "You've used all your likes today. Get Premium for unlimited likes!",
      });
      return;
    }
    
    if (action === 'superlike' && dailySuperLikes >= 5) {
      toast({
        title: "Daily limit reached! ⭐",
        description: "You've used all your super likes today. Premium gets you more!",
      });
      return;
    }

    // Set animation
    setSwipeAnimation(action === 'like' ? 'right' : action === 'pass' ? 'left' : 'up');
    
    // Update counts
    setSwipeCount(prev => prev + 1);
    if (action === 'like') setDailyLikes(prev => prev + 1);
    if (action === 'superlike') setDailySuperLikes(prev => prev + 1);
    
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
        }
      } else {
        // Real database operations
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Record interaction
          await supabase.from('user_interactions').insert({
            user_id: user.id,
            target_user_id: profile.user_id,
            interaction_type: action
          });
          
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
  }, [currentIndex, profiles, dailyLikes, dailySuperLikes, userEloRating, toast, updateRating]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="h-24 w-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-12 w-12 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-3">You're all caught up! 🎉</h2>
        <p className="text-muted-foreground mb-6 text-center">
          You've seen {swipeCount} profiles today.<br/>
          Check back later for new people to connect with.
        </p>
        <Button 
          onClick={() => {
            setCurrentIndex(0);
            setSwipeCount(0);
            loadProfiles();
          }}
          className="bg-gradient-to-r from-primary to-primary/80"
        >
          Show me more profiles
        </Button>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold gradient-text">Discover</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {profiles.length - currentIndex} left
                </Badge>
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-like/10 to-like/5">
                  {100 - dailyLikes} likes
                </Badge>
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-superlike/10 to-superlike/5">
                  {5 - dailySuperLikes} ⭐
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="font-medium">{getRatingTier(userEloRating).tier}</span>
              <span className="text-muted-foreground">({userEloRating})</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Card with Animation */}
      <div className="flex-1 p-4 relative">
        <div className={`${swipeAnimation ? `swipe-${swipeAnimation}` : ''}`}>
          <ProfileCard
            profile={currentProfile}
            onLike={() => handleSwipe('like')}
            onPass={() => handleSwipe('pass')}
            onSuperLike={() => handleSwipe('superlike')}
          />
        </div>
        
        {/* Next profile preview */}
        {profiles[currentIndex + 1] && (
          <div className="absolute inset-0 p-4 z-[-1] opacity-50 scale-95">
            <ProfileCard
              profile={profiles[currentIndex + 1]}
              onLike={() => {}}
              onPass={() => {}}
              onSuperLike={() => {}}
            />
          </div>
        )}
      </div>

      {/* Enhanced Action Buttons */}
      <div className="bg-gradient-to-t from-background/90 to-transparent pb-4">
        <ActionButtons
          onPass={() => handleSwipe('pass')}
          onSuperLike={() => handleSwipe('superlike')}
          onLike={() => handleSwipe('like')}
          disabled={loading || swipeAnimation !== null}
          likesRemaining={100 - dailyLikes}
          superLikesRemaining={5 - dailySuperLikes}
        />
      </div>
    </div>
  );
}