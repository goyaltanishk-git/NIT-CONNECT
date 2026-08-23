// src/components/news/CreateNewsModal.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface CreateNewsModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateNewsModal({
  onClose,
  onCreated,
}: CreateNewsModalProps) {
  const [caption, setCaption] = useState("");
  const [scope, setScope] = useState("college");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  

  // Get current user's email from encrypted storage
  const getEmail = () => {
    const u = encryptedStorage.get("current-user");
    return u ? JSON.parse(u).email : null;
  };

  const handleCreate = async () => {
    const email = getEmail();
    console.log('[CreateNewsModal] handleCreate invoked');
    

   if (!email) {
  console.warn('[CreateNewsModal] user email missing');
 toast.error("Please sign in before posting");
  return;
}

   if (!caption.trim()) {
 toast.error("Please enter a caption");
  return;
}

if (!file) {
  toast.error("Please select an image");
  return;
}

    setLoading(true);

    try {
      // ==========================================
      // 1. Upload image to Supabase Storage
      // ==========================================
      const fileExt = file.name.split(".").pop();
      const fileName = `news-${Date.now()}.${fileExt}`;

    
      console.log('[CreateNewsModal] uploading file', fileName, file);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("news-images")
        .upload(fileName, file);

     if (uploadError) {
  console.error("UPLOAD FAILED:", uploadError);

toast.error(uploadError.message || "Failed to upload image");

  setLoading(false);
  return;
}

console.log('[CreateNewsModal] uploadData', uploadData);
toast.success("Image uploaded");

      // ==========================================
      // 2. Get public URL
      // ==========================================
      const { data: urlData } = supabase.storage
        .from("news-images")
        .getPublicUrl(fileName);

      const imageUrl = urlData?.publicUrl;
      console.log('[CreateNewsModal] publicUrl', imageUrl);

      if (!imageUrl) {
        toast.error("Could not get public URL");
        setLoading(false);
        return;
      }

      // ==========================================
      // 3. Create news post using RPC
      // ==========================================
      const { data, error } = await supabase.rpc("create_news", {
        p_email: email,
        p_caption: caption,
        p_image_url: imageUrl,
        p_scope: scope
      });

     if (error) {
  console.error("RPC ERROR:", error);

toast.error(error.message || "Failed to create news");}


      // ==========================================
      // 4. Handle result
      // ==========================================
      if (data === "CREATED") {
        toast.success("News submitted", {
          description: "Your news post is awaiting admin approval.",
        });
        onCreated();
        onClose();
      } else {
        toast.error(`Unexpected response: ${String(data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

        .auth-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .auth-body { font-family: 'IBM Plex Sans', sans-serif; }
      `}</style>
      <div className="mx-auto w-full max-w-[560px] px-4">
        <Card className="relative w-full overflow-hidden border border-pink-500/25 bg-black/85 text-white shadow-[0_0_0_1px_rgba(255,20,83,0.12),0_30px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />

          <CardHeader className="space-y-3 border-b border-white/8 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="auth-display text-2xl md:text-3xl text-white">Create News Post</CardTitle>
                <CardDescription className="auth-body text-sm text-white/60">Share an update with your college community. Posts are reviewable by admins.</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-6 py-6">
            <div className="space-y-2">
              <label className="auth-body text-xs uppercase tracking-[0.3em] text-white/45">Caption</label>
              <textarea
                placeholder="Write your news caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg resize-none outline-none text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="auth-body text-xs uppercase tracking-[0.3em] text-white/45">Visibility</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as "college" | "global")}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
              >
                <option value="college" className="bg-black">🏫 My College Only</option>
                <option value="global" className="bg-black">🌍 Global (All Colleges)</option>
              </select>
            </div>

            <div>
              <label className="auth-body text-xs uppercase tracking-[0.3em] text-white/45">Image</label>
              <div className="mt-2 flex justify-center">
                <label className="relative cursor-pointer">
                  <div className="h-48 w-full max-w-[420px] rounded-2xl border-2 border-dashed border-pink-500/30 bg-white/5 flex items-center justify-center overflow-hidden hover:bg-white/10 transition">
                    {preview ? (
                      <img src={preview} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <span className="text-4xl">📰</span>
                        <span className="text-sm mt-2">Upload News Image</span>
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
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={loading} className="flex-1 group h-12 border border-pink-500/30 bg-pink-500 text-black hover:bg-pink-400">
                {loading ? "Submitting..." : "Submit News"}
              </Button>

              <Button variant="ghost" onClick={onClose} disabled={loading} className="flex-1 h-12">
                Cancel
              </Button>
            </div>

            <p className="text-xs text-gray-400 text-center">Your news post will be visible after admin approval.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}