import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Make sure supabase is correctly imported
import { User } from '@supabase/supabase-js';
import { AuthService } from '@/lib/auth'; // Ensure AuthService is correctly imported
import { useToast } from '@/hooks/use-toast'; // Ensure Toast hook is available

// TypeScript version of the function, without JSX
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast(); // Toast for notifications

  useEffect(() => {
    let mounted = true; // Flag to track the component's mounting state

    const initializeAuth = async () => {
      try {
        // Fetch the current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          toast({
            title: 'Authentication error',
            description: 'There was an error fetching the session.',
            variant: 'destructive',
          });
          return;
        }

        // If session is available, set user state
        if (session?.user && mounted) {
          setUser(session.user);
          await AuthService.updateLastActive(session.user.id); // Update last active time
          setLoading(false);
          return;
        }

        // Fallback: Check for temp user in localStorage
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
            role: parsedUser.role || 'authenticated',
          } as User); // Set temp user from localStorage
        }

        if (mounted) {
          setLoading(false); // Stop loading if no session or temp user found
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setLoading(false); // Stop loading if error occurs
        }
      }
    };

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user); // Set user state on sign-in
          await AuthService.updateLastActive(session.user.id); // Update last active
          localStorage.removeItem('temp-user'); // Remove temp user from localStorage
        } else if (event === 'SIGNED_OUT') {
          setUser(null); // Clear user state on sign-out
          localStorage.removeItem('temp-user'); // Remove temp user from localStorage
        } else if (session?.user) {
          setUser(session.user); // Set user state if session exists
        } else {
          setUser(null); // Clear user state if no session
        }

        setLoading(false); // Stop loading once state is updated
      }
    );

    // Initialize authentication
    initializeAuth();

    // Cleanup function to unsubscribe from auth state changes on component unmount
    return () => {
      mounted = false;
      subscription.unsubscribe(); // Unsubscribe from auth state changes on cleanup
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Return the user and loading state
  return { user, loading };
};

export default useAuth;
