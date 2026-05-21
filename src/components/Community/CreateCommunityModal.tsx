import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { Button } from "@/components/ui/button";

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
  alert("Something went wrong");
  return;
}

// 🔥 Handle function responses
if (data === "LIMIT_REACHED") {
  alert("You can only create up to 2 communities");
  return;
}

if (data === "NAME_EXISTS") {
  alert("Community name already exists");
  return;
}

if (data === "INVALID_NAME") {
  alert("Invalid community name");
  return;
}

if (data === "INVALID_JOIN_TYPE") {
  alert("Invalid join type");
  return;
}

if (data === "CREATED") {
  onCreated();
  onClose();
}}

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-black border border-white/10 p-6 rounded-xl w-[400px] space-y-4">
        <h2 className="text-lg font-bold">Create Community</h2>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 bg-white/5 border border-white/10 rounded"
        />

        <input
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full p-2 bg-white/5 border border-white/10 rounded"
        />

        <select
          value={joinType}
          onChange={(e) => setJoinType(e.target.value)}
          className="w-full p-2 bg-white/5 border border-white/10 rounded"
        >
          <option value="open">Open</option>
          <option value="approval">Approval</option>
        </select>

        {/* IMAGE */}
        {/* IMAGE PICKER */}
<div className="flex justify-center">
  <label className="relative cursor-pointer">
    
    {/* BOX */}
    <div className="h-40 w-40 rounded-2xl border-2 border-dashed border-pink-500/40 bg-white/5 flex items-center justify-center overflow-hidden hover:bg-white/10 transition">

      {/* PREVIEW */}
      {preview ? (
        <img
          src={preview}
          alt="preview"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center text-gray-400">
          <span className="text-2xl">📷</span>
          <span className="text-xs mt-1">Upload</span>
        </div>
      )}
    </div>

    {/* HIDDEN INPUT */}
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (!f) return;

        setFile(f);
        setPreview(URL.createObjectURL(f)); // 🔥 preview
      }}
    />
  </label>
</div>

        <div className="flex gap-2">
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>

          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}