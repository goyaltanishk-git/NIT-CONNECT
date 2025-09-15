import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Interface matching your exact database schema
export interface DatabaseProfile {
  email: string;                        // PRIMARY KEY
  first_name: string;
  last_name: string;
  gender: string;                       // USER-DEFINED enum
  interested_in: string;                // USER-DEFINED enum
  date_of_birth: string;                // date
  bio: string | null;
  hometown: string | null;
  year_of_study: string | null;
  branch: string | null;
  height: number | null;                // integer
  instagram_handle: string | null;
  phone_number: string | null;
  verification_status: string | null;   // USER-DEFINED enum
  verification_document_url: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  incognito_mode: boolean | null;
  hide_year_branch: boolean | null;
  latitude: number | null;              // numeric
  longitude: number | null;             // numeric
  last_active_at: string | null;        // timestamp with time zone
  created_at: string | null;            // timestamp with time zone
  updated_at: string | null;            // timestamp with time zone
  // Additional fields for UI
  photos?: Array<{ url: string; order: number }>;
  interests?: Array<string>;
  
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<DatabaseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 Starting to fetch profiles...");

      // Get current user first
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData?.user;
      console.log("👤 Current user from Supabase:", currentUser?.email);

      // Also check for local user
      const tempUser = localStorage.getItem('temp-user');
      const storedUser = localStorage.getItem('current-user');
      console.log("📱 Local storage - temp-user:", !!tempUser, "current-user:", !!storedUser);

      // Get current user email for exclusion
      let currentUserEmail = currentUser?.email;
      
      // If no Supabase user, check localStorage
      if (!currentUserEmail) {
        if (tempUser) {
          try {
            const parsedTempUser = JSON.parse(tempUser);
            currentUserEmail = parsedTempUser.email;
          } catch (e) {
            console.warn("Error parsing temp user:", e);
          }
        } else if (storedUser) {
          try {
            const parsedCurrentUser = JSON.parse(storedUser);
            currentUserEmail = parsedCurrentUser.email;
          } catch (e) {
            console.warn("Error parsing current user:", e);
          }
        }
      }

      console.log("📧 Current user email for exclusion:", currentUserEmail);

      // First, let's see ALL profiles in the database
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select(`
          email,
          first_name,
          last_name,
          gender,
          interested_in,
          date_of_birth,
          bio,
          hometown,
          year_of_study,
          branch,
          height,
          instagram_handle,
          phone_number,
          verification_status,
          verification_document_url,
          is_verified,
          is_active,
          incognito_mode,
          hide_year_branch,
          latitude,
          longitude,
          last_active_at,
          created_at,
          updated_at
        `);

      console.log("📊 All profiles in database:", allProfiles?.length || 0);
      if (allProfiles && allProfiles.length > 0) {
        console.log("📋 Sample profiles:", allProfiles.slice(0, 3).map((profile: any) => ({
          name: `${profile.first_name} ${profile.last_name}`,
          email: profile.email,
          verified: profile.is_verified,
          active: profile.is_active,
          gender: profile.gender,
          interested_in: profile.interested_in
        })));
      }

      if (allProfilesError) {
        console.error("❌ Error fetching all profiles:", allProfilesError);
        return;
      }

      // Now fetch profiles with exclusion filter
      let query = supabase
        .from('profiles')
        .select(`
          email,
          first_name,
          last_name,
          gender,
          interested_in,
          date_of_birth,
          bio,
          hometown,
          year_of_study,
          branch,
          height,
          instagram_handle,
          phone_number,
          verification_status,
          verification_document_url,
          is_verified,
          is_active,
          incognito_mode,
          hide_year_branch,
          latitude,
          longitude,
          last_active_at,
          created_at,
          updated_at
        `);

      // Only exclude current user email if we have one
      if (currentUserEmail) {
        query = query.neq('email', currentUserEmail);
        console.log("🚫 Excluding current user email:", currentUserEmail);
      } else {
        console.log("⚠️ No current user email to exclude");
      }

