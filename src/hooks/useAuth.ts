import { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import { AuthService, Profile } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseAuthReturn {
  user: Profile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: any) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // --- CACHE LOGIC ---
  const authCacheRef = useRef<{ user: any; timestamp: number } | null>(null);
  const CACHE_TTL = 60000; // 1 minute cache for session checks

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ FIX #5: Check Memory Cache before Network Request
      const now = Date.now();
      let authUser;

      if (authCacheRef.current && (now - authCacheRef.current.timestamp) < CACHE_TTL) {
        authUser = authCacheRef.current.user;
      } else {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        authUser = supabaseUser;
        // Update cache
        authCacheRef.current = { user: authUser, timestamp: now };
      }
      
      if (authUser?.email) {
        const profile = await AuthService.getUserProfile(authUser.email);
        setUser(profile);
        return;
      }

      // Fallback to localStorage (legacy/redundant but kept for your flow)
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        return;
      }

      // Check temp user
      const tempUser = localStorage.getItem('temp-user');
      if (tempUser) {
        try {
          const parsedTempUser = JSON.parse(tempUser);
          const profile = await AuthService.getOrCreateUserProfile(parsedTempUser.email);
          setUser(profile);
          return;
        } catch (e) {
          localStorage.removeItem('temp-user');
        }
      }

      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ... rest of the hook (login, logout, updateProfile, refetch, useEffects) remains the same
  
  const login = useCallback(async (email: string, otp: string) => {
    try {
      setLoading(true);
      setError(null);
      await AuthService.verifyOtp(email, otp);
      const profile = await AuthService.getOrCreateUserProfile(email);
      setUser(profile);
      
      toast({
        title: 'Welcome!',
        description: 'Successfully logged in.',
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(() => {
    // Clear the memory cache on logout
    authCacheRef.current = null;
    
    AuthService.clearCurrentUser();
    setUser(null);
    setError(null);
    
    supabase.auth.signOut().catch(console.warn);
    
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  }, [toast]);

  const updateProfile = useCallback(async (updates: any) => {
    if (!user?.email) throw new Error('No user logged in');

    try {
      setLoading(true);
      const updatedProfile = await AuthService.updateProfile(user.email, updates);
      setUser(updatedProfile);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const refetch = useCallback(async () => {
    // Force a cache bypass for explicit refetching
    authCacheRef.current = null;
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          const profile = await AuthService.getUserProfile(session.user.email);
          setUser(profile);
          // Sync cache with new session
          authCacheRef.current = { user: session.user, timestamp: Date.now() };
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          authCacheRef.current = null;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    updateProfile,
    refetch,
  };
}