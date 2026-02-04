import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Filter, X } from "lucide-react";
import { EnhancedProfileCard} from "./EnhancedProfileCard";
import { useProfilesGlobal, DatabaseProfile } from "@/hooks/useProfilesGlobal";
import { useAuth } from "@/hooks/useAuth";
import { useDailyLimits } from "@/hooks/useDailyLimits";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { DailyLimitAlert } from "./DailyLimitAlert";
import { getDisplayBio, getDisplayDetails, getDisplayName, getDisplayPhotos } from "@/utils/incognitoUtils";

export function DiscoveryScreenGlobal() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | null>(null);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [showCollegeFilter, setShowCollegeFilter] = useState(false);

  const hasUserInteracted = useRef(false);
  const { profiles, loading, availableColleges } = useProfilesGlobal(selectedColleges);
  const { user } = useAuth();
  const { toast } = useToast();

  const currentUserData = encryptedStorage.get('current-user');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const userEmail = currentUser?.email || user?.email;

  const { canLike, loading: limitsLoading, incrementLikes } = useDailyLimits(userEmail);

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
        await supabase.from('user_interactions').insert({
          user_id: userEmail,
          target_user_id: profile.email,
          interaction_type: action
        });
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
      setSwipeAnimation(null);
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
      height: displayDetails.height || 'Not specified',
      looking_for: profile.interested_in || 'Anyone',
      verified: profile.is_verified || false,
      lives_in: profile.hometown || '',
      distance_from_you: 'Nearby',
      college:profile.college
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
    setSelectedColleges(prev => (prev.includes(college) ? [] : [college]));
    setCurrentIndex(0);
    setShowCollegeFilter(false);
  };

  if (loading || limitsLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="loading-heart mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-black text-white overflow-hidden">
      <DailyLimitAlert isOpen={showLimitAlert} onClose={() => setShowLimitAlert(false)} />

      {/* Top Bar - Independent Filter Area */}
      <div className="w-full flex justify-end items-center px-4 py-1.5 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCollegeFilter(!showCollegeFilter)}
          className={`h-7 px-2.5 rounded-full border border-white/10 transition-all ${
            showCollegeFilter ? 'bg-white/20' : 'bg-white/5'
          }`}
        >
          <Filter className={`h-3 w-3 mr-1.5 ${selectedColleges.length > 0 ? 'text-pink-500' : 'text-gray-400'}`} />
          <span className="text-[10px] font-medium tracking-tight">
            {selectedColleges.length > 0 ? selectedColleges[0] : 'All Colleges'}
          </span>
        </Button>
      </div>

      {/* Transparent Dropdown Overlay */}
      {showCollegeFilter && (
        <div className="absolute top-10 left-0 right-0 z-[60] px-4 animate-in slide-in-from-top-1 duration-200">
          <div className="p-4 bg-black/70 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Select Other College</span>
              <X 
                className="h-3.5 w-3.5 text-gray-500 cursor-pointer hover:text-white" 
                onClick={() => setShowCollegeFilter(false)} 
              />
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              <button
                onClick={() => { setSelectedColleges([]); setShowCollegeFilter(false); setCurrentIndex(0); }}
                className={`px-3 py-1.5 rounded-full text-[11px] transition-all border ${
                  selectedColleges.length === 0
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                }`}
              >
                All (Excl. Yours)
              </button>
              {availableColleges.map((college) => (
                <button
                  key={college}
                  onClick={() => toggleCollegeSelection(college)}
                  className={`px-3 py-1.5 rounded-full text-[11px] transition-all border ${
                    selectedColleges.includes(college)
                      ? 'bg-pink-600/80 text-white border-pink-500/50'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {college}
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