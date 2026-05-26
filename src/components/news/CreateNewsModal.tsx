// src/components/news/CreateNewsModal.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CreateNewsModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateNewsModal({
  onClose,
  onCreated,
}: CreateNewsModalProps) {
  const [caption, setCaption] = useState("");
  const [scope, setScope] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user's email from encrypted storage
  const getEmail = () => {
    const u = encryptedStorage.get("current-user");
    return u ? JSON.parse(u).email : null;
  };

  const handleCreate = async () => {
    const email = getEmail();

   if (!email) {
  toast({
    title: "User not found",
    variant: "destructive",
  });
  return;
}

   if (!caption.trim()) {
  toast({
    title: "Caption required",
    description: "Please enter a caption",
    variant: "destructive",
  });
  return;
}

if (!file) {
  toast({
    title: "Image required",
    description: "Please select an image",
    variant: "destructive",
  });
  return;
}

    setLoading(true);

    try {
      // ==========================================
      // 1. Upload image to Supabase Storage
      // ==========================================
      const fileExt = file.name.split(".").pop();
      const fileName = `news-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("news-images")
        .upload(fileName, file);

     if (uploadError) {
  console.error("UPLOAD FAILED:", uploadError);

  toast({
    title: "Upload failed",
    description: "Failed to upload image",
    variant: "destructive",
  });

  setLoading(false);
  return;
}

      // ==========================================
      // 2. Get public URL
      // ==========================================
      const { data: urlData } = supabase.storage
        .from("news-images")
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // ==========================================
      // 3. Create news post using RPC
      // ==========================================
      const { data, error } = await supabase.rpc("create_news", {
        p_email: email,
        p_caption: caption,
        p_image_url: imageUrl,
        p_scope:scope
      });

     if (error) {
  console.error("RPC ERROR:", error);

  toast({
    title: "Failed to create news",
    description: "Something went wrong while creating the news post",
    variant: "destructive",
  });

  setLoading(false);
  return;
}

      // ==========================================
      // 4. Handle result
      // ==========================================
     if (data === "CREATED") {
  toast({
    title: "News submitted",
    description:
      "Your news post is awaiting admin approval.",
  });

  onCreated();
  onClose();
} else {
  toast({
    title: "Unexpected response",
    description: String(data),
    variant: "destructive",
  });
}
}catch (err) {
  console.error("CREATE NEWS ERROR:", err);

  toast({
    title: "Unexpected error",
    description: "Something went wrong",
    variant: "destructive",
  });
}finally { setLoading(false); } };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-black border border-white/10 p-6 rounded-xl w-[400px] space-y-4 text-white">
        {/* Title */}
        <h2 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Create News Post
        </h2>

        {/* Caption */}
        <textarea
          placeholder="Write your news caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg resize-none outline-none"
        />
        <div className="space-y-2">
  <label className="text-sm text-gray-400">Who can see this news?</label>

  <select
    value={scope}
    onChange={(e) =>
      setScope(e.target.value as "college" | "global")
    }
    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
  >
    <option value="college" className="bg-black">
      🏫 My College Only
    </option>
    <option value="global" className="bg-black">
      🌍 Global (All Colleges)
    </option>
  </select>
</div>

        {/* Image Picker */}
        <div className="flex justify-center">
          <label className="relative cursor-pointer">
            <div className="h-48 w-48 rounded-2xl border-2 border-dashed border-pink-500/40 bg-white/5 flex items-center justify-center overflow-hidden hover:bg-white/10 transition">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <span className="text-3xl">📰</span>
                  <span className="text-xs mt-2">Upload News Image</span>
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

                setFile(f);
                setPreview(URL.createObjectURL(f));
              }}
            />
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600"
          >
            {loading ? "Submitting..." : "Submit News"}
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-400 text-center">
          Your news post will be visible after admin approval.
        </p>
      </div>
    </div>
  );
}