import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UploadCloud, ShieldCheck, AlertCircle } from "lucide-react";

interface VerifyProps {
  userEmail: string;
  onComplete: () => void;
}

const Verify = ({ userEmail, onComplete }: VerifyProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0); // Added cooldown state
  const { toast } = useToast();

  // Added useEffect for the countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent file selection if cooldown is active
    if (cooldown > 0) return; 
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setErrorMsg(null);
    }
  };

  const handleVerification = async () => {
    if (!file || !userEmail) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Upload to Supabase Private Bucket
      const fileExt = file.name.split('.').pop();
      const storagePath = `${userEmail}/id_verify_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw new Error("Failed to upload ID card.");

      // 2. Call Vercel Backend for AI Verification
      const response = await fetch("https://portfoliotrial-omega.vercel.app/api/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          id_card_url: storagePath, 
          storage_path: storagePath 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Verification failed");
      }

      if (result.verified) {
        toast({ title: "Verification Successful!", description: "Welcome to NIT Connect." });
        onComplete(); // Tells AuthGuard to reload and push to Hero section
      } else {
        throw new Error(result.reason || "ID card rejected by AI. Please try again.");
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
      setFile(null);
      setPreviewUrl(null);
      setCooldown(30); // Trigger the 30-second cooldown on failure
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md glass p-8 rounded-2xl border border-white/10 space-y-6 text-center">
        
        <div className="mx-auto bg-pink-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="text-pink-500 w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-white">Verify Student ID</h2>
        <p className="text-gray-400 text-sm">
          To keep our community safe and college-exclusive, please upload a clear photo of your NIT Student ID.
        </p>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl flex items-center text-sm text-left">
            <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
            {errorMsg}
          </div>
        )}

        {!previewUrl ? (
          cooldown > 0 ? (
            // Show this block when the cooldown is active
            <div className="border-2 border-dashed border-red-500/20 rounded-xl p-8 flex flex-col items-center justify-center bg-red-500/5 cursor-not-allowed opacity-80">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3 animate-pulse" />
              <span className="text-white font-medium">Please Wait</span>
              <span className="text-sm text-red-400 mt-1">
                You can try again in <strong className="text-red-300">{cooldown}s</strong>
              </span>
            </div>
          ) : (
            // Normal upload block
            <label className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500/50 transition-colors bg-white/5">
              <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
              <span className="text-white font-medium">Tap to upload ID</span>
              <span className="text-xs text-gray-500 mt-1">JPEG, PNG, or WEBP</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={cooldown > 0} />
            </label>
          )
        ) : (
          <div className="space-y-4">
            <img src={previewUrl} alt="ID Preview" className="w-full h-48 object-cover rounded-xl border border-white/10" />
            <Button 
              onClick={handleVerification} 
              disabled={isProcessing || cooldown > 0}
              className="w-full bg-pink-600 hover:bg-pink-700 h-12 text-white font-bold"
            >
              {isProcessing ? <><Loader2 className="animate-spin mr-2" /> AI Verifying...</> : "Submit for Verification"}
            </Button>
            
            {!isProcessing && (
              <button onClick={() => setPreviewUrl(null)} className="text-gray-400 text-sm hover:text-white">
                Choose a different photo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Verify;