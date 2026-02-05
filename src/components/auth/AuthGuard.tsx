// src/components/auth/AuthGuard.tsx
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
  const [sessionToken, setSessionToken] = useState<string | null>(null);

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
            if (!liveProfile) {
              AuthService.clearCurrentUser();
              setUserEmail(null);
              setProfile(null);
            } 
            // ✅ FIX: Trigger Hero Screen for all inactive profiles
            else if (liveProfile.is_active === false) {
              setUserEmail(liveProfile.email);
              setProfile(liveProfile);
              
              // Secure Session Token to prevent ghost logins
              const newSessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              setSessionToken(newSessionToken);
              
              const sessionData = {
                email: liveProfile.email,
                sessionToken: newSessionToken,
                timestamp: Date.now()
              };
              encryptedStorage.set('active-session', JSON.stringify(sessionData));
              
              // Force Hero Screen visibility for setup flow
              setShowHeroScreen(true);
            } 
            else {
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
        console.error('Auth initialization error:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!userEmail) return;

    const syncInterval = setInterval(async () => {
      const liveStatus = await AuthService.getUserProfile(userEmail);
      
      if (!liveStatus) {
        AuthService.clearCurrentUser();    
        setUserEmail(null);
        setProfile(null);
        return;   
      }
 
      // Ghost Login Prevention: If account becomes active elsewhere, hide hero/setup
      if (liveStatus.is_active === true && (showProfileSetup || showHeroScreen)) {
        setProfile(liveStatus);
        setShowProfileSetup(false);
        setShowHeroScreen(false);
      }
      
      // Deactivation Sync: Kick to login if deactivated elsewhere
      if (liveStatus.is_active === false && !showProfileSetup && !showHeroScreen) {
         AuthService.clearCurrentUser();
         encryptedStorage.set('active-session', '');
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
    encryptedStorage.set("current-user", JSON.stringify(updatedProfile));
    encryptedStorage.set('active-session', ''); 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center animate-fade-in">
          <div className="loading-heart mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-white">Loading Experience...</h3>
        </div>
      </div>
    );
  }

  if (!userEmail) return <LoginScreen />;

  // ✅ Hero must be checked before children to block the main app
  if (showHeroScreen) return <HeroFuturistic onComplete={handleHeroComplete} />;

  if (showProfileSetup) return <ProfileSetupForm userEmail={userEmail} onComplete={handleProfileSetupComplete} />;

  return <>{children}</>;
}