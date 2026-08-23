// src/lib/auth.ts
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { encryptedStorage } from '@/utils/encryptedStorage';

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export class AuthService {
  // --- OTP Management ---

  static async generateOtp(email: string, otp: string, expiresAt: string) {
    try {
      const { data, error } = await supabase.from("email_otps").insert({
        email,
        otp,
        expires_at: expiresAt,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async verifyOtp(email: string, otp: string) {
    try {
      // Use the Secure RPC function (Bypasses RLS)
      const { data, error } = await supabase.rpc('verify_custom_otp', {
        p_email: email,
        p_otp: otp
      });

      if (error) throw error;
      if (data === true) return true;
      
      throw new Error("Invalid or expired OTP");
    } catch (error) {
      console.error("OTP Verification Error:", error);
      throw error;
    }
  }

  // --- User Profile Management ---

  /**
   * ✅ CRITICAL FIX: Uses RPC to check existence.
   * This bypasses RLS policies that hide inactive users.
   */
  static async checkUserExists(email: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase.rpc('get_profile_by_email_unsecure', { 
        p_email: email 
      });

      if (error) {
        console.error("Error checking user existence:", error);
        return null;
      }

      // RPC returns an array (SETOF profiles)
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      return null;
    }
  }

  static async getUserProfile(email: string): Promise<Profile | null> {
    try {
      // 1. Primary: Use get_profile_by_email_unsecure RPC (SECURITY DEFINER, immune to RLS connection pool issues)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_profile_by_email_unsecure', { 
        p_email: email 
      });

      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        return rpcData[0];
      }

      // 2. Fallback: get_full_profile RPC
      const { data: fullData, error: fullError } = await (supabase as any).rpc('get_full_profile', {
        p_email: email
      });
      if (!fullError && fullData && fullData.email) {
        return fullData as Profile;
      }

      // 3. Fallback: Standard fetch with maybeSingle
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();
        
      if (error) {
        if (error.code === "PGRST116") return null;
        console.warn("[AuthService] getUserProfile direct query returned error:", error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.warn("[AuthService] getUserProfile unexpected error:", error);
      return null;
    }
  }

  /**
   * ✅ CRITICAL FIX: Removed 'user_id' from Insert object.
   * Fixes the PGRST204 error.
   */
  static async createNewUser(email: string, userId?: string): Promise<Profile> {
    try {
      const now = new Date().toISOString();
      const emailPrefix = email.split('@')[0];
      const parts = emailPrefix.split('.');
      const firstName = parts[0] || 'User';
      const lastName = parts[1] || 'Name';
      
      const domain = email.toLowerCase().trim().split('@')[1] || '';
      const domainToCollege: Record<string, string> = {
        "nitkkr.ac.in": "NIT Kurukshetra",
        "nith.ac.in": "NIT Hamirpur",
        "mnit.ac.in": "MNIT Jaipur",
        "nitjsr.ac.in": "NIT Jamshedpur",
      };
      const collegeName = domainToCollege[domain] || 'NIT Kurukshetra';

      // Parse entry year to compute graduation batch and year of study
      const prefixDigits = emailPrefix.replace(/\D/g, '');
      let entryYear = 2023; // fallback default entry year (graduation 2027)

      // 1. Look for a 4-digit year like 2023 in the prefix
      const match4 = emailPrefix.match(/20(2[0-9]|3[0-9])/);
      if (match4) {
        entryYear = parseInt(match4[0]);
      } else if (prefixDigits.length >= 8) {
        // NIT Kurukshetra style: 123103075 -> the digits at index 1 and 2 are "23"
        const entryYearShort = parseInt(prefixDigits.substring(1, 3));
        if (entryYearShort >= 20 && entryYearShort <= 35) {
          entryYear = 2000 + entryYearShort;
        }
      } else if (prefixDigits.length >= 2) {
        // e.g. 231075 -> starts with 23
        const entryYearShort = parseInt(prefixDigits.substring(0, 2));
        if (entryYearShort >= 20 && entryYearShort <= 35) {
          entryYear = 2000 + entryYearShort;
        }
      }

      // Compute B.Tech Graduation Batch
      const graduationBatch = entryYear + 4;

      // Determine year of study string as of 2026
      let yearOfStudy = "3rd Year";
      if (graduationBatch === 2026) yearOfStudy = "4th Year";
      else if (graduationBatch === 2027) yearOfStudy = "3rd Year";
      else if (graduationBatch === 2028) yearOfStudy = "2nd Year";
      else if (graduationBatch === 2029) yearOfStudy = "1st Year";
      else {
        const diff = 2026 - entryYear;
        if (diff === 1) yearOfStudy = "1st Year";
        else if (diff === 2) yearOfStudy = "2nd Year";
        else if (diff === 3) yearOfStudy = "3rd Year";
        else if (diff === 4) yearOfStudy = "4th Year";
        else if (diff > 4) yearOfStudy = "Alumni";
      }

      const userData: ProfileInsert = {
        // REMOVED: user_id field (Column does not exist in DB)
        email: email,
        first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        date_of_birth: '2000-01-01', 
        gender: 'male',
        interested_in: 'female',
        verification_status: 'pending',
        is_verified: false,
        is_active: false, // Start inactive until setup is done
        incognito_mode: false,
        hide_year_branch: false,
        created_at: now,
        updated_at: now,
        last_active_at: now,
        college: collegeName,
        graduation_batch: graduationBatch,
        year_of_study: yearOfStudy
      };

      const { data, error } = await supabase.from('profiles').insert(userData).select().single();
      
      if (error) throw error;
      
      // Store locally with needsSetup flag
      const storageData = { ...data, needsSetup: true }; 
      encryptedStorage.set('current-user', JSON.stringify(storageData));
      
      return data;
    } catch (error) {
      console.error("Create User Error:", error);
      throw error;
    }
  }

  /**
   * Main Login Logic
   * Handles Active Users, Soft-Deleted Users, and New Users
   */
  /**
   * Main Login Logic
   * Handles Active Users, Soft-Deleted Users, and Unverified Users
   */
  static async getOrCreateUserProfile(email: string, authUserId?: string): Promise<Profile | null> {
    try {
      // 1. Check if user exists using the Secure RPC (Bypasses RLS)
      const existingUser = await this.checkUserExists(email);
      
      if (existingUser) {
        // 2. SOFT DELETED/INACTIVE USER DETECTED
        if (existingUser.is_active === false) {
          console.log("Inactive user found. Initiating setup flow.");
          await this.updateLastActive(email);
          const storageData = { ...existingUser, needsSetup: true, isNewUser: false };
          encryptedStorage.set('current-user', JSON.stringify(storageData));
          return existingUser; 
        }

        // 3. Active User
        await this.updateLastActive(email);
        encryptedStorage.set('current-user', JSON.stringify(existingUser));
        return existingUser;
      } else {
        // 4. Brand New User -> Return null to trigger Verification Flow
        return null;
      }
    } catch (error) {
      throw error;
    }
  }

  static async updateProfile(email: string, updates: ProfileUpdate): Promise<Profile> {
    try {
      await syncAppSession(email).catch(() => {});
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('email', email.toLowerCase())
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        encryptedStorage.set('current-user', JSON.stringify(data));
      }
      return data as Profile;
    } catch (error) {
      throw error;
    }
  }

  static async updateLastActive(email: string): Promise<void> {
    if (!email) return;
    try {
      const lowerEmail = email.toLowerCase().trim();
      // 1. Try secure RPC first
      supabase.rpc('touch_last_active', { p_email: lowerEmail }).then(({ error }) => {
        if (error) {
          // Fallback to syncAppSession + direct update
          syncAppSession(lowerEmail).then(() => {
            supabase.from('profiles').update({ 
              last_active_at: new Date().toISOString() 
            }).eq('email', lowerEmail).catch(() => {});
          }).catch(() => {});
        }
      }).catch(() => {});
    } catch {
      // Non-critical background task
    }
  }

  static getCurrentUser(): Profile | null {
    const storedUser = encryptedStorage.get('current-user');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  static clearCurrentUser(): void {
    // 1. Clear raw localStorage keys
    localStorage.removeItem('current-user');
    localStorage.removeItem('active-session');
    localStorage.removeItem('temp-user');
    localStorage.removeItem('lastResetDate');

    // 2. Safe clear of encrypted storage keys
    if (encryptedStorage) {
      if (typeof encryptedStorage.remove === 'function') {
        encryptedStorage.remove('current-user');
        encryptedStorage.remove('active-session');
        encryptedStorage.remove('temp-user');
      }
    }

    // 3. Clear all sessionStorage to prevent any lingering session data
    try {
      sessionStorage.clear();
    } catch (e) {
      console.error("sessionStorage clear failed", e);
    }

    // 4. Reset Postgres app session and sign out of Supabase Auth
    try {
      supabase.rpc('set_app_session_user', { user_email: '' }).catch(err => {
        console.error('[clearCurrentUser] RPC set_app_session_user failed:', err);
      });
      supabase.auth.signOut().catch(() => {});
    } catch (err) {
      console.error("Supabase signout failed", err);
    }
  }
}