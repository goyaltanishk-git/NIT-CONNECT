import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhotoService, UserPhoto } from '@/lib/photoservice';
import { Camera, RefreshCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';

interface PhotoUploadProps {
  userEmail: string;
  photos: UserPhoto[];
  onPhotosUpdate: (photos: UserPhoto[]) => void;
  maxPhotos?: number;
}

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];

const compressionOptions = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  initialQuality: 0.7,
  fileType: 'image/webp'
};

export function PhotoUpload({ 
  userEmail, 
  photos, 
  onPhotosUpdate, 
  maxPhotos = 6 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [replacingOrder, setReplacingOrder] = useState<number | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
        throw new Error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      }

      const compressedFile = await imageCompression(file, compressionOptions as any);
      const publicUrl = await PhotoService.uploadPhoto(compressedFile, userEmail);

      // ✅ FIX: Robust Order Calculation
      // If replacing, use that order. If new, find the highest current order and add 1.
      let newOrder: number;
      if (replacingOrder !== null) {
        newOrder = replacingOrder;
        // Clean up the specific slot before inserting to be safe
        await supabase
          .from('user_photos')
          .delete()
          .eq('user_email', userEmail)
          .eq('photo_order', replacingOrder);
      } else {
        // Find the next available slot based on current photos
        const existingOrders = photos.map(p => p.photo_order);
        newOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 0;
      }

      // ✅ FIX: Use .upsert() instead of .insert() to handle 409 Conflicts
      const { error: upsertError } = await supabase
        .from('user_photos')
        .upsert({
          user_email: userEmail,
          photo_url: publicUrl,
          photo_order: newOrder,
          is_primary: newOrder === 0,
        }, {
          onConflict: 'user_email,photo_order' // Matches your DB unique constraint
        });

      if (upsertError) throw upsertError;

      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      onPhotosUpdate(updatedPhotos);
      
      toast({
        title: "Success",
        description: "Photo saved successfully!",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setReplacingOrder(null);
      const input = document.getElementById('photo-upload-input') as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const handleReplaceClick = (order: number) => {
    setReplacingOrder(order);
    document.getElementById('photo-upload-input')?.click();
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [userEmail, photos]);

  return (
    <div className="space-y-4">
      {/* Restored 2-column grid layout (2x1) */}
      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <div key={photo.photo_order} className="relative aspect-square group">
            <img
              src={photo.photo_url}
              alt={`Profile ${photo.photo_order + 1}`}
              className="w-full h-full object-cover rounded-xl border border-white/10"
            />
            
            {/* Overlay - ONLY Replace button, NO delete */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm border-none"
                onClick={() => handleReplaceClick(photo.photo_order)}
                disabled={uploading}
              >
                <RefreshCcw className={`h-5 w-5 text-white ${uploading && replacingOrder === photo.photo_order ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {uploading && replacingOrder === photo.photo_order && (
              <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                <Loader2 className="animate-spin h-6 w-6 text-pink-500" />
              </div>
            )}
          </div>
        ))}
        
        {photos.length < maxPhotos && (
          <div
            className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group interactive 
              ${dragOver ? 'border-pink-500 bg-pink-500/10 scale-105' : 'border-white/30 hover:border-pink-500/60 hover:bg-pink-500/5'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('photo-upload-input')?.click()}
          >
            {uploading && replacingOrder === null ? (
              <Loader2 className="animate-spin h-6 w-6 text-pink-500" />
            ) : (
              <Camera className="w-6 h-6 text-gray-400 group-hover:text-pink-400 transition-colors duration-300" />
            )}
          </div>
        )}
      </div>

      <Input 
        type="file" 
        accept="image/*" 
        onChange={(e) => handleFileUpload(e.target.files)} 
        className="hidden" 
        id="photo-upload-input" 
        onClick={(e) => ((e.target as HTMLInputElement).value = '')}
      />
    </div>
  );
}