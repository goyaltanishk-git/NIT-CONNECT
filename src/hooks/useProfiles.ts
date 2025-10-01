import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DatabaseProfile {
  first_name: string;
  last_name: string;
  email: string; // ✅ primary key
  bio: string | null;
  year_of_study: string | null;
  branch: string | null;
  hometown: string | null;
  height: number | null;
  date_of_birth: string;
  gender: string;
  interested_in: string;
  is_verified: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
  photos?: { url: string; order: number }[];
  interests?: string[];
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<DatabaseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ Get current logged-in user from localStorage
      const currentUser = JSON.parse(localStorage.getItem("current-user") || "null");

      // ✅ Fetch profiles by email PK
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_verified", true)
        .eq("is_active", true)
        .neq("email", currentUser?.email || "none") // ✅ exclude self
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      if (profilesData) {
        // Fetch photos and interests separately for each profile
        const transformedProfiles = await Promise.all(
          profilesData.map(async (profile) => {
            // ✅ Get photos by email
            const { data: photos } = await supabase
              .from("user_photos")
              .select("photo_url, photo_order")
              .eq("email", profile.email)
              .order("photo_order");

            // ✅ Get interests by email
            const { data: interests } = await supabase
              .from("user_interests")
              .select("interest")
              .eq("email", profile.email);

            return {
              ...profile,
              photos:
                photos?.map((photo) => ({
                  url: photo.photo_url,
                  order: photo.photo_order,
                })) || [],
              interests: interests?.map((interest) => interest.interest) || [],
            };
          })
        );

        setProfiles(transformedProfiles);
      }
    } catch (error) {
      console.error("Error in fetchProfiles:", error);
      toast({
        title: "Error loading profiles",
        description: "Failed to load profiles from database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleInteraction = useCallback(
    async (
      targetEmail: string,
      interactionType: "like" | "pass" | "superlike"
    ) => {
      try {
        const currentUser = JSON.parse(localStorage.getItem("current-user") || "null");
        if (!currentUser?.email) return;

        // ✅ Record interaction
        const { error: interactionError } = await supabase
          .from("user_interactions")
          .insert({
            user_email: currentUser.email,
            target_email: targetEmail,
            interaction_type: interactionType,
          });

        if (interactionError) {
          console.error("Error recording interaction:", interactionError);
          return;
        }

        // ✅ Check for mutual like
        if (interactionType === "like" || interactionType === "superlike") {
          const { data: mutualLike } = await supabase
            .from("user_interactions")
            .select("*")
            .eq("user_email", targetEmail)
            .eq("target_email", currentUser.email)
            .in("interaction_type", ["like", "superlike"])
            .single();

          if (mutualLike) {
            const { error: matchError } = await supabase.from("matches").insert({
              user1_email: currentUser.email,
              user2_email: targetEmail,
            });

            if (!matchError) {
              toast({
                title: "It's a Match! 🎉",
                description: "You both liked each other!",
              });
            }
          }
        }

        // ✅ Update daily limits by email
        const today = new Date().toISOString().split("T")[0];
        const { data: limits } = await supabase
          .from("daily_limits")
          .select("*")
          .eq("email", currentUser.email)
          .eq("date", today)
          .single();

        if (limits) {
          await supabase
            .from("daily_limits")
            .update({
              likes_used:
                interactionType === "like"
                  ? limits.likes_used + 1
                  : limits.likes_used,
              superlikes_used:
                interactionType === "superlike"
                  ? limits.superlikes_used + 1
                  : limits.superlikes_used,
            })
            .eq("id", limits.id);
        } else {
          await supabase.from("daily_limits").insert({
            email: currentUser.email,
            date: today,
            likes_used: interactionType === "like" ? 1 : 0,
            superlikes_used: interactionType === "superlike" ? 1 : 0,
          });
        }

        return true;
      } catch (error) {
        console.error("Error handling interaction:", error);
        return false;
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    fetchProfiles,
    handleInteraction,
  };
}
