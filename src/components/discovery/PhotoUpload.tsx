import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoService, UserPhoto } from '@/lib/photoservice';
import { Upload, X, Star, Camera, Sparkles, Heart } from 'lucide-react';
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
    <div className="space-y-6 animate-fade-in">
      {/* Photo Grid with Thursday styling */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group aspect-square animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <img
              src={photo.photo_url}
              alt={`Photo ${photo.photo_order}`}
              className="w-full h-full object-cover rounded-xl border-2 border-white/10 group-hover:border-pink-500/50 transition-all duration-300"
            />
            
            {/* Photo controls overlay with Thursday styling */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center gap-3">
              {!photo.is_primary && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSetPrimary(photo.photo_order)}
                  className="glass-light border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500 hover:scale-110 transition-all duration-300 interactive"
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
                variant="destructive"
                onClick={() => handleDeletePhoto(photo.photo_order)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 border-0 hover:scale-110 transition-all duration-300 interactive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Floating sparkles on hover */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Sparkles className="absolute top-2 right-2 w-4 h-4 text-pink-400 animate-pulse" />
              <Heart className="absolute bottom-2 left-2 w-3 h-3 text-purple-400 animate-bounce" />
            </div>
          </div>
        ))}
        
        {/* Upload area with Thursday styling */}
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
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
              input.click();
            }}
          >
            {uploading ? (
              <div className="text-center animate-fade-in">
                <div className="loading-heart mx-auto mb-3"></div>
                <p className="text-sm text-pink-300 font-medium">Uploading...</p>
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
                <Sparkles className="w-4 h-4 text-purple-400 mx-auto mt-2 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload instructions with Thursday styling */}
      <div className="glass-light p-4 rounded-xl border border-white/10 text-xs text-gray-300 space-y-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-pink-400" />
          <span className="font-semibold text-white">Photo Guidelines</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
          <div>• Upload up to {maxPhotos} photos</div>
          <div>• Maximum file size: 5MB</div>
          <div>• Supported formats: JPG, PNG, GIF</div>
          <div>• First photo will be your primary photo</div>
        </div>
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