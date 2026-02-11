// src/components/auth/AuthGuard.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { AuthService, Profile } from "@/lib/auth";
import { LoginScreen } from "./LoginScreen";
import { ProfileSetupForm } from "@/components/profile/ProfileSetupform";
import { Component as HeroFuturistic } from "@/components/ui/hero-futuristic";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { syncAppSession } from '@/integrations/supabase/client'; 
import { Heart, Sparkles } from "lucide-react";

interface AuthGuardProps { 
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showHeroScreen, setShowHeroScreen] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  const isSetupMode = useRef(false);

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      const localUser = AuthService.getCurrentUser();
      const emailToCheck = localUser?.email;

      if (emailToCheck) {
        // 1. SYNC SESSION
        await syncAppSession(emailToCheck);

        // 2. USE RPC to find user (Bypasses RLS)
        const liveProfile = await AuthService.checkUserExists(emailToCheck);

        if (!liveProfile) {
          // Only logout if we are SURE the user is gone (and it wasn't just a network error)
          console.warn("User not found in DB. Logging out.");
          AuthService.clearCurrentUser();
          setUserEmail(null);
          setProfile(null);
        } 
        // 3. DETECT SOFT DELETE -> TRIGGER HERO
        else if (liveProfile.is_active === false) {
          console.log("Inactive user detected. Locking to Hero/Setup flow.");
          
          isSetupMode.current = true;
          setUserEmail(liveProfile.email);
          setProfile(liveProfile);
          setShowHeroScreen(true);
          
          // Ensure session is fresh
          encryptedStorage.set('active-session', JSON.stringify({
            email: liveProfile.email,
            timestamp: Date.now()
          }));
        } 
        // 4. ACTIVE USER
        else {
          setUserEmail(liveProfile.email);
          setProfile(liveProfile);
          setShowHeroScreen(false); 
          isSetupMode.current = false;
          // Background update
          AuthService.updateLastActive(liveProfile.email);
        }
      } else {
        // No local user found
        AuthService.clearCurrentUser();
        setUserEmail(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // DO NOT LOGOUT ON GENERIC ERRORS (like network)
      // Just stop loading so the user can see if something is wrong
      // or implement a retry mechanism
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync Interval
  useEffect(() => {
    if (!userEmail) return;

    const syncInterval = setInterval(async () => {
      if (loading) return; 

      const liveStatus = await AuthService.checkUserExists(userEmail);
      
      if (!liveStatus) {
        // Only logout if explicitly null (User deleted)
        return;   
      }
 
      if (liveStatus.is_active === false) {
         if (showHeroScreen || showProfileSetup || isSetupMode.current) {
             return; 
         }
         console.log("Remote deactivation detected. Logging out.");
         AuthService.clearCurrentUser();
         setUserEmail(null);
      }
    }, 5000); 

    return () => clearInterval(syncInterval);
  }, [userEmail, showHeroScreen, showProfileSetup, loading]);

  const handleHeroComplete = () => {
    setShowHeroScreen(false);
    setShowProfileSetup(true);
    isSetupMode.current = true; 
  };

  // src/components/auth/AuthGuard.tsx

  const handleProfileSetupComplete = (updatedProfile: Profile) => {
    // ✅ FIX: Do NOT call AuthService.updateProfile here.
    // The RPC in ProfileSetupForm already updated the DB and set is_active = true.
    // We just need to update the local state to match.
    
    // 1. Update State
    setProfile(updatedProfile);
    setShowProfileSetup(false);
    
    // 2. Release the 'Setup Mode' lock so background sync resumes normally
    isSetupMode.current = false; 

    // 3. Persist to Storage
    encryptedStorage.set("current-user", JSON.stringify(updatedProfile));
    
    // 4. Clear the active session marker (optional cleanup)
    if (typeof encryptedStorage.remove === 'function') {
        encryptedStorage.remove('active-session');
    }
  };

  if (loading) {
    return (
     <div className="flex items-center justify-center h-full min-h-screen bg-black">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-pink-500 animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-4xl font-bold gradient-text-animated">NITConnect</h3>
            <p className="text-white text-xl">The Dating and Connection App</p>
          </div>
        </div>
      </div>
    );
  }

  // PASS THE SUCCESS HANDLER TO LOGIN SCREEN
  if (!userEmail) return <LoginScreen onLoginSuccess={initializeAuth} />;

  if (showHeroScreen && profile) {
    return <HeroFuturistic onComplete={handleHeroComplete} userProfile={profile} />;
  }   
  if (showProfileSetup && userEmail && profile) {
    return (
      <ProfileSetupForm 
        userEmail={userEmail} 
        initialProfile={profile} 
        onComplete={handleProfileSetupComplete} 
      />
    );
  }

  return <>{children}</>;
}