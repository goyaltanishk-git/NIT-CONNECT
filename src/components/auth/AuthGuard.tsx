// src/components/auth/AuthGuard.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { AuthService, Profile } from "@/lib/auth";
import { LoginScreen } from "./LoginScreen";
import { ProfileSetupForm } from "@/components/profile/ProfileSetupform";
import { Component as HeroFuturistic } from "@/components/ui/hero-futuristic";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { syncAppSession } from '@/integrations/supabase/client';
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Verify from "../verify/verfiy";


interface AuthGuardProps { 
  children: React.ReactNode;
}
// ⛔ CRITICAL: wait until Supabase session really exists



export function AuthGuard({ children }: AuthGuardProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showHeroScreen, setShowHeroScreen] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  // Ref to track if we are intentionally in the setup flow to prevent race-condition kicks
  const isSetupMode = useRef(false);

  // Define the initialization logic as a reusable function
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      const localUser = AuthService.getCurrentUser();
      const emailToCheck = localUser?.email;

      if (emailToCheck) {
        // 1. SYNC SESSION
        await syncAppSession(emailToCheck);

        // 2. USE RPC HERE (checkUserExists) instead of getUserProfile
        // This prevents RLS from returning null if the session sync dropped
       
       

        const liveProfile = await AuthService.checkUserExists(emailToCheck);

        if (!liveProfile) {
          AuthService.clearCurrentUser();
          setUserEmail(null);
          setProfile(null);
        } 
        // 3. DETECT SOFT DELETE -> TRIGGER HERO
        else if (liveProfile.is_active === false) {
          console.log("Inactive user detected. Locking to Hero/Setup flow.");
          
          isSetupMode.current = true; // ✅ LOCK THE MODE
          setUserEmail(liveProfile.email);
          setProfile(liveProfile);
          setShowHeroScreen(true);
          
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
          await AuthService.updateLastActive(liveProfile.email);
        }
      } else {
        AuthService.clearCurrentUser();
        setUserEmail(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      AuthService.clearCurrentUser();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // ✅ FIXED SYNC INTERVAL
  useEffect(() => {
    if (!userEmail) return;

    const syncInterval = setInterval(async () => {
      // Don't poll if we are loading or locked in setup mode
      if (loading) return; 

      // ✅ CRITICAL FIX: Use checkUserExists (RPC) instead of getUserProfile
      // This bypasses RLS so we don't get a false "null" result
      const liveStatus = await AuthService.checkUserExists(userEmail);
      
      if (!liveStatus) {
        // User genuinely deleted from DB
        console.log("User not found in background check. Logging out.");
        AuthService.clearCurrentUser();    
        setUserEmail(null);
        return;   
      }
 
      // If user is Inactive in DB, BUT we are already in Setup Mode -> DO NOT KICK
      if (liveStatus.is_active === false) {
         if (showHeroScreen || showProfileSetup || isSetupMode.current) {
             // We are safe. Do nothing. User is reactivating.
             return; 
         }
         
         // If we are NOT in setup mode, but DB says inactive -> Remote Ban/Deactivation
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
    isSetupMode.current = true; // Keep lock active
  };

  const handleProfileSetupComplete = async (updatedProfile: Profile) => {
    try {
      // FINAL ACTIVATION
      const finalProfile = await AuthService.updateProfile(updatedProfile.email, {
        ...updatedProfile,
        is_active: true 
      });
      
      setProfile(finalProfile);
      setShowProfileSetup(false);
      isSetupMode.current = false; // Release lock
      encryptedStorage.set("current-user", JSON.stringify(finalProfile));
    } catch (e) {
      console.error("Activation failed", e);
    }
  };

  if (loading) {
    return (
     <div className="flex items-center justify-center h-full bg-black">
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

  if (showHeroScreen) return <Verify onComplete={handleHeroComplete} />;
  
  if (showProfileSetup && userEmail) return <ProfileSetupForm userEmail={userEmail} onComplete={handleProfileSetupComplete} />;

  return <>{children}</>;
}