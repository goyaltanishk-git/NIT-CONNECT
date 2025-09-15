import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { AuthService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");

        // First check for Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ Error getting session:", error);
          toast({
            title: 'Authentication error',
            description: 'There was an error fetching the session.',
            variant: 'destructive',
          });
        }

        // If session is available, set user state
        if (session?.user && mounted) {
          console.log("✅ Found Supabase session for user:", session.user.email);
          setUser(session.user);
          await AuthService.updateLastActive(session.user.id);
          setLoading(false);
          return;
        }

        // Check AuthService current user (from localStorage)
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && mounted) {
          console.log("✅ Found AuthService current user:", currentUser.email);
          const localUser: User = {
            id: currentUser.id || currentUser.user_id || "local-" + Date.now(),
            email: currentUser.email,
            created_at: currentUser.created_at || new Date().toISOString(),
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            role: 'authenticated'
          };
          setUser(localUser);
          setLoading(false);
          return;
        }

        // Fallback: Check for temp user in localStorage
        const tempUser = localStorage.getItem('temp-user');
        if (tempUser && mounted) {
          console.log("✅ Found temp user in localStorage");
          const parsedUser = JSON.parse(tempUser);
          setUser({
            id: parsedUser.id,
            email: parsedUser.email,
            created_at: parsedUser.created_at,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            role: parsedUser.role || 'authenticated',
          } as User);
          setLoading(false);
          return;
        }

        console.log("❌ No user found in any authentication method");
        if (mounted) {
          setLoading(false);
        }

      } catch (error) {
        console.error("💥 Auth initialization error:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log("🔄 Auth state changed:", event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await AuthService.updateLastActive(session.user.id);
          localStorage.removeItem('temp-user');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('temp-user');
          localStorage.removeItem('current-user');
        } else if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }

        setLoading(false);
      }
    );

    // Initialize authentication
    initializeAuth();

    // Cleanup function
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  // Debug output
  useEffect(() => {
    console.log("👤 useAuth state:", { 
      user: user?.email || 'null', 
      userId: user?.id || 'null',
      loading 
    });
  }, [user, loading]);

  return { user, loading };
};

export default useAuth;