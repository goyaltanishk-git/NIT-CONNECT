import { useEffect, useState } from "react";
import { AuthService, Profile } from "@/lib/auth";
import { LoginScreen } from "./LoginScreen";
import { ProfileSetupForm } from "@/components/profile/ProfileSetupform";
import { Component as HeroFuturistic } from "@/components/ui/hero-futuristic";
import { Heart, Sparkles } from "lucide-react";
import { encryptedStorage } from "@/utils/encryptedStorage";

interface AuthGuardProps { 
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showHeroScreen, setShowHeroScreen] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const localUser = AuthService.getCurrentUser();
        const tempUser = encryptedStorage.get("temp-user");
        const emailToCheck = localUser?.email || (tempUser ? JSON.parse(tempUser).email : null);

        if (emailToCheck) {
          const liveProfile = await AuthService.getUserProfile(emailToCheck);

          if (mounted) {
            // If the profile doesn't exist at all, clear session
            if (!liveProfile) {
              AuthService.clearCurrentUser();
              setUserEmail(null);
              setProfile(null);
            } 
            // 🛠️ NEW LOGIC: If account is inactive (is_active: false), allow setup instead of kicking
            else if (liveProfile.is_active === false) {
              setUserEmail(liveProfile.email);
              setProfile(liveProfile);
              
              // Only show Hero if specifically flagged, otherwise straight to setup
              const isReactivating = (localUser as any)?.needsSetup;
              if (isReactivating) {
                setShowHeroScreen(true);
              } else {
                setShowProfileSetup(true);
              }
            } 
            else {
              // Standard active user flow
              setUserEmail(liveProfile.email);
              setProfile(liveProfile);
              await AuthService.updateLastActive(liveProfile.email);
            }
          }
        } else {
          AuthService.clearCurrentUser();
        }

        if (mounted) setLoading(false);
      } catch (error) {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();
    return () => { mounted = false; };
  }, []);

  // HEARTBEAT: Sync Check to catch setup completion or deletions in other tabs
  useEffect(() => {
  if (!userEmail) return;

  const syncInterval = setInterval(async () => {
    const liveStatus = await AuthService.getUserProfile(userEmail);
     
    // 1. Hard Delete Check: If the row is actually gone
    if (!liveStatus) {
      AuthService.clearCurrentUser();    
      setUserEmail(null);
      setProfile(null);
      return;   
    }
 
    // 2. Setup Completion Sync: 
    // If Device A finishes setup, Device B moves from Setup Form -> Main App
    if (liveStatus.is_active === true && showProfileSetup) {
      setProfile(liveStatus);
      setShowProfileSetup(false);
      setShowHeroScreen(false);
    }
    
    // 3. 🛠️ THE FIX: Deactivation/Soft-Delete Sync
    // If the user is currently IN the main app (!showProfileSetup) 
    // but the database now says is_active is false, they were "deleted" elsewhere.
    if (liveStatus.is_active === false && !showProfileSetup && !showHeroScreen) {
       // Clear session and kick to Login Screen immediately
       AuthService.clearCurrentUser();
       setUserEmail(null);
       setProfile(null);
       // Ensure setup states are reset so they don't get stuck in setup form
       setShowProfileSetup(false); 
       setShowHeroScreen(false);
    }
  }, 5000); 

  return () => clearInterval(syncInterval);
}, [userEmail, showHeroScreen, showProfileSetup]);

  const handleHeroComplete = () => {
    setShowHeroScreen(false);
    setShowProfileSetup(true);
  };

  const handleProfileSetupComplete = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    setShowProfileSetup(false);
    // Clear the needsSetup flag upon completion
    const { needsSetup, ...cleanProfile } = updatedProfile as any;
    encryptedStorage.set("current-user", JSON.stringify(cleanProfile));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        {/* Loading Spinner Content */}
        <div className="text-center space-y-8 p-8 animate-fade-in">
          <div className="relative">
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
            </div>
            <Sparkles className="absolute -top-4 -right-4 w-6 h-6 text-pink-400 animate-pulse" />
            <Heart className="absolute -bottom-4 -left-4 w-5 h-5 text-purple-400 animate-bounce" />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-bold gradient-text-animated">Loading...</h3>
            <p className="text-gray-400 text-lg">Preparing your experience</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userEmail) return <LoginScreen />;

  if (showHeroScreen) return <HeroFuturistic onComplete={handleHeroComplete} />;

  if (showProfileSetup) return <ProfileSetupForm userEmail={userEmail} onComplete={handleProfileSetupComplete} />;

  return <>{children}</>;
}