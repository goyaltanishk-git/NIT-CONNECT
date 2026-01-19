import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhotoService, UserPhoto } from '@/lib/photoservice';
import { Camera, RefreshCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PhotoUploadProps {
  userEmail: string;
  photos: UserPhoto[];
  onPhotosUpdate: (photos: UserPhoto[]) => void;
  maxPhotos?: number;
}

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
   * FIX: Storage-First Upload
   * Ensures the DB record is ONLY created after the file is confirmed in the bucket.
   */
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Validations
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max size is 5MB.', variant: 'destructive' });
      return;
    }
    if (photos.length >= maxPhotos) {
      toast({ title: 'Limit reached', description: `Max ${maxPhotos} photos allowed.`, variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      // 1. ATTEMPT STORAGE UPLOAD FIRST
      const photoUrl = await PhotoService.uploadPhoto(file, userEmail);

      // 2. VERIFY URL INTEGRITY
      if (!photoUrl || !photoUrl.startsWith('https://')) {
        throw new Error("Storage returned an invalid URL. Aborting database update.");
      }

      // 3. UPDATE DATABASE ONLY AFTER STORAGE SUCCESS
      const nextOrder = photos.length > 0 ? Math.max(...photos.map(p => p.photo_order)) + 1 : 1;
      const isPrimary = photos.length === 0;

      await PhotoService.addUserPhoto(userEmail, photoUrl, nextOrder, isPrimary);
      
      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      onPhotosUpdate(updatedPhotos);
      toast({ title: 'Photo uploaded successfully!' });
    } catch (error) {
      console.error("Upload Error:", error);
      toast({ 
        title: 'Upload failed', 
        description: 'The image could not be saved to our servers. Check your connection.', 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  }, [userEmail, photos, maxPhotos, onPhotosUpdate, toast]);

  /**
   * FIX: Safety Replace Logic
   * Uploads the new image before removing the old one to prevent empty database rows.
   */
  const handleReplaceFile = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || replacingOrder === null) {
      setReplacingOrder(null);
      return;
    }
    
    const file = files[0];
    setUploading(true); 

    try {
      const photoToReplace = photos.find(p => p.photo_order === replacingOrder);
      if (!photoToReplace) throw new Error("Target photo not found.");

      // 1. UPLOAD NEW PHOTO FIRST (Safety step)
      const newPhotoUrl = await PhotoService.uploadPhoto(file, userEmail);
      if (!newPhotoUrl.startsWith('https://')) throw new Error("New photo storage failed.");

      // 2. DELETE OLD STORAGE FILE ONLY AFTER NEW ONE IS SECURED
      let oldFilePath = "";
      try {
          oldFilePath = new URL(photoToReplace.photo_url).pathname.split('/user-photos/')[1];
      } catch (e) {}

      if (oldFilePath) {
          await supabase.storage.from("user-photos").remove([oldFilePath]); 
      }

      // 3. UPDATE DB WITH THE NEW URL (Atomic update)
      // Assuming PhotoService has an update method, otherwise delete/insert
      await PhotoService.deletePhoto(userEmail, replacingOrder);
      await PhotoService.addUserPhoto(userEmail, newPhotoUrl, replacingOrder, photoToReplace.is_primary);

      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      onPhotosUpdate(updatedPhotos);
      
      toast({ title: 'Photo replaced successfully!' });

    } catch (error) {
      console.error("Replace Error:", error);
      toast({ 
        title: 'Replace failed', 
        description: 'Failed to upload new image. Your old photo remains active.', 
        variant: 'destructive' 
      });
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
          <div 
            key={index} 
            className="relative group aspect-square animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <img
              src={photo.photo_url}
              alt={`Photo ${photo.photo_order}`}
              className="w-full h-full object-cover rounded-xl border-2 border-white/10 group-hover:border-pink-500/50 transition-all duration-300"
              onError={(e) => {
                // Handle the 404 broken images in the UI
                e.currentTarget.src = "https://placehold.co/400x400?text=Broken+Image";
              }}
            />
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleTriggerReplace(photo.photo_order)}
                className="h-10 w-10 glass-light border-white/50 text-white hover:bg-white/20 hover:border-white transition-all duration-300 rounded-full"
                title="Replace photo"
              >
                <RefreshCcw className="w-5 h-5" />
              </Button>
            </div>

            {uploading && replacingOrder === photo.photo_order && (
              <div className="absolute inset-0 bg-black/75 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300">
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
        onClick={(e) => (e.currentTarget.value = '')} 
      />
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => handleReplaceFile(e.target.files)}
        className="hidden"
        id="photo-replace-input"
        onClick={(e) => (e.currentTarget.value = '')}  
      />   
    </div>   
  );
}