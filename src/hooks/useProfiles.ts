import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {encryptedStorage} from "@/utils/encryptedStorage"

// Interface matching your exact database schema
export interface DatabaseProfile {
  email: string; // PRIMARY KEY
  first_name: string;
  last_name: string;
  gender: string; // USER-DEFINED enum
  interested_in: string; // USER-DEFINED enum
  date_of_birth: string; // date
  bio: string | null;
  hometown: string | null;
  year_of_study: string | null;
  branch: string | null;
  height: number | null; // integer
  instagram_handle: string | null;
  phone_number: string | null;
  verification_status: string | null; // USER-DEFINED enum
  verification_document_url: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  incognito_mode: boolean | null;
  hide_year_branch: boolean | null;
  latitude: number | null; // numeric
  longitude: number | null; // numeric
  last_active_at: string | null; // timestamp with time zone
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  user_id: string; // Add this if missing from your interface
}

// Extended profile for UI with photos and interests
export interface ExtendedProfile extends DatabaseProfile {
  photos: Array<{ url: string; order: number }>;
  interests: Array<string>;
  age?: number;
  name?: string;
}

interface UseProfilesReturn {
  profiles: ExtendedProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchNextBatch: () => Promise<void>;
  hasMore: boolean;
}

const PROFILES_PER_BATCH = 10;

export function useProfiles(): UseProfilesReturn {
  const [profiles, setProfiles] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();

  // Calculate age helper
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

  const fetchProfilesWithExtendedData = async (startOffset: number = 0, append: boolean = false) => {
    try {
      const userd = encryptedStorage.get('current-user');
      const user = JSON.parse(userd);

      const { data: interactions, error: interactionError } = await supabase
        .from("user_interactions")
        .select("target_user_id")
        .eq("user_id", user.email);

      const { data: interactions1, error: interactionError1 } = await supabase
        .from("user_interactions")
        .select("user_id")
        .eq("target_user_id", user.email);

      const interactedIds1 = interactions1?.map(i => i.user_id) || [];
      const interactedIds2 = interactions?.map(i => i.target_user_id) || [];
      const interactedIds = [...interactedIds1, ...interactedIds2];

      const { data: profilesWithData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          *,
          user_photos!user_photos_user_email_fkey(photo_url, photo_order, is_primary, is_verified),
          user_interests!user_interests_user_email_fkey(interest)
        `)
        .eq("is_active", true)
        .neq("gender", user.gender)
        .order("shuffle_order", { ascending: false })
        .range(startOffset, startOffset + PROFILES_PER_BATCH - 1)
        .filter('email', 'not.in', `(${interactedIds.join(',')})`);

      if (profilesError) throw profilesError;

      if (!profilesWithData || profilesWithData.length === 0) {
        setHasMore(false);
        return;
      }

      const userSeed = user.email
        .split("")
        .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

      const pageProfiles = shuffleWithSeed(profilesWithData, userSeed);

      const extendedProfiles: ExtendedProfile[] = pageProfiles.map((profile: any) => {
        // ✅ OPTIMIZED: Apply Image Transformation to reduce egress
        const photos = (profile.user_photos || []).map((photo: any, index: number) => {
          // Change URL from /object/public/ to /render/image/public/ and add resizing params
          const optimizedUrl = photo.photo_url;

          return {
            url: optimizedUrl,
            order: photo.photo_order || index
          };
        });

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

      if (extendedProfiles.length < PROFILES_PER_BATCH) {
        setHasMore(false);
      }
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
    try {
      await fetchProfilesWithExtendedData(0, false);
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, [offset, hasMore, loading]);

  const refetch = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    error,
    refetch,
    fetchNextBatch,
    hasMore
  };
}