      const { data: profilesData, error: profilesError } = await query
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        toast({
          title: "Error loading profiles",
          description: profilesError.message,
          variant: "destructive"
        });
        return;
      }

      console.log("✅ Fetched profiles after filtering:", profilesData?.length || 0);

      if (profilesData && profilesData.length > 0) {
        // Process each profile and get additional data
        const processedProfiles: DatabaseProfile[] = [];
        
        for (const profile of profilesData) {
          console.log(`🔄 Processing profile: ${profile.first_name} ${profile.last_name} (${profile.email})`);

          // Get photos if user_photos table exists
          let photos: Array<{ url: string; order: number }> = [];
          try {
            interface PhotoRecord {
  photo_url: string;
  photo_order: number;
  is_primary: boolean;
  is_verified: boolean;
}
            // Try to fetch photos - this might fail if table doesn't exist yet
            const photosResponse = await supabase
              .from('user_photos')
              .select('photo_url, photo_order, is_primary, is_verified')
              .eq('user_email', profile.email)
              .order('photo_order');
 
            
            if (photosResponse.data && !photosResponse.error) {
              photos = photosResponse.data.map((photo: any) => ({ 
                url: photo.photo_url, 
                order: photo.photo_order 
              }));
            } else if (photosResponse.error) {
              console.warn(`⚠️ Photos table might not exist or error fetching photos for ${profile.email}:`, photosResponse.error.message);
            }
          } catch (photosError) {
            console.warn(`⚠️ Error fetching photos for ${profile.email}:`, photosError);
          }

          // Get interests if user_interests table exists
          let interests: Array<string> = [];
          try {
            // Try to fetch interests - this might fail if table doesn't exist yet
            const { data: interestsData, error: interestsError } = await supabase
              .from('user_interests')
              .select('interest')
              .eq('user_email', profile.email);  // Assuming you updated this to user_email
            
            if (interestsData && !interestsError) {
              interests = interestsData.map((interest: any) => interest.interest);
            } else if (interestsError) {
              console.warn(`⚠️ Interests table might not exist or error fetching interests for ${profile.email}:`, interestsError.message);
            }
          } catch (interestsError) {
            console.warn(`⚠️ Error fetching interests for ${profile.email}:`, interestsError);
          }

          // Create the profile object matching your schema
          const processedProfile: DatabaseProfile = {
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            gender: profile.gender,
            interested_in: profile.interested_in,
            date_of_birth: profile.date_of_birth,
            bio: profile.bio,
            hometown: profile.hometown,
            year_of_study: profile.year_of_study,
            branch: profile.branch,
            height: profile.height,
            instagram_handle: profile.instagram_handle,
            phone_number: profile.phone_number,
            verification_status: profile.verification_status,
            verification_document_url: profile.verification_document_url,
            is_verified: profile.is_verified,
            is_active: profile.is_active,
            incognito_mode: profile.incognito_mode,
            hide_year_branch: profile.hide_year_branch,
            latitude: profile.latitude,
            longitude: profile.longitude,
            last_active_at: profile.last_active_at,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            photos,
            interests
          };

          processedProfiles.push(processedProfile);
        }

        console.log("🎯 Final transformed profiles:", processedProfiles.length);
        console.log("📝 Profile names:", processedProfiles.map(p => `${p.first_name} ${p.last_name} (${p.email})`));
        
        setProfiles(processedProfiles);
      } else {
        console.log("📭 No profiles found after filtering");
        setProfiles([]);
      }

    } catch (error) {
      console.error('💥 Error in fetchProfiles:', error);
      toast({
        title: "Error loading profiles",
        description: "Failed to load profiles from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleInteraction = useCallback(async (
    targetUserEmail: string,
    interactionType: 'like' | 'pass' | 'superlike'
  ): Promise<boolean> => {
    try {
      // Get current user email
      const { data: authData } = await supabase.auth.getUser();
      let currentUserEmail = authData?.user?.email;

      // If no Supabase user, check localStorage
      if (!currentUserEmail) {
        const tempUser = localStorage.getItem('temp-user');
        const storedUser = localStorage.getItem('current-user');
        
        if (tempUser) {
          try {
            const parsedTempUser = JSON.parse(tempUser);
            currentUserEmail = parsedTempUser.email;
          } catch (e) {
            console.warn("Error parsing temp user:", e);
          }
        } else if (storedUser) {
          try {
            const parsedCurrentUser = JSON.parse(storedUser);
            currentUserEmail = parsedCurrentUser.email;
          } catch (e) {
            console.warn("Error parsing current user:", e);
          }
        }
      }

      if (!currentUserEmail) {
        console.log("❌ No current user email found for interaction");
        return false;
      }

      console.log(`💫 Recording ${interactionType} interaction between ${currentUserEmail} and ${targetUserEmail}`);

      // For now, just return true to test profile display
      // We can implement interactions later once profiles are showing
      toast({
        title: `${interactionType} recorded!`,
        description: `Action on profile: ${targetUserEmail}`,
      });

      return true;
    } catch (error) {
      console.error('💥 Error handling interaction:', error);
      return false;
    }
  }, [toast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    fetchProfiles,
    handleInteraction
  };
}