import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhotoService, UserPhoto } from '@/lib/photoservice';
import { Camera, RefreshCcw } from 'lucide-react'; // Removed Star import
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

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB.', variant: 'destructive' });
      return;
    }
    if (photos.length >= maxPhotos) {
      toast({ title: 'Maximum photos reached', description: `You can only upload up to ${maxPhotos} photos.`, variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const photoUrl = await PhotoService.uploadPhoto(file, userEmail);
      const nextOrder = photos.length > 0 ? Math.max(...photos.map(p => p.photo_order)) + 1 : 1;
      // We still mark the first photo as primary in the DB for data consistency, 
      // even if the UI doesn't show the star.
      const isPrimary = photos.length === 0;

      await PhotoService.addUserPhoto(userEmail, photoUrl, nextOrder, isPrimary);
      
      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      onPhotosUpdate(updatedPhotos);
      toast({ title: 'Photo uploaded!' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo.';
      toast({ title: 'Upload failed', description: errorMessage, variant: 'destructive' });
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
    
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image file.', variant: 'destructive' });
      setReplacingOrder(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB.', variant: 'destructive' });
      setReplacingOrder(null);
      return;
    }

    setUploading(true); 

    try {
      const photoToReplace = photos.find(p => p.photo_order === replacingOrder);
      if (!photoToReplace) {
        throw new Error("Photo to replace not found.");
      }
      const wasPrimary = photoToReplace.is_primary;

      const oldPhotoUrl = photoToReplace.photo_url;
      let filePath = "";
      try {
          filePath = new URL(oldPhotoUrl).pathname.split('/user-photos/')[1];
      } catch (e) {
      }

      if (filePath) {
          await supabase.storage.from("user-photos").remove([filePath]); 
      }

      await PhotoService.deletePhoto(userEmail, replacingOrder);
      const newPhotoUrl = await PhotoService.uploadPhoto(file, userEmail);
      await PhotoService.addUserPhoto(userEmail, newPhotoUrl, replacingOrder, wasPrimary);

      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      onPhotosUpdate(updatedPhotos);
      
      toast({ title: 'Photo replaced!' });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to replace photo.';
      toast({ title: 'Replace failed', description: errorMessage, variant: 'destructive' });
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
            />
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center gap-2">
              
              {/* Removed the Star Button and Indicator Logic Here */}
              
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
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-pink-500 border-t-transparent"></div>
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
            onClick={() => {
              document.getElementById('photo-upload-input')?.click();
            }}
          >
            {uploading && replacingOrder === null ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-pink-500 border-t-transparent"></div>
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