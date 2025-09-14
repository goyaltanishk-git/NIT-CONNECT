import { supabase } from "@/integrations/supabase/client";
// 1. Import the Database type from your generated types file
import type { Database } from "@/integrations/supabase/types";

// 2. Create type aliases from the official Database type for easier use
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export class AuthService {
  static async generateOtp(email: string, otp: string, expiresAt: string) {
    const { data, error } = await supabase.from("email_otps").insert({
      email,
      otp,
      expires_at: expiresAt,
    });

    if (error) throw error;
    return data;
  }

  static async verifyOtp(email: string, otp: string) {
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

    await supabase.from("email_otps").delete().eq("id", record.id);
    return true;
  }

  static async checkUserExists(email: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .limit(1) // Added to prevent 406 error on duplicates
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  static async createNewUser(email: string, authUserId?: string): Promise<Profile> {
    const emailPrefix = email.split("@")[0];
    const parts = emailPrefix.split(".");
    const firstName = parts[0] || "User";
    const lastName = parts[1] || "Name";

    // 3. Use the ProfileInsert type for creating new user data
    // This ensures all required fields are present and correctly typed
    const userData: ProfileInsert = {
      user_id: authUserId,
      email: email,
      first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
      date_of_birth: "2000-01-01",
      gender: "male",
      interested_in: "female",
      verification_status: "pending",
    };

    const { data: newUserProfile, error: createError } = await supabase
      .from("profiles")
      .insert(userData)
      .select()
      .single();

    if (createError) throw createError;

    localStorage.setItem("current-user", JSON.stringify(newUserProfile));
    return newUserProfile;
  }

  static async getOrCreateUserProfile(email: string, authUserId?: string): Promise<Profile>{
    const existingUser = await this.checkUserExists(email);

    if (existingUser) {
        // Just update last active time and ensure user_id is synced
        const { data: updatedUser, error } = await supabase
            .from("profiles")
            .update({ 
                last_active_at: new Date().toISOString(),
                user_id: authUserId 
            })
            .eq("email", email)
            .select()
            .single();
        
        if (error) throw error;

        localStorage.setItem("current-user", JSON.stringify(updatedUser));
        return updatedUser;
    } else {
      return await this.createNewUser(email, authUserId);
    }
  }

  static async updateProfile(email: string, updates: ProfileUpdate): Promise<Profile> {
    // 4. Use the ProfileUpdate type for the 'updates' parameter
    const updateData: ProfileUpdate = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("email", email)
      .select()
      .single();

    if (error) throw error;
    
    localStorage.setItem("current-user", JSON.stringify(data));
    return data;
  }
  
  static async updateLastActive(identifier: string): Promise<void> {
    await supabase
        .from("profiles")
        .update({ last_active_at: new Date().toISOString() })
        .eq("user_id", identifier);
  }

  static getCurrentUser(): Profile | null {
    const raw = localStorage.getItem("current-user");
    return raw ? (JSON.parse(raw) as Profile) : null;
  }

  static async getUserProfile(email: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();
      
    if (error && error.code !== "PGRST116") throw error;
    if (data) {
      localStorage.setItem("current-user", JSON.stringify(data));
      return data;
    }
    return null;
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.clear();
  }
  static async getAllProfiles(limit = 50): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .order("last_active_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async searchProfiles(searchTerm: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,branch.ilike.%${searchTerm}%`
      )
      .order("last_active_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  static validateProfileData(profileData: Partial<Profile>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!profileData.email) {
      errors.push("Email is required");
    } else if (!profileData.email.endsWith("@nitkkr.ac.in")) {
      errors.push("Email must be from NIT Kurukshetra (@nitkkr.ac.in)");
    }

    if (!profileData.first_name?.trim()) errors.push("First name is required");
    if (!profileData.last_name?.trim()) errors.push("Last name is required");

    if (profileData.height && (profileData.height < 100 || profileData.height > 250)) {
      errors.push("Height must be between 100 and 250 cm");
    }

    return { isValid: errors.length === 0, errors };
  }

  static backupProfileData(): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      localStorage.setItem("profile-backup", JSON.stringify(currentUser));
      localStorage.setItem("backup-timestamp", new Date().toISOString());
    }
  }

  static restoreProfileFromBackup(): Profile | null {
    const backup = localStorage.getItem("profile-backup");
    return backup ? (JSON.parse(backup) as Profile) : null;
  }
}
