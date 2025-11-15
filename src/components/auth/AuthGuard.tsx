import { useEffect, useState } from "react";
import { AuthService, Profile } from "@/lib/auth";
import { LoginScreen } from "./LoginScreen";
import { ProfileSetupForm } from "@/components/profile/ProfileSetupform";
import { Component as HeroFuturistic } from "@/components/ui/hero-futuristic";
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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Check current user from localStorage
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && currentUser.email) {
          // valid user
          if (currentUser && mounted) {
            setUserEmail(currentUser.email);
            setProfile(currentUser);
            console.log(currentUser);

            // Check if profile setup is needed (is_active is false)
            if (currentUser.is_active === false) {
              setShowHeroScreen(true); // Show hero screen first
              setLoading(false);
              return;
            }

            // Update last_active_at immediately
            await AuthService.updateLastActive(currentUser.email);
            setLoading(false);
            return;
          }
        } else {
          localStorage.removeItem("current-user"); // cleanup bad data
        }

        // 2. Check for temp user (demo/guest mode)
        const tempUser = localStorage.getItem("temp-user");
        if (tempUser && mounted) {
          const parsedUser = JSON.parse(tempUser);
          setUserEmail(parsedUser.email);

          try {
            const userProfile = await AuthService.getOrCreateUserProfile(parsedUser.email);
            setProfile(userProfile);
            
            // Check if profile setup is needed for temp user
            if (userProfile.is_active === false) {
              setShowHeroScreen(true); // Show hero screen first
              setLoading(false);
              return;
            }
            
            await AuthService.updateLastActive(parsedUser.email);
          } catch (profileError) {
            console.warn("Could not load temp user profile:", profileError);
          }
        }

        if (mounted) setLoading(false);
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // 3. Update last active periodically
  useEffect(() => {
    if (!userEmail || showHeroScreen || showProfileSetup) return;

    const updateInterval = setInterval(async () => {
      try {
        await AuthService.updateLastActive(userEmail);
      } catch (error) {
        console.warn("Failed to update last active:", error);
      }
    }, 5 * 60 * 1000); // every 5 min

    return () => clearInterval(updateInterval);
  }, [userEmail, showHeroScreen, showProfileSetup]);

  const handleHeroComplete = () => {
    setShowHeroScreen(false);
    setShowProfileSetup(true);
  };

  const handleProfileSetupComplete = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    setShowProfileSetup(false);
    // Update localStorage with the new profile
    localStorage.setItem("current-user", JSON.stringify(updatedProfile));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        {/* Animated background particles */}
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

        {/* Background gradient overlay */}
        <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none"></div>

        <div className="text-center space-y-8 p-8 animate-fade-in">
          <div className="relative">
            {/* Custom heart loading animation */}
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
            </div>
            {/* Floating elements */}
            <Sparkles className="absolute -top-4 -right-4 w-6 h-6 text-pink-400 animate-pulse" />
            <Heart className="absolute -bottom-4 -left-4 w-5 h-5 text-purple-400 animate-bounce" />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-bold gradient-text-animated">
              Loading...
            </h3>
            <p className="text-gray-400 text-lg">Preparing your experience</p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return <LoginScreen />;
  }

  // Show hero screen first for inactive users
  if (showHeroScreen && userEmail) {
    return <HeroFuturistic onComplete={handleHeroComplete} />;
  }

  // Show profile setup form after hero screen
  if (showProfileSetup && userEmail) {
    return (
      <ProfileSetupForm 
        userEmail={userEmail} 
        onComplete={handleProfileSetupComplete}
      />
    );
  }

  // Optionally pass `profile` down via context instead of local state
  return <>{children}</>;
}