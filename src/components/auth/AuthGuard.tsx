import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AuthService } from "@/lib/auth";
import { LoginScreen } from "./LoginScreen";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check for existing user in localStorage first
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && mounted) {
          // Create a user object compatible with Supabase User type
          const localUser: User = {
            id: currentUser.id || currentUser.user_id || "local-" + Date.now(),
            email: currentUser.email,
            created_at: currentUser.created_at,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            role: 'authenticated'
          };

          setUser(localUser);

          // Load user profile after setting user
          try {
            const userProfile = await AuthService.getUserProfile(currentUser.email);
            if (userProfile) {
              setProfile(userProfile);
            }
          } catch (profileError) {
            console.warn("Could not load user profile:", profileError);
          }

          await AuthService.updateLastActive(currentUser.email);
          setLoading(false);
          return;
        }

        // Check Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }

        if (session?.user && mounted) {
          setUser(session.user);

          // Sync with our profiles table and load profile
          try {
            const userProfile = await AuthService.getOrCreateUserProfile(session.user.email!, session.user.id);
            setProfile(userProfile);
            await AuthService.updateLastActive(session.user.email!);
          } catch (profileError) {
            console.error("Error loading profile after session:", profileError);
          }

          setLoading(false);
          return;
        }

        // Check for temp user (demo mode)
        const tempUser = localStorage.getItem('temp-user');
        if (tempUser && mounted) {
          const parsedUser = JSON.parse(tempUser);
          setUser({
            id: parsedUser.id,
            email: parsedUser.email,
            created_at: parsedUser.created_at,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            role: parsedUser.role || 'authenticated'
          } as User);

          // Try to load profile for temp user too
          try {
            const userProfile = await AuthService.getUserProfile(parsedUser.email);
            if (userProfile) {
              setProfile(userProfile);
            }
          } catch (profileError) {
            console.warn("Could not load temp user profile:", profileError);
          }
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);

          // Load or create user profile
          try {
            const userProfile = await AuthService.getOrCreateUserProfile(session.user.email!, session.user.id);
            setProfile(userProfile);
            await AuthService.updateLastActive(session.user.email!);
          } catch (profileError) {
            console.error("Error handling profile on sign in:", profileError);
          }

          localStorage.removeItem('temp-user');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('temp-user');
          localStorage.removeItem('current-user');
        } else if (session?.user) {
          setUser(session.user);

          // Load profile for existing session
          try {
            const userProfile = await AuthService.getUserProfile(session.user.email!);
            if (userProfile) {
              setProfile(userProfile);
            }
          } catch (profileError) {
            console.warn("Could not load profile for existing session:", profileError);
          }
        } else {
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Update last active periodically
  useEffect(() => {
    if (!user?.email) return;

    const updateInterval = setInterval(async () => {
      try {
        await AuthService.updateLastActive(user.email!);
      } catch (error) {
        console.warn("Failed to update last active:", error);
      }
    }, 5 * 60 * 1000); // Update every 5 minutes

    return () => clearInterval(updateInterval);
  }, [user?.email]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Pass both user and profile to children through context or props
  return <>{children}</>;
}