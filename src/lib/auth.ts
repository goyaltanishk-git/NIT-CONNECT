import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Type aliases from your database
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
      console.error("Error generating OTP:", error);
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
      
      if (new Date(record.expires_at) < new Date()) {
        throw new Error("OTP expired");
      }

      // Clean up used OTP
      await supabase.from("email_otps").delete().eq("id", record.id);
      return true;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw error;
    }
  }

  static async getUserProfile(email: string): Promise<Profile | null> {
    try {
      console.log("🔍 Fetching profile for email:", email);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("❌ No profile found for:", email);
          return null;
        }
        console.error("❌ Error fetching profile:", error);
        throw error;
      }

      if (data) {
        console.log("✅ Profile found:", data);
        localStorage.setItem("current-user", JSON.stringify(data));
        return data;
      }

      return null;
    } catch (error) {
      console.error("❌ Exception in getUserProfile:", error);
      throw error;
    }
  }

  static async checkUserExists(email: string): Promise<Profile | null> {
    try {
      return await this.getUserProfile(email);
    } catch (error) {
      console.error("Error checking user exists:", error);
      return null;
    }
  }

  static async createNewUser(email: string, userId?: string): Promise<Profile> {
    try {
      console.log("🆕 Creating new user for:", email);
      
      const now = new Date().toISOString();
      const emailPrefix = email.split('@')[0];
      const parts = emailPrefix.split('.');
      
      const firstName = parts[0] || 'User';
      const lastName = parts[1] || 'Name';
      
      // Generate user_id if not provided
      const generatedUserId = userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const userData: ProfileInsert = {
        user_id: generatedUserId,  // ✅ Added the required user_id field
        email: email,
        first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        date_of_birth: '2000-01-01',
        gender: 'male',
        interested_in: 'female',
        verification_status: 'pending',
        is_verified: false,
        is_active: true,
        incognito_mode: false,
        hide_year_branch: false,
        created_at: now,
        updated_at: now,
        last_active_at: now,
      };

      const { data: newUserProfile, error: createError } = await supabase
        .from('profiles')
        .insert(userData)
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating user:", createError);
        throw createError;
      }

      console.log("✅ User created successfully:", newUserProfile);
      localStorage.setItem('current-user', JSON.stringify(newUserProfile));
      return newUserProfile;
    } catch (error) {
      console.error("❌ Exception in createNewUser:", error);
      throw error;
    }
  }

  static async getOrCreateUserProfile(email: string, authUserId?: string): Promise<Profile> {
    try {
      const existingUser = await this.checkUserExists(email);
      
      if (existingUser) {
        console.log("✅ User exists, updating last active time");
        // Update last active time
        const { data: updatedUser, error } = await supabase
          .from('profiles')
          .update({ 
            last_active_at: new Date().toISOString(),
          })
          .eq('email', email)
          .select()
          .single();

        if (error) {
          console.error("❌ Error updating user:", error);
          throw error;
        }

        localStorage.setItem('current-user', JSON.stringify(updatedUser));
        return updatedUser;
      } else {
        console.log("🆕 User doesn't exist, creating new user");
        return await this.createNewUser(email, authUserId);
      }
    } catch (error) {
      console.error("❌ Error in getOrCreateUserProfile:", error);
      throw error;
    }
  }

  static async updateProfile(email: string, updates: ProfileUpdate): Promise<Profile> {
    try {
      console.log("📝 Updating profile for:", email, updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating profile:", error);
        throw error;
      }

      console.log("✅ Profile updated successfully:", data);
      localStorage.setItem('current-user', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error("❌ Exception in updateProfile:", error);
      throw error;
    }
  }

  static async updateLastActive(email: string): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('email', email);
    } catch (error) {
      console.error("Error updating last active:", error);
    }
  }

  static getCurrentUser(): Profile | null {
    try {
      const storedUser = localStorage.getItem('current-user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      return null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  static clearCurrentUser(): void {
    localStorage.removeItem('current-user');
    localStorage.removeItem('temp-user');
    localStorage.removeItem('user-profile');
  }
}