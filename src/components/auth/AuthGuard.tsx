// src/components/auth/AuthGuard.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { AuthService, Profile } from "@/lib/auth";
import { LoginScreen } from "./LoginScreen";
import { ProfileSetupForm } from "@/components/profile/ProfileSetupform";
import { Component as HeroFuturistic } from "@/components/ui/hero-futuristic";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { supabase, syncAppSession } from '@/integrations/supabase/client';
import { setSentryUser, clearSentryUser } from "@/sentry";
import { Sparkles } from "lucide-react";
import Verify from "../verify/verfiy";
import { AboutScreen } from "@/components/profile/AboutScreen";
import { ConsentScreen } from "./ConsentScreen";

interface AuthGuardProps {  
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [showLanding, setShowLanding] = useState(() => !AuthService.getCurrentUser());
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Strict Routing States
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showHeroScreen, setShowHeroScreen] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null);
  
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
          // CONDITION A: Passed OTP, but no profile -> Go to Verify
          setUserEmail(emailToCheck);
          setNeedsVerification(true);
          setShowHeroScreen(false);
          setShowProfileSetup(false);
        } 
        else if (liveProfile.is_active === false) {
          // CONDITION B: Profile exists but inactive -> Go to Hero/Setup
          console.log("Inactive user detected. Locking to Hero/Setup flow.");
          
          isSetupMode.current = true;
          setUserEmail(liveProfile.email);
          setProfile(liveProfile);
          setNeedsVerification(false);
          setShowHeroScreen(true);
          setShowProfileSetup(false);
          
          // Ensure session is fresh
          encryptedStorage.set('active-session', JSON.stringify({
            email: liveProfile.email,
            timestamp: Date.now()
          }));
        } 
        else {
          // CONDITION C: Active User -> Go to Main App (Check pending consent first)
          if (localStorage.getItem(`pending-consent-${liveProfile.email}`) === "true") {
            setUserEmail(liveProfile.email);
            setProfile(liveProfile);
            setNeedsVerification(false);
            setShowHeroScreen(false);
            setShowProfileSetup(false);
            setShowConsent(true);
            isSetupMode.current = true;
          } else {
            setUserEmail(liveProfile.email);
            setProfile(liveProfile);
            setNeedsVerification(false);
            setShowHeroScreen(false);
            setShowProfileSetup(false);
            setShowConsent(false);
            isSetupMode.current = false;

            // Tag all future Sentry errors with this user
            setSentryUser(liveProfile.email);

            // Background update
            AuthService.updateLastActive(liveProfile.email);
          }
        }
      } else {
        // No local user found
        AuthService.clearCurrentUser();
        clearSentryUser();
        setUserEmail(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Realtime subscription and Sync Interval with error handling and circuit breaker
  useEffect(() => {
    if (!userEmail || needsVerification) return;

    // 1. Realtime subscription for immediate deactivation detection (0s lag)
    const channel = supabase
      .channel(`profile-deactivation-${userEmail}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `email=eq.${userEmail}`,
        },
        (payload) => {
          const updated = payload.new as Profile;
          if (updated && updated.is_active === false) {
            console.log("Realtime deactivation detected. Logging out.");
            AuthService.clearCurrentUser();
            setUserEmail(null);
            window.location.reload();
          }
        }
      )
      .subscribe();

    // 2. Slower Polling sync interval (conserve quota) with circuit breaker
    let consecutiveFailures = 0;
    const syncInterval = setInterval(async () => {
      if (loading) return;

      try {
        const liveStatus = await AuthService.checkUserExists(userEmail);
        consecutiveFailures = 0; // Reset on success

        if (!liveStatus) return;

        if (liveStatus.is_active === false) {
          if (showHeroScreen || showProfileSetup || showConsent || isSetupMode.current) {
            return;
          }
          console.log("Remote deactivation detected via polling. Logging out.");
          AuthService.clearCurrentUser();
          setUserEmail(null);
          window.location.reload();
        }
      } catch (error) {
        console.error("Error checking active status in sync interval:", error);
        consecutiveFailures++;
        if (consecutiveFailures >= 3) {
          console.warn("Circuit breaker triggered: stopping sync interval polling after 3 consecutive failures.");
          clearInterval(syncInterval);
        }
      }
    }, 60000); // 60 seconds interval

    return () => {
      supabase.removeChannel(channel);
      clearInterval(syncInterval);
    };
  }, [userEmail, showHeroScreen, showProfileSetup, showConsent, loading, needsVerification]);


  // --- Event Handlers ---

  const handleVerifyComplete = () => {
    // When AI approves the ID, re-run init. It will find the new profile and route to Hero.
    initializeAuth(); 
  };

  const handleHeroComplete = () => {
    setShowHeroScreen(false);
    setShowProfileSetup(true);
    isSetupMode.current = true; 
  };

  const handleProfileSetupComplete = (updatedProfile: Profile) => {
    // 1. Mark in localStorage that this user has pending consent
    localStorage.setItem(`pending-consent-${updatedProfile.email}`, "true");
    
    // 2. Set states to show ConsentScreen
    setPendingProfile(updatedProfile);
    setShowProfileSetup(false);
    setShowConsent(true);
  };

  const handleConsentComplete = () => {
    if (pendingProfile) {
      // 1. Remove pending consent marker
      localStorage.removeItem(`pending-consent-${pendingProfile.email}`);
      
      // 2. Complete setup and save user
      setProfile(pendingProfile);
      encryptedStorage.set("current-user", JSON.stringify(pendingProfile));
      
      // Tag all future Sentry errors with this user
      setSentryUser(pendingProfile.email);
      AuthService.updateLastActive(pendingProfile.email);
    }
    
    setShowConsent(false);
    isSetupMode.current = false;
    setPendingProfile(null);

    if (typeof encryptedStorage.remove === 'function') {
        encryptedStorage.remove('active-session');
    }
  };


  // --- Strict Routing Render Logic ---

  if (showLanding) {
    return (
      <AboutScreen
        onBack={() => {
          setShowLanding(false);
        }}
      />
    );
  }

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

  // 0. Not Logged In
  if (!userEmail) return <LoginScreen />;

  // 1. Unverified -> Send to ID Upload Component
  if (needsVerification) return <Verify userEmail={userEmail} onComplete={handleVerifyComplete} />;

  // 2. Verified but Inactive -> Send to Hero Screen
  if (showHeroScreen && profile) return <HeroFuturistic onComplete={handleHeroComplete} userProfile={profile} />;
  
  // 3. Hero Done -> Profile Setup
  if (showProfileSetup && userEmail) return <ProfileSetupForm userEmail={userEmail} onComplete={handleProfileSetupComplete} initialProfile={profile} />;

  // 3b. Profile Setup Done -> Show Consent (Terms & Privacy Policy)
  if (showConsent && userEmail) return <ConsentScreen userEmail={userEmail} onComplete={handleConsentComplete} />;

  // 4. Fully Active & Setup -> Enter App
  return <>{children}</>;
}
