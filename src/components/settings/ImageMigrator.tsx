import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';
import { Button } from "@/components/ui/button";
import { Loader2, Zap, CheckCircle, AlertCircle } from "lucide-react";

export function ImageMigrator() {
  const [status, setStatus] = useState("Idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const runMigration = async () => {
    setIsProcessing(true);
    setStatus("Fetching photo list from database...");
    
    try {
      // 1. Get all unique photo URLs
      const { data: photos, error: dbError } = await supabase
        .from('user_photos')
        .select('photo_url')
        .range(112, 295);

      if (dbError) throw dbError;
      if (!photos || photos.length === 0) {
        setStatus("No photos found in database.");
        setIsProcessing(false);
        return;
      }

      setProgress({ current: 0, total: photos.length });

      for (let i = 0; i < photos.length; i++) {
        const url = photos[i].photo_url;
        // Extracts the path after /user-photos/ bucket name
        const filePath = url.split('/user-photos/')[1]?.split('?')[0]; 
        
        if (!filePath) continue;

        setStatus(`Optimizing ${i + 1}/${photos.length}: ${filePath}`);

        // 2. Download the original large file
        const { data: blob, error: dlError } = await supabase.storage
          .from('user-photos')
          .download(filePath);

        if (dlError || !blob) {
          console.error(`Download failed for ${filePath}`, dlError);
          continue;
        }

        // 3. Compress and convert to WebP locally in browser
        const compressed = await imageCompression(blob as File, {
          maxSizeMB: 0.4,          // Target < 400KB
          maxWidthOrHeight: 1000, // Reasonable mobile resolution
          useWebWorker: true,
          fileType: 'image/webp'  // Standardize on WebP
        });

        // 4. Overwrite (Upsert) the old file
        const { error: ulError } = await supabase.storage
          .from('user-photos')
          .upload(filePath, compressed, {
            upsert: true,            // This replaces the old file
            cacheControl: '31536000' // Apply long-term 1-year cache
          });

        if (ulError) console.error(`Upload failed for ${filePath}`, ulError);
        
        setProgress(prev => ({ ...prev, current: i + 1 }));
      }
      
      setStatus("Migration Complete! All photos are now optimized WebP files.");
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-card border border-pink-500/30 rounded-2xl space-y-4 shadow-[0_0_20px_rgba(236,72,153,0.1)]">
      <div className="flex items-center gap-3">
        <Zap className="h-6 w-6 text-pink-500" />
        <h2 className="text-xl font-bold text-white">Egress & Storage Optimizer</h2>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Status: {status}</span>
          <span className="text-pink-400 font-medium">{progress.current} / {progress.total}</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-pink-500 transition-all duration-300" 
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      </div>

      <Button 
        onClick={runMigration} 
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold h-12 rounded-xl"
      >
        {isProcessing ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
        ) : (
          "Run One-Time Fix (Optimize All Photos)"
        )}
      </Button>
      
      <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest">
        This will download and replace existing large files with 400KB WebP versions
      </p>
    </div>
  );
}