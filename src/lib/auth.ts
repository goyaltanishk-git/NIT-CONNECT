import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { encryptedStorage } from '@/utils/encryptedStorage';
import { string } from "three/tsl";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export class AuthService {
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
      const { data, error } = await supabase
        .from("email_otps")
        .select("*")
        .eq("email", email)
        .eq("otp", otp.trim())
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      const record = data?.[0];
      if (!record) throw new Error("Invalid OTP");
      if (new Date(record.expires_at) < new Date()) throw new Error("OTP expired");
      await supabase.from("email_otps").delete().eq("id", record.id);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getUserProfile(email: string): Promise<Profile | null> {
    try {
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

  static async checkUserExists(email: string): Promise<Profile | null> {
    try {
      return await this.getUserProfile(email);
    } catch (error) {
      return null;
    }
  }

  static async createNewUser(email: string, userId?: string): Promise<Profile> {
    try {
      const now = new Date().toISOString();
      const emailPrefix = email.split('@')[0];
      const parts = emailPrefix.split('.');
      const firstName = parts[0] || 'User';
      const lastName = parts[1] || 'Name';
      const generatedUserId = userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const userData: ProfileInsert = {
        user_id: generatedUserId,
        email: email,
        first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        date_of_birth: '2000-01-01',
        gender: 'male',
        interested_in: 'female',
        verification_status: 'pending',
        is_verified: false,
        is_active: false,
        incognito_mode: false,
        hide_year_branch: false,
        created_at: now,
        updated_at: now,
        last_active_at: now,
      
      
        
      };

      const { data, error } = await supabase.from('profiles').insert(userData).select().single();
      if (error) throw error;
      const storageData = { ...data, needsSetup: true }; 

    encryptedStorage.set('current-user', JSON.stringify(storageData));
      return data;
    } catch (error) {
      throw error;
    }
  }

  // src/lib/auth.ts -> Replace getOrCreateUserProfile method

static async getOrCreateUserProfile(email: string, authUserId?: string): Promise<Profile> {
  try {
    const existingUser = await this.checkUserExists(email);
    
    if (existingUser) {
      // If the account was deactivated (is_active is false)
      if (existingUser.is_active === false) {
        // We keep is_active as FALSE in the database so the AuthGuard forces setup
        // But we update the last_active_at to show they are trying to return
        const { data: updatedUser, error } = await supabase
          .from('profiles')
          .update({ last_active_at: new Date().toISOString() })
          .eq("email", email)
          .select()
          .single();

        if (error) throw error;

        // CRITICAL: Flag as needing setup so the Guard shows the Hero screen
        const storageData = { ...updatedUser, needsSetup: true };
        encryptedStorage.set('current-user', JSON.stringify(storageData));
        
        return updatedUser;
      }

      // Normal login for an already active user
      await this.updateLastActive(email);
      encryptedStorage.set('current-user', JSON.stringify(existingUser));
      return existingUser;
    } else {
      // Completely new user flow
      return await this.createNewUser(email, authUserId);
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
      await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('email', email);
    } catch (error) {
    }
  }

  static getCurrentUser(): Profile | null {
    const storedUser = encryptedStorage.get('current-user');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  static clearCurrentUser(): void {
    localStorage.removeItem('current-user');
    localStorage.removeItem('temp-user');
    localStorage.removeItem('user-profile');
  }
}