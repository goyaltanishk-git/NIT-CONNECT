// @/hooks/useProfiles.ts
import { useState, useEffect, useCallback } from "react";
import { supabase, syncAppSession } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { encryptedStorage } from "@/utils/encryptedStorage"

export interface DatabaseProfile {
  email: string;
  first_name: string;
  last_name: string;
  gender: string;
  interested_in: string;
  date_of_birth: string;
  bio: string | null;
  hometown: string | null;
  year_of_study: string | null;
  branch: string | null;
  height: number | null;
  instagram_handle: string | null;
  phone_number: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  incognito_mode: boolean | null;
  hide_year_branch: boolean | null;
  college: string;
}

export interface ExtendedProfile extends DatabaseProfile {
  photos: Array<{ url: string; order: number }>;
  interests: Array<string>;
  age: number;
}

const PROFILES_PER_BATCH = 10;

export function useProfiles() {
  const [profiles, setProfiles] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchProfilesWithExtendedData = async (currentOffset: number, append: boolean) => {
  try {
    const stored = encryptedStorage.get("current-user");
    if (!stored) return;
    const currentUser = JSON.parse(stored);

    await syncAppSession(currentUser.email);

    // ✅ STEP 1: Get ALL interactions related to you
    // We fetch people you swiped OR people who swiped on you
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('user_id, target_user_id')
      .or(`user_id.eq.${currentUser.email},target_user_id.eq.${currentUser.email}`);

    // Combine both columns into one list of "hidden" emails
    const hiddenEmails = new Set<string>();
    interactions?.forEach(inter => {
      hiddenEmails.add(inter.user_id);
      hiddenEmails.add(inter.target_user_id);
    });

    // ✅ STEP 2: Query Discovery Profiles
    let query = supabase
      .from('profiles')
      .select(`*, user_photos(photo_url, photo_order), user_interests(interest)`)
      .neq('email', currentUser.email)
      .eq('is_active', true)
      .eq('gender', currentUser.interested_in)
      .eq('college', currentUser.college);

    // Hide everyone in our interaction list
    if (hiddenEmails.size > 0) {
      query = query.not('email', 'in', `(${Array.from(hiddenEmails).join(',')})`);
    }

    const { data, error } = await query.range(currentOffset, currentOffset + 9);
    if (error) throw error;

    // ... formatting logic (.map) ...

      // 4. Format the data for the UI
      const formatted: ExtendedProfile[] = (data || []).map(p => {
        const birthDate = new Date(p.date_of_birth);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        
        return {
          ...p,
          photos: (p.user_photos || []).map((ph: any) => ({ 
            url: ph.photo_url, 
            order: ph.photo_order 
          })),
          interests: (p.user_interests || []).map((i: any) => i.interest),
          age
        };
      });

      setProfiles(prev => append ? [...prev, ...formatted] : formatted);
      setHasMore(formatted.length === PROFILES_PER_BATCH);
    } catch (err: any) {
      console.error('Discovery fetch error:', err);
      setError(err.message);
    }
  };

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    await fetchProfilesWithExtendedData(0, false);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { 
    profiles, 
    loading, 
    error, 
    hasMore, 
    refetch: fetchProfiles 
  };
}