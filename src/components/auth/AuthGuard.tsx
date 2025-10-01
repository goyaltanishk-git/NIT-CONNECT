import { useEffect, useState } from "react";
import { AuthService, Profile } from "@/lib/auth";
import { LoginScreen } from "./LoginScreen";
import { X509Certificate } from "node:crypto";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

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

          // Update last_active_at immediately
          await AuthService.updateLastActive(currentUser.email);
          setLoading(false);
          return;
        }}
         else {
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
    if (!userEmail) return;

    const updateInterval = setInterval(async () => {
      try {
        await AuthService.updateLastActive(userEmail);
      } catch (error) {
        console.warn("Failed to update last active:", error);
      }
    }, 5 * 60 * 1000); // every 5 min

    return () => clearInterval(updateInterval);
  }, [userEmail]);

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

  // Optionally pass `profile` down via context instead of local state
  return <>{children}</>;
}