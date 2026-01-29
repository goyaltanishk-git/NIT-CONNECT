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

// SECURITY: Define a strict whitelist of allowed image extensions
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];

// ✅ AGGRESSIVE COMPRESSION OPTIONS FOR FREE PLAN EGRESS
const compressionOptions = {
  maxSizeMB: 0.4,          // Reduced from 1MB to 400KB
  maxWidthOrHeight: 1200, // Reduced from 1200 to 1000 (standard for mobile)
  useWebWorker: true,
  initialQuality: 0.7,    // Added: Starts at 70% quality for better compression
  fileType: 'image/webp'  // Added: Forces WebP format (significantly smaller than JPG)
};

export function PhotoUpload({ 
  userEmail, 
  photos, 
  onPhotosUpdate, 
  maxPhotos = 3 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [replacingOrder, setReplacingOrder] = useState<number | null>(null); 
  const { toast } = useToast();

  /**
   * SECURITY HELPER: Validates both the MIME type and the file extension
   */
  const isValidImage = (file: File): boolean => {
    if (!file.type.startsWith('image/')) return false;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) return false;
    return true;
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (!isValidImage(file)) {
      toast({ 
        title: 'Security Blocked', 
        description: 'Only images (JPG, PNG, WEBP) are allowed for your profile.', 
        variant: 'destructive' 
      });
      return;
    }

    if (photos.length >= maxPhotos) {
      toast({ title: 'Limit reached', description: `Max ${maxPhotos} photos allowed.`, variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      // ✅ 1. Apply aggressive compression before upload
      const compressedFile = await imageCompression(file, compressionOptions);

      // ✅ 2. Upload the compressed version (now a WebP blob)
      const photoUrl = await PhotoService.uploadPhoto(compressedFile as File, userEmail);

      const { data: existingPhotos } = await supabase
        .from('user_photos')
        .select('photo_order')
        .eq('user_email', userEmail);
        
      const dbNextOrder = existingPhotos && existingPhotos.length > 0 
        ? Math.max(...existingPhotos.map(p => p.photo_order)) + 1 
        : 1;

      await PhotoService.addUserPhoto(userEmail, photoUrl, dbNextOrder, dbNextOrder === 1);
      
      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      onPhotosUpdate(updatedPhotos);
      toast({ title: 'Photo uploaded!' });
    }
    catch (error) {
      toast({ title: 'Upload failed', description: 'Please check your connection.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [userEmail, photos, maxPhotos, onPhotosUpdate, toast]);

  const handleReplaceFile = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || replacingOrder === null) {
      setReplacingOrder(null);
      return;
    }
    
    const file = files[0];

    if (!isValidImage(file)) {
      toast({ 
        title: 'Invalid File Type', 
        description: 'This file is not a valid image format.', 
        variant: 'destructive' 
      });
      setReplacingOrder(null);
      return;
    }

    setUploading(true); 

    try {
      const photoToReplace = photos.find(p => p.photo_order === replacingOrder);
      if (!photoToReplace) throw new Error("Target photo not found.");

      // ✅ 1. Apply aggressive compression for replacement
      const compressedFile = await imageCompression(file, compressionOptions);

      const newPhotoUrl = await PhotoService.uploadPhoto(compressedFile as File, userEmail);
      if (!newPhotoUrl.startsWith('https://')) throw new Error("New photo storage failed.");

      let oldFilePath = "";
      try {
          const cleanUrl = photoToReplace.photo_url.split('?')[0];
          oldFilePath = cleanUrl.split('/user-photos/')[1]; 
      } catch (e) {}

      if (oldFilePath) {
          await supabase.storage.from("user-photos").remove([oldFilePath]);
      }

      await PhotoService.deletePhoto(userEmail, replacingOrder);
      await PhotoService.addUserPhoto(userEmail, newPhotoUrl, replacingOrder, photoToReplace.is_primary);

      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      onPhotosUpdate(updatedPhotos);
      toast({ title: 'Photo replaced!' });
    }
    catch (error) {
      toast({ title: 'Replace failed', description: "Failed to update image.", variant: 'destructive' });
    } finally {
      setUploading(false);
      setReplacingOrder(null); 
    }
  }, [userEmail, photos, replacingOrder, onPhotosUpdate, toast]);

  const handleTriggerReplace = (photoOrder: number) => {
    setReplacingOrder(photoOrder); 
    document.getElementById('photo-replace-input')?.click();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files); 
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 gap-2 max-w-[280px] mx-auto">
        {photos.map((photo, index) => (
          <div key={index} className="relative group aspect-square">
            <img
              // ✅ Always strip potential query params for Free Plan compatibility
              src={photo.photo_url.split('?')[0]} 
              alt={`Photo ${photo.photo_order}`}
              className="w-full h-full object-cover rounded-xl border-2 border-white/10 group-hover:border-pink-500/50 transition-all duration-300"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/400x400?text=Invalid+File";
              }}
            />
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center gap-2">
              <Button size="icon" variant="outline" onClick={() => handleTriggerReplace(photo.photo_order)} className="h-10 w-10 glass-light border-white/50 text-white rounded-full">
                <RefreshCcw className="w-5 h-5" />
              </Button>
            </div>

            {uploading && replacingOrder === photo.photo_order && (
              <div className="absolute inset-0 bg-black/75 rounded-xl flex flex-col items-center justify-center gap-1">
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

      <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" id="photo-upload-input" onClick={(e) => (e.currentTarget.value = '')} />
      <Input type="file" accept="image/*" onChange={(e) => handleReplaceFile(e.target.files)} className="hidden" id="photo-replace-input" onClick={(e) => (e.currentTarget.value = '')} />   
    </div>   
  );
}