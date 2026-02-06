// @/hooks/useAuth.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthService, Profile } from '@/lib/auth';
import { supabase, syncAppSession } from '@/integrations/supabase/client'; // Added syncAppSession
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
  const authCacheRef = useRef<{ user: any; timestamp: number } | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const stored = encryptedStorage.get("current-user");
      if (!stored) {
        setUser(null);
        return;
      }

      const sessionData = JSON.parse(stored);
      // ✅ HANDSHAKE: Ensure session is synced on every app load
      await syncAppSession(sessionData.email);
      
      const profile = await AuthService.getUserProfile(sessionData.email);
      setUser(profile);
    } catch (err) {
      console.error("Auth fetch error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, otp: string) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verify OTP against your new table
      const { data: otpData, error: otpError } = await supabase
        .from('email_otps')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (otpError || !otpData) {
        throw new Error("Invalid or expired OTP code.");
      }

      // 2. ✅ THE HANDSHAKE: Establish identity in DB immediately
      await syncAppSession(email);

      // 3. Fetch/Create User Profile
      const profile = await AuthService.getUserProfile(email);
      
      // 4. Persist Session
      encryptedStorage.set("current-user", JSON.stringify({ email, loginDate: new Date().toISOString() }));
      setUser(profile);

      // 5. Cleanup: Delete used OTP
      await supabase.from('email_otps').delete().eq('id', otpData.id);

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
    encryptedStorage.remove("current-user");
    setUser(null);
    window.location.href = "/"; // Force refresh to clear session variables
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