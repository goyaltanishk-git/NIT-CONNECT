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
      // Standard fetch - subject to RLS (Requires syncAppSession first)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();
        
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    } catch (error) {
      throw error;
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
        college: 'NIT Kurukshetra'
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
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('email', email)
        .select()
        .single();
      
      if (error) throw error;
      encryptedStorage.set('current-user', JSON.stringify(data));
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async updateLastActive(email: string): Promise<void> {
    try {
      supabase.from('profiles').update({ 
        last_active_at: new Date().toISOString() 
      }).eq('email', email).then(({ error }) => {
        if (error) console.error("Background active update failed", error);
      });
    } catch (error) {
     
    }
  }

  static getCurrentUser(): Profile | null {
    const storedUser = encryptedStorage.get('current-user');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  static clearCurrentUser(): void {
    localStorage.removeItem('current-user');
    localStorage.removeItem('active-session');
    // ✅ SAFE REMOVE CHECK
    if (typeof encryptedStorage.remove === 'function') {
      encryptedStorage.remove('current-user');
    }
  }
}