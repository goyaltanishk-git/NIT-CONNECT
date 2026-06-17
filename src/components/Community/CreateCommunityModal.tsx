import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Description } from "@radix-ui/react-toast";

export function CreateCommunityModal({ onClose, onCreated }: any) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [joinType, setJoinType] = useState("open");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const getEmail = () => {
    const u = encryptedStorage.get("current-user");
    return u ? JSON.parse(u).email : null;
  };

  const handleCreate = async () => {
    const email = getEmail();
    if (!email || !name) return;

    setLoading(true);

   

    // 🔥 Upload image
   let imageUrl: string | null = null;

if (file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `community-${Date.now()}.${fileExt}`;

  // 🔥 STEP 1: UPLOAD
  const { error: uploadError } = await supabase.storage
    .from("community-images")
    .upload(fileName, file);

  if (uploadError) {
    console.error("UPLOAD FAILED:", uploadError);
    setLoading(false);
    return;
  }

  // 🔥 STEP 2: GET PUBLIC URL
  const { data: urlData } = supabase.storage
    .from("community-images")
    .getPublicUrl(fileName);

  imageUrl = urlData.publicUrl;

  console.log("FINAL IMAGE URL:", imageUrl);
}

    // 🔥 Create community
const { data, error } = await supabase.rpc("create_community", {
  p_name: name,
  p_description: desc,
  p_image_url: imageUrl,
  p_join_type: joinType,
  p_email: email,
});

setLoading(false);
console.log(data);
if (error) {
  console.error(error);
 toast.error("Something went wrong");
  return;
}

// 🔥 Handle function responses
if (data === "LIMIT_REACHED") {
toast.error("You can only create up to 2 communities");
  return;
}

if (data === "NAME_EXISTS") {
toast.error("Community name already exists");
  return;
}

if (data === "INVALID_NAME") {
toast.error("Invalid community name");
  return;
}

if (data === "INVALID_JOIN_TYPE") {
toast.error("Invalid join type");
  return;
}

if (data === "CREATED") {
   toast.success("Community creation request is  submitted", {
  description: "Your Community request is awaiting admin approval.",
});
  onCreated();
  onClose();

}}

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 select-none backdrop-blur-sm">
      <div className="relative bg-black border border-pink-500/25 p-6 rounded-2xl w-[400px] space-y-5 shadow-[0_0_50px_rgba(236,72,153,0.25)] text-white animate-fade-in">
        {/* Highlight top line accent */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
        
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-pink-400">Create Community</h2>
          <p className="text-xs text-white/50 mt-1">Setup a new community hub for NIT students.</p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-white/45 font-semibold block">Community Name</label>
          <input
            placeholder="e.g. Coding Club, Chess Group"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-zinc-950 border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:border-pink-500/50 focus:outline-none transition duration-200"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-white/45 font-semibold block">Description</label>
          <input
            placeholder="What is this community about?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full p-3 bg-zinc-950 border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:border-pink-500/50 focus:outline-none transition duration-200"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.2em] text-white/45 font-semibold block">Join Policy</label>
          <select
            value={joinType}
            onChange={(e) => setJoinType(e.target.value)}
            className="w-full p-3 bg-zinc-950 border border-white/15 rounded-xl text-white focus:border-pink-500/50 focus:outline-none transition duration-200"
          >
            <option value="open" className="bg-zinc-950 text-white">Open - Anyone can join</option>
            <option value="approval" className="bg-zinc-950 text-white">Approval - Anyone who you approve can join</option>
          </select>
        </div>

        {/* IMAGE PICKER */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.2em] text-white/45 font-semibold block text-center">Community Cover Image</label>
          <div className="flex justify-center">
            <label className="relative cursor-pointer">
              <div className="h-32 w-32 rounded-2xl border border-dashed border-pink-500/30 bg-zinc-950 flex items-center justify-center overflow-hidden hover:bg-zinc-900 hover:border-pink-500/50 transition duration-200">
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <span className="text-2xl">📷</span>
                    <span className="text-xs mt-1 text-white/50">Upload Cover</span>
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;

                  if (preview) {
                    URL.revokeObjectURL(preview);
                  }

                  const objectUrl = URL.createObjectURL(f);
                  setFile(f);
                  setPreview(objectUrl);
                }}
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            onClick={handleCreate} 
            disabled={loading}
            className="flex-1 h-12 border border-pink-500/30 bg-pink-500 text-black hover:bg-pink-400 font-bold uppercase tracking-wider rounded-xl transition duration-200"
          >
            {loading ? "Creating..." : "Create"}
          </Button>

          <Button 
            variant="ghost" 
            onClick={onClose}
            className="flex-1 h-12 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition duration-200"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}