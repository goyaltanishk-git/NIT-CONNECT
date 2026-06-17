import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Filter, X, Heart, MessageCircle, Settings } from "lucide-react";
import { EnhancedProfileCard} from "./EnhancedProfileCard";
import { useProfilesGlobal, DatabaseProfile } from "@/hooks/useProfilesGlobal";
import { useAuth } from "@/hooks/useAuth";
import { useDailyLimits } from "@/hooks/useDailyLimits";
import { useToast } from "@/hooks/use-toast";
import { supabase, syncAppSession } from "@/integrations/supabase/client"
import { encryptedStorage } from "@/utils/encryptedStorage";
import { DailyLimitAlert } from "./DailyLimitAlert";
import { getDisplayBio, getDisplayDetails, getDisplayName, getDisplayPhotos } from "@/utils/incognitoUtils";

interface DiscoveryScreenGlobalProps {
  onNavigateToLikes?: () => void;
  onNavigateToChat?: () => void;
  onNavigateToDatingSettings?: () => void;
}

export function DiscoveryScreenGlobal({ onNavigateToLikes, onNavigateToChat, onNavigateToDatingSettings }: DiscoveryScreenGlobalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | null>(null);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [showRotateTip, setShowRotateTip] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("has-seen-card-rotate-tip");
    if (!hasSeen) {
      setShowRotateTip(true);
      localStorage.setItem("has-seen-card-rotate-tip", "true");
    }
  }, []);

  const dismissRotateTip = () => {
    setShowRotateTip(false);
  };
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [showCollegeFilter, setShowCollegeFilter] = useState(false);
  const [isDatingEnabled, setIsDatingEnabled] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const hasUserInteracted = useRef(false);
  const { profiles, loading, availableColleges } = useProfilesGlobal(selectedColleges, isDatingEnabled);
  const { user } = useAuth();
  const { toast } = useToast();

  const currentUserData = encryptedStorage.get('current-user');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const userEmail = currentUser?.email || user?.email;
  const userCollege = currentUser?.college;

  const { canLike, loading: limitsLoading, incrementLikes } = useDailyLimits(userEmail);

  useEffect(() => {
    setIsDatingEnabled(Boolean(currentUser?.is_dating));
  }, [currentUser?.is_dating]);

  const handleJoinDating = async () => {
    if (!userEmail || joinLoading) return;

    try {
      setJoinLoading(true);
      await syncAppSession(userEmail);

      // Call the RPC function to join dating mode
      const { data, error } = await (supabase as any).rpc('join_dating_mode', { 
        p_email: userEmail 
      });

      if (error) {
        console.error("RPC error:", error);
        throw new Error(`Failed to join dating: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error("Failed to join dating mode");
      }

      // Update local storage
      const stored = encryptedStorage.get("current-user");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.is_dating = true;
        encryptedStorage.set("current-user", JSON.stringify(parsed));
      }
 
      // Force UI update
      setIsDatingEnabled(true);
      toast({
        title: "Dating mode enabled",
        description: "You can now discover and interact with other active dating users.",
      });
    } catch (error: any) {
      console.error("Join dating error:", error);
      toast({
        title: "Could not enable dating",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setJoinLoading(false);
    }
  };


  const handleSwipe = async (action: 'like' | 'pass') => {
    if (currentIndex >= profiles.length) return;
    hasUserInteracted.current = true;
    const profile = profiles[currentIndex];

    if (action === 'like' && !canLike) { 
      setShowLimitAlert(true);
      return;
    }

    setSwipeAnimation(action === 'like' ? 'right' : 'left');

    try {
      if (action === 'like') {
        const success = await incrementLikes();
        if (!success) {
          setSwipeAnimation(null);
          setShowLimitAlert(true);
          return;
        }
      }

      if (userEmail) {
        // ✅ CALL THE SECURE RPC INSTEAD OF .insert()
        const { error } = await (supabase as any).rpc('record_swipe', {
          p_user_id: userEmail,
          p_target_user_id: profile.email,
          p_action: action
        });

        if (error) throw error;
      }

      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSwipeAnimation(null);
      }, 300);

      if (action === 'like') {
        toast({
          title: "Like sent! 💖",
          description: `You liked ${profile.first_name}.`,
        });
      }
    } catch (error) {
      console.error(error);
      setSwipeAnimation(null);
      toast({
        title: "Action failed",
        description: "Your session might have expired. Please refresh.",
        variant: "destructive",
      });
    }
  };
  
  const transformProfileForCard = (profile: DatabaseProfile) => {
    const displayDetails = getDisplayDetails(profile);
    const displayName = getDisplayName(profile);
    const displayBio = getDisplayBio(profile);
    const displayPhotos = getDisplayPhotos(profile, (profile as any).photos?.map((p: any) => p.url) || []);

    return {
      id: profile.email,
      user_id: profile.email,
      full_name: displayName,
      age: calculateAge(profile.date_of_birth),
      bio: displayBio || 'No bio available',
      year: parseInt(profile.year_of_study || '1'),
      branch: displayDetails.branch || 'Not specified',
      hometown: displayDetails.hometown || 'Not specified',
      interests: (profile as any).interests || [],
      photos: (displayPhotos || []).map((url: string, index: number) => ({
        url,
        order: index,
      })),
      height: String(displayDetails.height || 'Not specified'),
      looking_for: profile.interested_in || 'Anyone',
      verified: profile.is_verified || false,
      lives_in: profile.hometown || '',
      distance_from_you: 'Nearby',
      college: profile.college

    };
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const toggleCollegeSelection = (college: string) => {
    if (!college || college.trim() === '') return;
    
    const trimmedCollege = college.trim();
    setSelectedColleges(prev => {
      // If this college is already selected, deselect it
      if (prev.some(c => c.trim() === trimmedCollege)) {
        return [];
      }
      // Otherwise, select only this college
      return [trimmedCollege];
    });
    setCurrentIndex(0);
    setShowCollegeFilter(false);
  };

  if (loading || limitsLoading) {
    return (
    <div className="flex items-center justify-center min-h-dvh bg-black">
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

  if (!isDatingEnabled) {
    return (
      <div className="relative flex flex-col h-full bg-black text-white overflow-hidden">
        <div className="w-full flex justify-end items-center px-4 py-2 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToDatingSettings}
            className="h-8 px-3 rounded-md border border-white/10 bg-white/5 text-white hover:bg-white/10"
            title="Dating Settings"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5 text-pink-400" />
            <span className="text-[11px] font-medium text-white">Dating Settings</span>
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-center space-y-4">
            <Sparkles className="h-8 w-8 text-pink-400 mx-auto" />
            <h2 className="text-xl font-bold">Join Dating</h2>
            <p className="text-sm text-gray-300">
              Enable dating mode to access Global Discovery. You can still use Profile and Settings without joining.
            </p>
            <Button
              onClick={handleJoinDating}
              disabled={joinLoading}
              className="w-full rounded-full bg-pink-600 hover:bg-pink-500 text-white"
            >
              {joinLoading ? "Joining..." : "Join Dating"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-black text-white overflow-hidden">
      <DailyLimitAlert isOpen={showLimitAlert} onClose={() => setShowLimitAlert(false)} />

      {/* Pro Swipe Tip Modal */}
      {showRotateTip && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[100] px-4 animate-fade-in backdrop-blur-sm">
          <div className="relative w-full max-w-[360px] bg-zinc-950 border border-pink-500/30 p-6 rounded-3xl text-center space-y-4 shadow-[0_0_50px_rgba(236,72,153,0.25)] text-white">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
            
            <div className="space-y-2 pt-2">
              <h3 className="text-xl font-bold uppercase tracking-wider text-pink-400">Pro Swipe Tip</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Click on any profile card to flip it around! You'll reveal their full bio, branch, college, hometown, height, and complete details.
              </p>
            </div>

            <Button
              onClick={dismissRotateTip}
              className="w-full h-12 bg-pink-500 hover:bg-pink-400 text-black font-bold uppercase tracking-wider rounded-xl transition duration-200"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}

      {/* Top Bar - Independent Filter Area */}
      <div className="w-full grid grid-cols-[1.15fr_1fr_1fr_1.3fr] gap-1 px-3 sm:px-4 py-2 z-50 overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCollegeFilter(!showCollegeFilter)}
          className={`h-7 sm:h-8 w-full min-w-0 px-1.5 sm:px-2 rounded-md border transition-colors whitespace-nowrap justify-start ${
            showCollegeFilter
              ? 'border-white/25 bg-white/15'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
          }`}
        >
          <Filter className={`h-3 w-3 mr-1 shrink-0 ${selectedColleges.length > 0 ? 'text-pink-400' : 'text-gray-300'}`} />
          <span className="min-w-0 truncate text-[9px] sm:text-[10px] font-medium leading-none text-white">
            {selectedColleges.length > 0 ? selectedColleges[0] : 'All Colleges'}
          </span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateToLikes}
          className="h-7 sm:h-8 w-full min-w-0 px-1.5 sm:px-2 rounded-md border border-pink-500/25 bg-white/5 text-white justify-start transition-colors hover:bg-pink-500/10 hover:border-pink-400/50"
          title="Go to Likes"
        >
          <Heart className="h-3 w-3 mr-1 shrink-0 text-pink-400" />
          <span className="min-w-0 truncate text-[9px] sm:text-[10px] font-medium leading-none text-white">Likes</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateToChat}
          className="h-7 sm:h-8 w-full min-w-0 px-1.5 sm:px-2 rounded-md border border-cyan-500/25 bg-white/5 text-white justify-start transition-colors hover:bg-cyan-500/10 hover:border-cyan-400/50"
          title="Go to Chat"
        >
          <MessageCircle className="h-3 w-3 mr-1 shrink-0 text-cyan-400" />
          <span className="min-w-0 truncate text-[9px] sm:text-[10px] font-medium leading-none text-white">Chat</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateToDatingSettings}
          className="h-7 sm:h-8 w-full min-w-0 px-1.5 sm:px-2 rounded-md border border-violet-500/25 bg-white/5 text-white justify-start transition-colors hover:bg-violet-500/10 hover:border-violet-400/50"
          title="Dating Settings"
        >
          <Settings className="h-3 w-3 mr-1 shrink-0 text-violet-400" />
          <span className="min-w-0 whitespace-nowrap text-[9px] sm:text-[10px] font-medium leading-none text-white">Dating Settings</span>
        </Button>
      </div>

      {/* Transparent Dropdown Overlay */}
      {showCollegeFilter && (
        <div className="absolute top-10 left-0 right-0 z-[60] px-4 animate-in slide-in-from-top-1 duration-200">
          <div className="p-4 bg-black/80 backdrop-blur-2xl rounded-xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-white/45 uppercase tracking-[0.28em] px-1">Select Other College</span>
              <X 
                className="h-3.5 w-3.5 text-gray-500 cursor-pointer hover:text-white transition-colors" 
                onClick={() => setShowCollegeFilter(false)} 
              />
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => { setSelectedColleges([]); setShowCollegeFilter(false); setCurrentIndex(0); }}
                className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors border ${
                  selectedColleges.length === 0
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                All Colleges
              </button>
              {userCollege && (
                <button
                  onClick={() => toggleCollegeSelection(userCollege)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors border ${
                    selectedColleges.some(c => c.trim() === userCollege.trim())
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {userCollege.trim()} (Yours)
                </button>
              )}
              {availableColleges.map((college) => (
                <button
                  key={college}
                  onClick={() => toggleCollegeSelection(college)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors border ${
                    selectedColleges.some(c => c.trim() === college.trim())
                      ? 'bg-pink-500 text-black border-pink-400'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {college.trim()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile Area */}
      <div className="flex-1 relative flex items-start justify-center pt-1">
        {profiles.length === 0 || currentIndex >= profiles.length ? (
           <div className="text-center space-y-4 px-6 mt-20 animate-fade-in">
             <Sparkles className="h-10 w-10 text-pink-500/50 mx-auto" />
             <h2 className="text-lg font-bold">You're all caught up!</h2>
             <p className="text-gray-500 text-xs">Try selecting a different college.</p>
             {selectedColleges.length > 0 && (
               <Button variant="link" onClick={() => setSelectedColleges([])} className="text-pink-500 text-xs h-auto p-0">
                 Reset to Global
               </Button>
             )}
           </div>
        ) : (
          <div className="relative w-[92%] max-w-[400px] h-[75dvh]">
            <div className={`relative w-full h-full transition-all duration-300 ${
              swipeAnimation === 'left' ? 'swipe-left' :
              swipeAnimation === 'right' ? 'swipe-right' : ''
            }`}>
               
               {/* 👇 PASTE THIS CODE BLOCK HERE 👇 */}
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
              {/* 👆 END PASTE 👆 */}

               <EnhancedProfileCard
                profile={transformProfileForCard(profiles[currentIndex])}
                onLike={() => handleSwipe('like')}
                onPass={() => handleSwipe('pass')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}