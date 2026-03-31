import { X, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function CommunityDetailsModal({ community, onClose }: any) {
  const [memberCount, setMemberCount] = useState(0);
  const [moderatorName, setModeratorName] = useState("");
  const [moderatorImage, setModeratorImage] = useState("");
  

  
   useEffect(() => {
  const fetchDetails = async () => {
    try {
      const { data, error } = await supabase.rpc("get_community_details", {
        p_community_id: community.id,
      })as { data: any, error: any };

      if (error) throw error;
      if (!data) return;

      const result = Array.isArray(data) ? data[0] : data;
      setMemberCount(result?.member_count || 0);
      setModeratorName(result?.moderator_name || "");
      setModeratorImage(result?.moderator_image || "");
    } catch (err) {
      console.error("Error fetching community details:", err);
    }
  };

  if (community?.id) {
    fetchDetails();
  }
}, [community.id]); // Only runs when community.id changes

   

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="w-full max-w-md h-full bg-black text-white relative overflow-y-auto">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-pink-500/20 p-2 rounded-full"
        >
          <X className="h-5 w-5 text-pink-400" />
        </button>

        {/* IMAGE */}
        <img
          src={community.image_url || "/placeholder.png"}
          className="w-full h-[300px] object-cover"
        />

        <div className="p-4 space-y-4">

          {/* NAME */}
          <h2 className="text-2xl font-bold text-pink-500">
            {community.name}
          </h2>

          {/* DESCRIPTION */}
          <div className="bg-white/5 p-3 rounded-xl">
            <p className="text-gray-400 text-sm">Description</p>
            <p>{community.description}</p>
          </div>

          {/* MEMBERS */}
          <div className="bg-white/5 p-3 rounded-xl flex items-center gap-2">
            <Users className="h-4 w-4 text-pink-400" />
            <span>{memberCount} members</span>
          </div>

          {/* MODERATOR */}
          <div className="bg-white/5 p-3 rounded-xl flex items-center gap-3">
            
            {moderatorImage ? (
              <img
                src={moderatorImage}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                {moderatorName?.[0]?.toUpperCase()}
              </div>
            )}

            <div>
              <p className="text-gray-400 text-sm">Moderator</p>
              <p>{moderatorName || "Loading..."}</p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}