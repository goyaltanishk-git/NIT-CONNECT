import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  const fetchProfilesWithExtendedData = async (startOffset: number = 0, append: boolean = false) => {
    try {
      const userd = encryptedStorage.get('current-user');
      if (!userd) return;
      const user = JSON.parse(userd);

      const { data: interactions } = await supabase
        .from("user_interactions")
        .select("target_user_id")
        .eq("user_id", user.email);

      const { data: interactions1 } = await supabase
        .from("user_interactions")
        .select("user_id")
        .eq("target_user_id", user.email);

      const interactedIds = [
        ...(interactions1?.map(i => i.user_id) || []),
        ...(interactions?.map(i => i.target_user_id) || [])
      ];

      let query = supabase
        .from("profiles")
        .select(`
          *,
          user_photos!user_photos_user_email_fkey(photo_url, photo_order, is_primary, is_verified),
          user_interests!user_interests_user_email_fkey(interest)
        `)
        .eq("is_active", true)
        .neq("gender", user.gender)
        .neq("college", user.college) // 🌍 Never show profiles from user's own college
        .order("shuffle_order", { ascending: false });

      if (interactedIds.length > 0) {
        query = query.filter('email', 'not.in', `(${interactedIds.join(',')})`);
      }

      if (selectedColleges.length > 0) {
        query = query.eq("college", selectedColleges[0]);
      }

      query = query.range(startOffset, startOffset + PROFILES_PER_BATCH - 1);

      const { data: profilesWithData, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      if (!profilesWithData || profilesWithData.length === 0) {
        setHasMore(false);
        if (!append) setProfiles([]);
        return;
      }

      const userSeed = user.email.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      const pageProfiles = shuffleWithSeed(profilesWithData, userSeed);

      const extendedProfiles: ExtendedProfile[] = pageProfiles.map((profile: any) => {
        const photos = (profile.user_photos || []).map((photo: any, index: number) => ({
          url: photo.photo_url,
          order: photo.photo_order || index
        }));

        const interests = (profile.user_interests || []).map((interest: any) => interest.interest);

        return {
          ...profile,
          photos,
          interests,
          age: calculateAge(profile.date_of_birth),
          name: (profile.last_name && profile.last_name !== "NULL")
            ? `${profile.first_name} ${profile.last_name}`.trim()
            : profile.first_name
        };
      });

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