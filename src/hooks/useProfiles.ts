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
  interests: Array<string>; // ✅ Fixed: Added proper type
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

  const fetchProfilesWithExtendedData = async (startOffset: number = 0, append: boolean = false) => {
    try {
      const userd = encryptedStorage.get('current-user');
      const user = JSON.parse(userd);

      // Step 1: Fetch base profiles from the main profiles table
      const { data: interactions, error: interactionError } = await supabase
        .from("user_interactions")
        .select("target_user_id")
        .eq("user_id", user.email);

       const { data: interactions1, error: interactionError1 } = await supabase
        .from("user_interactions")
        .select("user_id")
        .eq("target_user_id", user.email);

      if (interactionError) {
      }
      
      const interactedIds1 = interactions1?.map(i => i.user_id) || [];
      const interactedIds2 = interactions?.map(i => i.target_user_id) || [];
      const interactedIds=[...interactedIds1,...interactedIds2];
      

      // 2️⃣ Fetch only unseen profiles
      const {data:baseProfiles} = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .neq("gender",user.gender)
        .order("shuffle_order", { ascending: false })
        .range(startOffset, startOffset + PROFILES_PER_BATCH - 1)
        .filter('email', 'not.in', `(${interactedIds.join(',')})`);

      // 3️⃣ Only exclude interacted profiles if there are any
      if (!baseProfiles || baseProfiles.length === 0) {
        setHasMore(false);
        return;
      }


      // Step 2: Enhance each profile with photos and interests
      const extendedProfiles: ExtendedProfile[] = await Promise.all(
        baseProfiles.map(async (profile: DatabaseProfile) => {

          // Get photos if user_photos table exists
          let photos: Array<{ url: string; order: number }> = [];
          try {
            const photosResponse = await supabase
              .from('user_photos')
              .select('photo_url, photo_order, is_primary, is_verified')
              .eq('user_email', profile.email) // ✅ Fixed: Use email directly
              .order('photo_order');

            if (photosResponse.data && !photosResponse.error) {
              photos = photosResponse.data.map((photo: any) => ({
                url: photo.photo_url,
                order: photo.photo_order
              }));
            } else if (photosResponse.error) {
            }
          } catch (photosError) {
          }

          // Get interests - FIXED TABLE NAME
          let interests: Array<string> = [];
          try {
            const { data: interestsData, error: interestsError } = await supabase
              .from('user_interests') // ✅ CHANGED from 'user_interests' to 'interests'
              .select('interest')
              .eq('user_email', profile.email); // ✅ Fixed: Use email directly

            if (interestsData && !interestsError) {
              interests = interestsData.map((interest: any) => interest.interest);
            } else if (interestsError) {
            }
          } catch (interestsError) {
          }

          // Create extended profile
          const extendedProfile: ExtendedProfile = {
            ...profile,
            photos,
            interests,
            age: calculateAge(profile.date_of_birth),
            name: `${profile.first_name} ${profile.last_name}`.trim()
          };

          return extendedProfile;
        })
      );


      // Step 3: Update state
      if (append) {
        setProfiles(prev => [...prev, ...extendedProfiles]);
      } else {
        setProfiles(extendedProfiles);
      }

      // Update pagination
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