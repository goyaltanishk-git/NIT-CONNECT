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
            // STRICT CHECK: If account is deleted (is_active: false), kick to Login Screen
            if (!liveProfile || liveProfile.is_active === false) {
              AuthService.clearCurrentUser();
              setUserEmail(null);
              setProfile(null);
            } else {
              setUserEmail(liveProfile.email);
              setProfile(liveProfile);

              // Check if this is a reactivated session needing setup
              const isReactivating = (localUser as any)?.needsSetup;
              if (isReactivating) {
                setShowHeroScreen(true);
              } else {
                await AuthService.updateLastActive(liveProfile.email);
              }
            }
          }
        } else {
          AuthService.clearCurrentUser();
        }

        if (mounted) setLoading(false);
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();
    return () => { mounted = false; };
  }, []);

  // HEARTBEAT: Sync Check to catch deletions in other tabs immediately
  useEffect(() => {
    if (!userEmail || showHeroScreen || showProfileSetup) return;

    const syncInterval = setInterval(async () => {
      const liveStatus = await AuthService.getUserProfile(userEmail);
      // If deleted elsewhere, clear session and force Login Screen
      if (!liveStatus || liveStatus.is_active === false) {
        AuthService.clearCurrentUser();
        setUserEmail(null);
        setProfile(null);
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
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-pink-500/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none"></div>
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

  // If no email or account is inactive, always return to LoginScreen
  if (!userEmail) return <LoginScreen />;

  if (showHeroScreen) return <HeroFuturistic onComplete={handleHeroComplete} />;

  if (showProfileSetup) return <ProfileSetupForm userEmail={userEmail} onComplete={handleProfileSetupComplete} />;

  return <>{children}</>;
}