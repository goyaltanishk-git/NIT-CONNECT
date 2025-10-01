import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  email: string; // primary key

  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  interested_in?: string;
  bio?: string;
  year_of_study?: string;
  branch?: string;
  hometown?: string;
  height?: number | null;
  phone_number?: string;
  instagram_handle?: string;
  verification_status?: string;
  is_verified?: boolean;
  is_active?: boolean;
  incognito_mode?: boolean;
  hide_year_branch?: boolean;
  last_active_at?: string;
  created_at?: string;
  updated_at?: string;
}

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
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  }

  static async createNewUser(email: string, userId?: string): Promise<Profile> {
    const now = new Date().toISOString();
    const emailPrefix = email.split("@")[0];
    const parts = emailPrefix.split(".");
    const firstName = parts[0] || "User";
    const lastName = parts[1] || "Name";

    const userData: Profile = {
      email,
      first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
      date_of_birth: "2000-01-01",
      gender: "male",
      interested_in: "female",
      bio: "",
      year_of_study: "1",
      branch: "",
      hometown: "",
      height: null,
      phone_number: "",
      instagram_handle: "",
      verification_status: "pending",
      is_verified: false,
      is_active: true,
      incognito_mode: false,
      hide_year_branch: false,
      last_active_at: now,
      created_at: now,
      updated_at: now,
    };

    const { data: newUserProfile, error: createError } = await supabase
      .from("profiles")
      .insert(userData)
      .select()
      .single();

    if (createError) throw createError;

    localStorage.setItem("current-user", JSON.stringify(newUserProfile));
    localStorage.setItem("profile-backup", JSON.stringify(newUserProfile));
    return newUserProfile;
  }

  static async getOrCreateUserProfile(email: string): Promise<Profile> {
  const now = new Date().toISOString();

  // 1. Check if profile exists
  const { data: existingUser, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (existingUser) {
    // 2. Update last_active_at + updated_at
    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update({
        last_active_at: now,
        updated_at: now,
      })
      .eq("email", email)
      .select()
      .single();

    if (updateError) throw updateError;

    localStorage.setItem("current-user", JSON.stringify(updatedUser));
    localStorage.setItem("profile-backup", JSON.stringify(updatedUser));
    return updatedUser;
  }

  // 3. Insert new profile
  const { data: newUser, error: insertError } = await supabase
    .from("profiles")
    .insert({
      email,
      created_at: now,
      updated_at: now,
      last_active_at: now,
      is_active: true,
    })
    .select()
    .single();

  if (insertError || !newUser) {
    throw new Error(`Failed to create profile: ${insertError?.message}`);
  }

  localStorage.setItem("current-user", JSON.stringify(newUser));
  localStorage.setItem("profile-backup", JSON.stringify(newUser));
  return newUser;
}


  static async updateProfile(email: string, updates: Partial<Profile>): Promise<Profile> {
    const updateData = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("email", email)
      .select()
      .single();

    if (error) throw error;

    localStorage.setItem("current-user", JSON.stringify(data));
    localStorage.setItem("profile-backup", JSON.stringify(data));
    return data;
  }

  static async updateLastActive(identifier: string): Promise<void> {
    const updateData = {
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let { error } = await supabase.from("profiles").update(updateData).eq("email", identifier);

    if (error) {
      await supabase.from("profiles").update(updateData).eq("email", identifier);
    }

    const currentUser = this.getCurrentUser();
    if (currentUser && (currentUser.email === identifier)) {
      const updatedUser = { ...currentUser, ...updateData };
      localStorage.setItem("current-user", JSON.stringify(updatedUser));
    }
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
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (data) {
      localStorage.setItem("current-user", JSON.stringify(data));
      return data;
    }

    return null;
  }

  static async logout(): Promise<void> {
    
    localStorage.removeItem("current-user");
    localStorage.removeItem("temp-user");
    localStorage.removeItem("profile-backup");
    localStorage.removeItem("user-login-time");
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
