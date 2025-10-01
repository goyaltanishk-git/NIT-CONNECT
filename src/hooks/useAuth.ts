import { useState, useEffect, useCallback } from 'react';
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

  const fetchCurrentUser = useCallback(async () => {
    try {
      console.log('🔄 Fetching current user...');
      setLoading(true);
      setError(null);

      // Try to get from Supabase auth first
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser?.email) {
        console.log('✅ Found auth user:', authUser.email);
        const profile = await AuthService.getUserProfile(authUser.email);
        setUser(profile);
        return;
      }

      // Fallback to localStorage
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        console.log('✅ Found user in localStorage:', currentUser.email);
        setUser(currentUser);
        return;
      }

      // Check temp user
      const tempUser = localStorage.getItem('temp-user');
      if (tempUser) {
        try {
          const parsedTempUser = JSON.parse(tempUser);
          console.log('✅ Found temp user:', parsedTempUser.email);
          const profile = await AuthService.getOrCreateUserProfile(parsedTempUser.email);
          setUser(profile);
          return;
        } catch (e) {
          console.warn('Error parsing temp user:', e);
          localStorage.removeItem('temp-user');
        }
      }

      console.log('❌ No user found');
      setUser(null);
    } catch (err) {
      console.error('❌ Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, otp: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Attempting login for:', email);
      
      // Verify OTP
      await AuthService.verifyOtp(email, otp);
      
      // Get or create user profile
      const profile = await AuthService.getOrCreateUserProfile(email);
      
      setUser(profile);
      
      console.log('✅ Login successful');
      toast({
        title: 'Welcome!',
        description: 'Successfully logged in.',
      });
      
    } catch (err) {
      console.error('❌ Login error:', err);
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
    console.log('🔓 Logging out...');
    AuthService.clearCurrentUser();
    setUser(null);
    setError(null);
    
    // Also clear Supabase auth session if exists
    supabase.auth.signOut().catch(console.warn);
    
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  }, [toast]);

  const updateProfile = useCallback(async (updates: any) => {
    if (!user?.email) {
      throw new Error('No user logged in');
    }

    try {
      setLoading(true);
      
      console.log('📝 Updating profile:', updates);
      
      const updatedProfile = await AuthService.updateProfile(user.email, updates);
      setUser(updatedProfile);
      
      console.log('✅ Profile updated');
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
      
    } catch (err) {
      console.error('❌ Update profile error:', err);
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
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user?.email) {
          const profile = await AuthService.getUserProfile(session.user.email);
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
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