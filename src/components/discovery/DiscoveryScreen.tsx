import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Settings2, TrendingUp, Zap, Filter, RotateCcw, Sparkles, Stars } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileCard } from "./ProfileCard";
import { ActionButtonsWithLimits } from "./ActionButtonWithLimits";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DiscoveryScreenIntegrated } from "./DiscoveryScreenIntegrated";
import { SAMPLE_PROFILES, Profile } from "@/data/sampleProfiles";
import { filterProfile } from "@/utils/contentFilter";
import{encryptedStorage} from "@/utils/encryptedStorage";

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
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | null>(null);
  const [dailyLikes, setDailyLikes] = useState(0);
  const [passedProfiles, setPassedProfiles] = useState<string[]>([]);
  const { toast } = useToast();

  // Daily limits constants
  const DAILY_LIKE_LIMIT = 2;

  // ✅ initialize user data first
  useEffect(() => {
    initializeUserData();
  }, []);

  // ✅ load profiles after initialization
  useEffect(() => {
    loadProfiles();
  }, []);

  // Check if it's a new day and reset limits
  const checkAndResetDailyLimits = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastResetDate = localStorage.getItem('lastResetDate');
    
    if (lastResetDate !== today) {
      // It's a new day, reset limits
      setDailyLikes(0);
      localStorage.setItem('lastResetDate', today);
      
      // Update temp user data
      const tempUser = localStorage.getItem('temp-user');
      if (tempUser) {
        const userData = JSON.parse(tempUser);
        userData.dailyLikes = 0;
        userData.lastResetDate = today;
        localStorage.setItem('temp-user', JSON.stringify(userData));
      }
      
      toast({
        title: "Daily limits reset! 🌅",
        description: "You have fresh likes for today!",
      });
    }
  };

  // Set up automatic reset at midnight
  useEffect(() => {
    checkAndResetDailyLimits();
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to midnight

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      checkAndResetDailyLimits();
      
      // Set up daily interval for subsequent days
      const intervalId = setInterval(checkAndResetDailyLimits, 24 * 60 * 60 * 1000);
      
      // Cleanup interval when component unmounts
      return () => clearInterval(intervalId);
    }, msUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, []);

  const initializeUserData = async () => {
    try {
      // In demo mode, use localStorage
      const tempUser = localStorage.getItem('temp-user');
      if (tempUser) {
        const userData = JSON.parse(tempUser);
        setDailyLikes(userData.dailyLikes || 0);
        setPassedProfiles(userData.passedProfiles || []);
      } else {
        // In real mode, fetch from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get daily limits
          const today = new Date().toISOString().split('T')[0];
          const { data: limits } = await supabase
            .from('daily_limits')
            .select('*')
            .eq('email', user.email!)
            .eq('date', today)
            .maybeSingle();
            
          setDailyLikes(limits?.likes_used || 0);
        }
      }
    } catch (error) {
    }
  };

  const loadProfiles = async () => {
    try {
      // Filter inappropriate content
      const filteredProfiles = SAMPLE_PROFILES
        .filter(profile => {
          const contentCheck = filterProfile(profile);
          return (contentCheck.isAppropriate || contentCheck.severity === 'low') && 
                 !passedProfiles.includes(profile.user_id);
        });

      // Fallback to all sample profiles if filtering removed everything
      const result = filteredProfiles.length > 0 ? filteredProfiles : SAMPLE_PROFILES.filter(p => !passedProfiles.includes(p.user_id));
      setProfiles(result);
      setCurrentIndex(0);
      setLoading(false);
    } catch (error) {
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

  const handleSwipe = useCallback(async (action: 'like' | 'pass') => {
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    // Check daily limits
    if (action === 'like' && dailyLikes >= DAILY_LIKE_LIMIT) {
      toast({
        title: "Daily like limit reached! 🚫",
        description: `You've used all ${DAILY_LIKE_LIMIT} likes today. Come back tomorrow at 12 AM!`,
        variant: "destructive"
      });
      return;
    }

    // Set animation
    setSwipeAnimation(action === 'like' ? 'right' : 'left');
    
    // Update counts
    setSwipeCount(prev => prev + 1);
    if (action === 'like') setDailyLikes(prev => prev + 1);
    if (action === 'pass') setPassedProfiles(prev => [...prev, profile.user_id]);
    
    try {
      const tempUser = localStorage.getItem('temp-user');
      let isMatch = false;
      
      if (tempUser) {
        // Simulate match probability (simple random chance)
        let matchChance = 0.25;
        
        isMatch = action !== 'pass' && Math.random() < matchChance;
        
        // Update local storage with new stats
        const userData = JSON.parse(tempUser);
        userData.dailyLikes = dailyLikes + (action === 'like' ? 1 : 0);
        userData.passedProfiles = action === 'pass' ? [...passedProfiles, profile.user_id] : passedProfiles;
        localStorage.setItem('temp-user', JSON.stringify(userData));
        
        // Show appropriate feedback
        if (isMatch) {
          setTimeout(() => {
            toast({
              title: "It's a Match! 🎉",
              description: `You and ${profile.full_name} liked each other!`,
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

        // Show limit warnings
        if (action === 'like' && dailyLikes + 1 === DAILY_LIKE_LIMIT - 1) {
          setTimeout(() => {
            toast({
              title: "Almost at your limit! ⚠️",
              description: `You have 1 like remaining today.`,
            });
          }, 500);
        } else if (action === 'like' && dailyLikes + 1 === DAILY_LIKE_LIMIT) {
          setTimeout(() => {
            toast({
              title: "Daily limit reached! 🚫",
              description: `You've used all ${DAILY_LIKE_LIMIT} likes today. Come back tomorrow!`,
            });
          }, 500);
        }

      } else {
        // Real database operations
        const userd = encryptedStorage.get('current-user');
        const user = JSON.parse(userd);

        if (user) {
          // Record interaction
          await supabase.from('user_interactions').insert({
            user_id: user.email,
            target_user_id: profile.user_id,
            interaction_type: action
          });
          
          // Update daily limits
          const today = new Date().toISOString().split('T')[0];
          const { data: limits } = await supabase
            .from('daily_limits')
            .select('*')
            .eq('email', user.email)
            .eq('date', today)
            .maybeSingle();
            
          if (limits) {
            await supabase
              .from('daily_limits')
              .update({
                email: user.email,
    date: today,
                likes_used: action === 'like' ? limits.likes_used + 1 : limits.likes_used
              })
              .eq('email', user.email)
              .eq('date', today);
          } else {
            await supabase
              .from('daily_limits')
              .insert({
                email: user.email,
                date: today,
                likes_used: action === 'like' ? 1 : 0
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
      setSwipeAnimation(null);
    }
  }, [currentIndex, profiles, dailyLikes, passedProfiles, toast]);

  // ✅ Enhanced Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[99%] bg-gradient-to-br from-background via-primary/5 to-secondary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse"></div>
        <div className="text-center space-y-6 p-8 relative z-10">
          <div className="relative">
            <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary mx-auto"></div>
            <Heart className="h-8 w-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="absolute inset-0 h-20 w-20 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 animate-ping opacity-30"></div>
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold gradient-text animate-fade-in">Finding amazing people for you...</h3>
            <p className="text-muted-foreground animate-fade-in">Curating perfect matches based on your preferences</p>
            <div className="flex justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-background via-primary/3 to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
        <div className="relative z-10 max-w-md mx-auto">
          <div className="h-40 w-40 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-8 mx-auto relative">
            <Heart className="h-20 w-20 text-primary/60 animate-float" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse"></div>
          </div>
          <h2 className="text-4xl font-bold mb-6 gradient-romantic">No profiles available 😢</h2>
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            Try adjusting your filters or check back later for new people to connect with.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={loadProfiles} 
              className="bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground font-semibold py-3 px-8 rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Reload Profiles
            </Button>
            {passedProfiles.length > 0 && (
              <Button variant="outline" onClick={handleRewind} className="py-3 px-8 rounded-full hover:scale-105 transition-all duration-300">
                <RotateCcw className="h-5 w-5 mr-2" />
                Rewind Last
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-background via-primary/3 to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
        <div className="relative z-10 max-w-md mx-auto">
          <div className="h-40 w-40 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-8 mx-auto animate-glow">
            <Heart className="h-20 w-20 text-primary-foreground animate-pulse" />
          </div>
          <h2 className="text-4xl font-bold mb-6 gradient-romantic">You're all caught up! 🎉</h2>
          <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
            You've seen <span className="font-semibold text-primary">{swipeCount}</span> profiles today.<br/>
            Check back later for new people to connect with.
          </p>
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-2xl mb-8 border border-primary/20">
            <h3 className="font-semibold text-primary mb-3 flex items-center justify-center">
              <Stars className="w-5 h-5 mr-2" />
              Today's Activity
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Likes used:</span> {dailyLikes}/{DAILY_LIKE_LIMIT}</p>
              <p><span className="font-medium">Profiles viewed:</span> {swipeCount}</p>
              <p className="text-xs text-muted-foreground">Limits reset at 12:00 AM</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => {
                setCurrentIndex(0);
                setSwipeCount(0);
                loadProfiles();
              }}
              className="bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground font-semibold py-3 px-8 rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Show me more profiles
            </Button>
            {passedProfiles.length > 0 && (
              <Button variant="outline" onClick={handleRewind} className="py-3 px-8 rounded-full hover:scale-105 transition-all duration-300">
                <RotateCcw className="h-5 w-5 mr-2" />
                Rewind Last
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const canLike = dailyLikes < DAILY_LIKE_LIMIT;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-primary/3 to-secondary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse opacity-50"></div>
      
      {/* Enhanced Profile Card Stack */}
      <div className="flex-1 flex justify-center items-center p-4 relative z-10">
        <div className="relative w-full max-w-sm">
          {/* Current Profile Card */}
          <div className={`transition-all duration-500 ${
            swipeAnimation === 'left' ? 'swipe-left' :
            swipeAnimation === 'right' ? 'swipe-right' : 
            'animate-scale-in'
          }`}>
            <ProfileCard
              profile={currentProfile}
              onLike={() => handleSwipe('like')}
              onPass={() => handleSwipe('pass')}
              onSuperLike={() => {}}
            />
          </div>
          
          {/* Next profile preview with enhanced styling */}
          {profiles[currentIndex + 1] && (
            <div className="absolute inset-0 z-[-1] opacity-40 scale-95 transform rotate-2 transition-all duration-500">
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
            <div className="absolute inset-0 z-[-2] opacity-20 scale-90 transform -rotate-1 transition-all duration-500">
              <ProfileCard
                profile={profiles[currentIndex + 2]}
                onLike={() => {}}
                onPass={() => {}}
                onSuperLike={() => {}}
              />
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="relative z-10">
        <ActionButtonsWithLimits
          onPass={() => handleSwipe('pass')}
          onLike={() => handleSwipe('like')}
          onRewind={passedProfiles.length > 0 ? handleRewind : undefined}
          onBoost={handleBoost}
          disabled={loading || swipeAnimation !== null}
          likesRemaining={DAILY_LIKE_LIMIT - dailyLikes}
          canLike={canLike}
        />
      </div>
    </div>
  );
}