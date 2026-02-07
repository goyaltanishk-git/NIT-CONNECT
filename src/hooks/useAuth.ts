// @/hooks/useAuth.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthService, Profile } from '@/lib/auth';
import { syncAppSession } from '@/integrations/supabase/client'; 
import { useToast } from '@/hooks/use-toast';
import { encryptedStorage } from '@/utils/encryptedStorage';

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
      setLoading(true);
      const stored = encryptedStorage.get("current-user");
      if (!stored) {
        setUser(null);
        return;
      }

      const sessionData = JSON.parse(stored);
      // ✅ Sync session on load
      await syncAppSession(sessionData.email);
      
      const profile = await AuthService.getUserProfile(sessionData.email);
      setUser(profile);
    } catch (err) {
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, otp: string) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verify OTP using RPC (Bypasses RLS)
      const verified = await AuthService.verifyOtp(email, otp);
      if (!verified) throw new Error("Invalid or expired OTP code.");

      // 2. Sync Session
      await syncAppSession(email);

      // 3. Get Profile (via AuthService logic which handles soft-deletes)
      const profile = await AuthService.getOrCreateUserProfile(email);
      
      // 4. Persist
      encryptedStorage.set("current-user", JSON.stringify(profile));
      setUser(profile);

      toast({ title: "Login Successful", description: `Welcome back, ${profile?.first_name || 'User'}!` });
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    // ✅ Fixes crash by using safe AuthService clear method
    AuthService.clearCurrentUser();
    setUser(null);
    window.location.href = "/";
  }, []);

  const updateProfile = async (updates: any) => {
    if (!user?.email) return;
    try {
      setLoading(true);
      await syncAppSession(user.email);
      const updatedProfile = await AuthService.updateProfile(user.email, updates);
      setUser(updatedProfile);
      toast({ title: "Profile Updated" });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    updateProfile,
    refetch: fetchCurrentUser
  };
}