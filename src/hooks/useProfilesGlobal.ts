import { useState, useEffect, useCallback } from "react";
import { supabase, syncAppSession } from "@/integrations/supabase/client"; // ✅ Added syncAppSession
import { useToast } from "@/hooks/use-toast";
import { encryptedStorage } from "@/utils/encryptedStorage";

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
  verification_status: string | null;
  verification_document_url: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  incognito_mode: boolean | null;
  hide_year_branch: boolean | null;
  latitude: number | null;
  longitude: number | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  college: string; 
}

export interface ExtendedProfile extends DatabaseProfile {
  photos: Array<{ url: string; order: number }>;
  interests: Array<string>;
  age?: number;
  name?: string;
}

interface UseProfilesGlobalReturn {
  profiles: ExtendedProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchNextBatch: () => Promise<void>;
  hasMore: boolean;
  availableColleges: string[];
}

const PROFILES_PER_BATCH = 10;

export function useProfilesGlobal(selectedColleges: string[] = []): UseProfilesGlobalReturn {
  const [profiles, setProfiles] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [availableColleges, setAvailableColleges] = useState<string[]>([]);
  const { toast } = useToast();

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  function seededRandom(seed: number) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  function shuffleWithSeed<T>(array: T[], seed: number): T[] {
    const rand = seededRandom(seed);
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  const fetchAvailableColleges = useCallback(async () => {
    try {
      const userd = encryptedStorage.get('current-user');
      if (!userd) return;
      const user = JSON.parse(userd);

      const { data: colleges, error: collegesError } = await supabase
        .from("profiles")
        .select("college")
        .neq("college", user.college) // 🌍 Exclude own college from available list
        .eq("is_active", true);

      if (collegesError) throw collegesError;

      const uniqueColleges = [...new Set(colleges?.map(c => c.college) || [])];
      setAvailableColleges(uniqueColleges.sort());
    } catch (err) {
      console.error("Error fetching colleges:", err);
    }
  }, []);

  // Inside @/hooks/useProfilesGlobal.ts

const fetchProfilesWithExtendedData = async (currentOffset: number, append: boolean) => {
  try {
    const stored = encryptedStorage.get("current-user");
    if (!stored) return;
    
    // currentUserData contains email, interested_in, and their own college
    const currentUser = JSON.parse(stored);

    // 1. ✅ THE HANDSHAKE: Establish identity for RLS to prevent 401/406 errors
    await syncAppSession(currentUser.email);

    // 2. Get the list of people the user has already swiped on to exclude them
    const { data: swipedData } = await supabase
      .from('user_interactions')
    .select('user_id, target_user_id')
      .or(`user_id.eq.${currentUser.email},target_user_id.eq.${currentUser.email}`);
    
    const swipedEmails = swipedData?.map(s => s.target_user_id) || [];

    const hiddenEmails = new Set<string>();
    swipedData?.forEach(i => {
      hiddenEmails.add(i.user_id);
      hiddenEmails.add(i.target_user_id);
    });
    // 3. Build the Discovery Query using Joins for Photos and Interests
    let query = supabase
      .from('profiles')
      .select(`
        *,
        user_photos(photo_url, photo_order),
        user_interests(interest)
      `)
      .neq('email', currentUser.email)      // Don't show the user themselves
      .eq('is_active', true)                 // Only active users
      .eq('gender', currentUser.interested_in); // Match gender preference

      if (hiddenEmails.size > 0) {
      query = query.not('email', 'in', `(${Array.from(hiddenEmails).join(',')})`);
    }
    // 4. ✅ COLLEGE FILTER: Global logic
    // If specific colleges are selected via the UI, filter by them.
    // Otherwise, show everyone (Global mode).
    if (selectedColleges && selectedColleges.length > 0) {
      query = query.in('college', selectedColleges);
    }

    // 5. Exclude people already swiped
    if (swipedEmails.length > 0) {
      query = query.not('email', 'in', `(${swipedEmails.join(',')})`);
    }

    // 6. Execute fetch with pagination
    const { data, error: fetchError } = await query
      .range(currentOffset, currentOffset + PROFILES_PER_BATCH - 1);

    if (fetchError) throw fetchError;

    // 7. Format the data for the UI
    const extendedProfiles: ExtendedProfile[] = (data || []).map(profile => {
      // Calculate age
      const today = new Date();
      const birthDate = new Date(profile.date_of_birth);
      let age = today.getFullYear() - birthDate.getFullYear();
      if (today.getMonth() < birthDate.getMonth() || 
         (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return {
        ...profile,
        // Map joined data to the expected UI format
        photos: (profile.user_photos || [])
          .sort((a: any, b: any) => (a.photo_order || 0) - (b.photo_order || 0))
          .map((p: any) => ({ url: p.photo_url, order: p.photo_order })),
        interests: (profile.user_interests || []).map((i: any) => i.interest),
        age,
        name: profile.first_name
      };
    });

    // 8. Update State
    if (append) {
      setProfiles(prev => [...prev, ...extendedProfiles]);
    } else {
      setProfiles(extendedProfiles);
    }

    setHasMore(extendedProfiles.length === PROFILES_PER_BATCH);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profiles';
    setError(errorMessage);
    toast({
      title: 'Error Loading Profiles',
      description: errorMessage,
      variant: 'destructive',
    });
  }
};

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOffset(0);
    setHasMore(true);
    try {
      await fetchProfilesWithExtendedData(0, false);
    } finally {
      setLoading(false);
    }
  }, [selectedColleges]);

  const fetchNextBatch = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const nextOffset = offset + PROFILES_PER_BATCH;
      await fetchProfilesWithExtendedData(nextOffset, true);
      setOffset(nextOffset);
    } finally {
      setLoading(false);
    }
  }, [offset, hasMore, loading, selectedColleges]);

  const refetch = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    fetchAvailableColleges();
  }, [fetchAvailableColleges]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, loading, error, refetch, fetchNextBatch, hasMore, availableColleges };
}