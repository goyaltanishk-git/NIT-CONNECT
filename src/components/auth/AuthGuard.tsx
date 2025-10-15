import { useEffect, useState } from "react";
import { AuthService, Profile } from "@/lib/auth";
import { LoginScreen } from "./LoginScreen";
import { ProfileSetupForm } from "@/components/profile/ProfileSetupform";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
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
              setShowProfileSetup(true);
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
              setShowProfileSetup(true);
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
    if (!userEmail || showProfileSetup) return;

    const updateInterval = setInterval(async () => {
      try {
        await AuthService.updateLastActive(userEmail);
      } catch (error) {
        console.warn("Failed to update last active:", error);
      }
    }, 5 * 60 * 1000); // every 5 min

    return () => clearInterval(updateInterval);
  }, [userEmail, showProfileSetup]);

  const handleProfileSetupComplete = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    setShowProfileSetup(false);
    // Update localStorage with the new profile
    localStorage.setItem("current-user", JSON.stringify(updatedProfile));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!userEmail) {
    return <LoginScreen />;
  }

  // Show profile setup form if user is not active
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