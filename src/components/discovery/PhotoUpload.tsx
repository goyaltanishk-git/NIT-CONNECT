import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoService, UserPhoto } from '@/lib/photoservice';
import { Upload, Star, Camera, RefreshCcw } from 'lucide-react';
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
  const [replacingOrder, setReplacingOrder] = useState<number | null>(null); // State for replacement
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    // This function handles *adding a new photo* to an empty slot
    console.log("[PhotoUpload] handleFileUpload triggered with files:", files);
    
    if (!files || files.length === 0) return;

    const file = files[0];
    console.log("[PhotoUpload] File selected:", file);
    
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      console.warn("[PhotoUpload] No Supabase user found.");
    }

    setUploading(true);

    try {
      const photoUrl = await PhotoService.uploadPhoto(file, userEmail);
      const nextOrder = photos.length > 0 ? Math.max(...photos.map(p => p.photo_order)) + 1 : 1;
      const isPrimary = photos.length === 0;

      await PhotoService.addUserPhoto(userEmail, photoUrl, nextOrder, isPrimary);
      
      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      onPhotosUpdate(updatedPhotos);
      toast({ title: 'Photo uploaded!' });
    } catch (error) {
      console.error('Photo upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo.';
      toast({ title: 'Upload failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [userEmail, photos, maxPhotos, onPhotosUpdate, toast]);

  // This function handles *replacing an existing photo*
  const handleReplaceFile = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || replacingOrder === null) {
      setReplacingOrder(null); // Reset state if no file
      return;
    }
    
    const file = files[0];
    
    // Validate
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

    setUploading(true); // Show loading spinner

    try {
      const photoToReplace = photos.find(p => p.photo_order === replacingOrder);
      if (!photoToReplace) {
        throw new Error("Photo to replace not found.");
      }
      const wasPrimary = photoToReplace.is_primary;

      // === 1. Delete from Supabase Storage ===
      const oldPhotoUrl = photoToReplace.photo_url;
      let filePath = "";
      try {
          filePath = new URL(oldPhotoUrl).pathname.split('/user-photos/')[1];
      } catch (e) {
          console.error("Invalid photo URL, cannot parse for deletion:", oldPhotoUrl, e);
      }

      if (filePath) {
          console.log("[PhotoUpload] Deleting old file from storage:", filePath);
          const { error: storageError } = await supabase.storage
              .from("user-photos") // Your bucket name
              .remove([filePath]); // Pass the path as an array
          
          if (storageError) {
              console.warn("[PhotoUpload] Storage deletion failed:", storageError.message);
              toast({ title: 'Storage Error', description: `Could not delete old file: ${storageError.message}`, variant: 'destructive' });
          } else {
              console.log("[PhotoUpload] Old file deleted from storage.");
          }
      }
      // === End of Storage Delete ===

      // 2. Delete from Database Table (via PhotoService)
      await PhotoService.deletePhoto(userEmail, replacingOrder);
      
      // 3. Upload the new photo
      const newPhotoUrl = await PhotoService.uploadPhoto(file, userEmail);
      
      // 4. Add new photo to Database Table
      await PhotoService.addUserPhoto(userEmail, newPhotoUrl, replacingOrder, wasPrimary);

      // 5. Refresh the state
      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      onPhotosUpdate(updatedPhotos);
      
      toast({ title: 'Photo replaced!', description: 'Your photo has been updated.' });

    } catch (error) {
      console.error('Photo replace error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to replace photo.';
      toast({ title: 'Replace failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setUploading(false);
      setReplacingOrder(null); // Reset state
    }
  }, [userEmail, photos, replacingOrder, onPhotosUpdate, toast]);

  // This function triggers the hidden "replace" file input
  const handleTriggerReplace = (photoOrder: number) => {
    setReplacingOrder(photoOrder); // Set *which* photo to replace
    document.getElementById('photo-replace-input')?.click();
  };

  const handleSetPrimary = useCallback(async (photoOrder: number) => {
    console.log("[PhotoUpload] handleSetPrimary called:", photoOrder);
    try {
      await PhotoService.setPrimaryPhoto(userEmail, photoOrder);
      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      onPhotosUpdate(updatedPhotos);
      toast({ title: 'Primary photo updated' });
    } catch (error) {
      console.error('Set primary photo error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set primary photo.';
      toast({ title: 'Update failed', description: errorMessage, variant: 'destructive' });
    }
  }, [userEmail, onPhotosUpdate, toast]);

  // --- Drag and Drop Handlers ---

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files); // Use the *add new* handler
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
    <div className="space-y-6 animate-fade-in">
      {/* Photo Grid */}
      {/* 🆕 Grid changed to 2 cols */}
      <div className="grid grid-cols-2 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group aspect-square animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <img
              src={photo.photo_url}
              alt={`Photo ${photo.photo_order}`}
              className="w-full h-full object-cover rounded-xl border-2 border-white/10 group-hover:border-pink-500/50 transition-all duration-300"
            />
            
            {/* Photo controls overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center gap-3">
              {!photo.is_primary && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSetPrimary(photo.photo_order)}
                  className="glass-light border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500 hover:scale-110 transition-all duration-300 interactive"
                  title="Set as primary"
                >
                  <Star className="w-4 h-4" />
                </Button>
              )}
              
              {photo.is_primary && (
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 animate-pulse-glow">
                  <Star className="w-3 h-3" />
                  Primary
                </div>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTriggerReplace(photo.photo_order)}
                className="glass-light border-white/50 text-white hover:bg-white/20 hover:border-white hover:scale-110 transition-all duration-3Two interactive"
                title="Replace photo"
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Buffering overlay for *this specific photo* */}
            {uploading && replacingOrder === photo.photo_order && (
              <div className="absolute inset-0 bg-black/75 rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 animate-fade-in">
                <div className="loading-heart mx-auto mb-3"></div>
                <p className="text-sm text-pink-300 font-medium">Replacing...</p>
              </div>
            )}
          </div>
        ))}
        
        {/* Upload area */}
        {photos.length < maxPhotos && (
          <div
            className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group interactive ${
              dragOver
                ? 'border-pink-500 bg-pink-500/10 scale-105'
                : 'border-white/30 hover:border-pink-500/60 hover:bg-pink-500/5'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => {
              // This click triggers the *add new* photo input
              document.getElementById('photo-upload-input')?.click();
            }}
          >
            {/* Only show loading here if we are *adding* a new photo */}
            {uploading && replacingOrder === null ? (
              <div className="text-center animate-fade-in">
                <div className="loading-heart mx-auto mb-3"></div>
                <p className="text-sm text-pink-300 font-medium">
                  Uploading...
                </p>
                <div className="flex justify-center space-x-1 mt-2">
                  <div className="w-1 h-1 bg-pink-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative">
                  <Camera className="w-10 h-10 text-gray-400 group-hover:text-pink-400 mx-auto mb-3 transition-colors duration-300" />
                  <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <p className="text-sm text-gray-400 group-hover:text-pink-300 transition-colors duration-300 font-medium">
                  {dragOver ? 'Drop photo here' : 'Click or drag to upload'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ⛔️ Upload instructions DIV removed */}

      {/* Hidden file input for *adding* new photos */}
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        id="photo-upload-input"
        onClick={(e) => (e.currentTarget.value = '')} // Reset input
      />
      {/* Hidden file input for *replacing* photos */}
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => handleReplaceFile(e.target.files)}
        className="hidden"
        id="photo-replace-input"
        onClick={(e) => (e.currentTarget.value = '')} // Reset input
      />
    </div>
  );
}