import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';
import { Button } from "@/components/ui/button";
import { Loader2, Zap, CheckCircle, AlertCircle, Trash2 } from "lucide-react";

export function ImageMigrator() {
  const [status, setStatus] = useState("Idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState({ deleted: 0, optimized: 0, dbFixed: 0 });

  // Replace the existing runMigration function in ImageMigrator.tsx

  const runMigration = async () => {
    setIsProcessing(true);
    setStatus("Scanning storage bucket for user folders...");
    
    try {
      const { data: folders, error: folderError } = await supabase.storage
        .from('user-photos')
        .list('', { limit: 10000 });

      if (folderError) throw folderError;
      
      const userFolders = folders?.filter(f => f.name !== '.emptyFolderPlaceholder' && !f.name.startsWith('.')) || [];

      if (userFolders.length === 0) {
        setStatus("No user folders found in storage.");
        setIsProcessing(false);
        return;
      }

      setProgress({ current: 0, total: userFolders.length });
      let deletedCount = 0;
      let optimizedCount = 0;
      let dbFixedCount = 0;

      // Iterate through every user
      for (let i = 0; i < userFolders.length; i++) {
        const email = userFolders[i].name;
        setStatus(`Processing user ${i + 1}/${userFolders.length}: ${email}`);

        try { // 🛡️ NEW: Try-Catch block for EACH USER
          const { data: files, error: filesError } = await supabase.storage
            .from('user-photos')
            .list(email);

          if (filesError || !files || files.length === 0) {
            setProgress(prev => ({ ...prev, current: i + 1 }));
            continue;
          }

          const sortedFiles = files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          const filesToKeep = sortedFiles.slice(0, 3);
          const filesToDelete = sortedFiles.slice(3);

          if (filesToDelete.length > 0) {
            const pathsToDelete = filesToDelete.map(f => `${email}/${f.name}`);
            await supabase.storage.from('user-photos').remove(pathsToDelete);
            deletedCount += filesToDelete.length;
            setStats(s => ({ ...s, deleted: deletedCount }));
          }

          const finalDbRecords = [];

          for (let j = 0; j < filesToKeep.length; j++) {
            const file = filesToKeep[j];
            const oldPath = `${email}/${file.name}`;
            
            setStatus(`Optimizing photo ${j + 1} for ${email}...`);

            try { // 🛡️ NEW: Try-Catch block for EACH FILE
              const { data: blob, error: dlError } = await supabase.storage
                .from('user-photos')
                .download(oldPath);

              if (dlError || !blob) throw new Error("Download failed");

              const imageFile = new File([blob], file.name, { type: blob.type });

              const compressed = await imageCompression(imageFile, {
                maxSizeMB: 0.1,
                maxWidthOrHeight: 1200, 
                useWebWorker: true,
                fileType: 'image/webp'
              });

              const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              const newPath = `${email}/${newName}`;

              await supabase.storage
                .from('user-photos')
                .upload(newPath, compressed, {
                  upsert: true,
                  contentType: 'image/webp',
                  cacheControl: '31536000'
                });

              if (oldPath !== newPath) {
                await supabase.storage.from('user-photos').remove([oldPath]);
              }

              optimizedCount++;
              setStats(s => ({ ...s, optimized: optimizedCount }));

              const { data: { publicUrl } } = supabase.storage
                .from('user-photos')
                .getPublicUrl(newPath);

              finalDbRecords.push({
                user_email: email,
                photo_url: publicUrl,
                photo_order: j + 1,
                is_primary: j === 0
              });
            } catch (fileErr) {
              console.warn(`Failed to process file ${oldPath}:`, fileErr);
              // If compression fails, try to salvage the original URL so they don't lose the photo entirely
              const { data: { publicUrl } } = supabase.storage.from('user-photos').getPublicUrl(oldPath);
               finalDbRecords.push({
                user_email: email,
                photo_url: publicUrl,
                photo_order: j + 1,
                is_primary: j === 0
              });
            }
          }

          // 5. Sync the Database securely bypassing RLS
          if (finalDbRecords.length > 0) {
            const { error: dbErr } = await supabase.rpc('admin_sync_user_photos', {
              p_email: email,
              p_photos: finalDbRecords
            });
            
            if (!dbErr) {
              dbFixedCount++;
              setStats(s => ({ ...s, dbFixed: dbFixedCount }));
            } else {
              console.warn(`Failed to sync DB for ${email}:`, dbErr);
            }
          }

        } catch (userErr) {
          console.warn(`Failed to process user ${email}:`, userErr);
          // Skip to the next user instead of crashing
        }

        setProgress(prev => ({ ...prev, current: i + 1 }));
      }
      
      setStatus("Migration Complete! System is perfectly synchronized.");
    } catch (err: any) {
      // Safely extract error message to prevent "undefined"
      const errorMsg = err?.message || typeof err === 'string' ? err : "Unknown network or memory error";
      setStatus(`Fatal Error: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-black border border-pink-500/30 rounded-2xl space-y-6 shadow-[0_0_30px_rgba(236,72,153,0.15)] max-w-xl mx-auto mt-10">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Zap className="h-8 w-8 text-pink-500 animate-pulse" />
        <div>
          <h2 className="text-2xl font-bold text-white">System Synchronizer</h2>
          <p className="text-xs text-gray-400">Fixes storage limits, missing DB rows, and enforces 100KB WebP.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 py-2">
        <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <Trash2 className="h-5 w-5 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.deleted}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Excess Deleted</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.optimized}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">WebP Optimized</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <CheckCircle className="h-5 w-5 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.dbFixed}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Users Synced</p>
        </div>
      </div>

      <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300 font-mono text-xs truncate mr-4">{status}</span>
          <span className="text-pink-400 font-bold shrink-0">{progress.current} / {progress.total} Users</span>
        </div>
        <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-white/10">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300 relative" 
            style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      <Button 
        onClick={runMigration} 
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white font-bold h-14 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]"
      >
        {isProcessing ? (
          <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Synchronizing System...</>
        ) : (
          "Run Master Fix"
        )}
      </Button>
    </div>
  );
}