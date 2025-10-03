import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoService, UserPhoto } from '@/lib/photoservice';
import { Upload, X, Star, Camera } from 'lucide-react';
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
  maxPhotos = 6 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (files: FileList | null) => {
     console.log("[PhotoUpload] handleFileUpload triggered with files:", files);
    
    if (!files || files.length === 0) return;

    const file = files[0];
console.log("[PhotoUpload] File selected:", file);
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.warn("[PhotoUpload] Invalid file type:", file.type);
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Check if user has reached max photos
    if (photos.length >= maxPhotos) {
      console.warn("[PhotoUpload] Max photos reached:", maxPhotos);
      toast({
        title: 'Maximum photos reached',
        description: `You can only upload up to ${maxPhotos} photos.`,
        variant: 'destructive',
      });
      return;
    }

    // Verify user authentication before upload
    const { data: { user } } = await supabase.auth.getUser();
     console.log("[PhotoUpload] Supabase user:", user);
    console.log("[PhotoUpload] Expected email:", userEmail);
    
    if (!user?.email) {
  console.warn("[PhotoUpload] No Supabase user found, continuing with provided userEmail:", userEmail);
  // You may want to enforce auth later, but for now allow uploads
}

    setUploading(true);

    try {
      // Upload to Supabase storage
       console.log("[PhotoUpload] Uploading to Supabase storage...");
    
      const photoUrl = await PhotoService.uploadPhoto(file, userEmail);
console.log("[PhotoUpload] Uploaded photo URL:", photoUrl);
      // Add to database with RLS-compliant method
      const nextOrder = photos.length + 1;
      const isPrimary = photos.length === 0; // First photo is primary

      await PhotoService.addUserPhoto(userEmail, photoUrl, nextOrder, isPrimary);
      console.log("[PhotoUpload] Photo added to DB:", { photoUrl, nextOrder, isPrimary });
      // Refresh photos list
      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      console.log("[PhotoUpload] Refreshed photos:", updatedPhotos);
      
      onPhotosUpdate(updatedPhotos);

      toast({
        title: 'Photo uploaded!',
        description: 'Your photo has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      
      // More specific error handling
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo. Please try again.';
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [userEmail, photos, maxPhotos, onPhotosUpdate, toast]);

  const handleDeletePhoto = useCallback(async (photoOrder: number) => {
    console.log("[PhotoUpload] handleDeletePhoto called:", photoOrder);
   
    try {
      await PhotoService.deletePhoto(userEmail, photoOrder);
      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      console.log("[PhotoUpload] Photos after delete:", updatedPhotos);
      onPhotosUpdate(updatedPhotos);
      toast({ title: 'Photo deleted', description: 'Photo has been removed successfully.' });
    } catch (error) {
      console.error('Photo delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete photo. Please try again.';
      toast({ title: 'Delete failed', description: errorMessage, variant: 'destructive' });
    }
  }, [userEmail, onPhotosUpdate, toast]);

  const handleSetPrimary = useCallback(async (photoOrder: number) => {
    console.log("[PhotoUpload] handleSetPrimary called:", photoOrder);
   
    try {
      await PhotoService.setPrimaryPhoto(userEmail, photoOrder);
      const updatedPhotos = await PhotoService.getUserPhotos(userEmail);
      console.log("[PhotoUpload] Photos after primary set:", updatedPhotos);
      onPhotosUpdate(updatedPhotos);
      toast({ title: 'Primary photo updated', description: 'This photo is now your primary photo.' });
    } catch (error) {
      console.error('Set primary photo error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set primary photo. Please try again.';
      toast({ title: 'Update failed', description: errorMessage, variant: 'destructive' });
    }
  }, [userEmail, onPhotosUpdate, toast]);


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
    <div className="space-y-4">
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group aspect-square">
            <img
              src={photo.photo_url}
              alt={`Photo ${photo.photo_order}`}
              className="w-full h-full object-cover rounded-lg"
            />
            
            {/* Photo controls overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              {!photo.is_primary && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSetPrimary(photo.photo_order)}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  <Star className="w-4 h-4" />
                </Button>
              )}
              
              {photo.is_primary && (
                <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                  Primary
                </div>
              )}
              
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeletePhoto(photo.photo_order)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {/* Upload area - only show if under maxPhotos limit */}
        {photos.length < maxPhotos && (
          <div
            className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
              input.click();
            }}
          >
            {uploading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <div className="text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {dragOver ? 'Drop photo here' : 'Click or drag to upload'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>• Upload up to {maxPhotos} photos</div>
        <div>• Maximum file size: 5MB</div>
        <div>• Supported formats: JPG, PNG, GIF</div>
        <div>• First photo will be your primary photo</div>
      </div>

      {/* Hidden file input for fallback */}
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        id="photo-upload-input"
      />
    </div>
  );
}