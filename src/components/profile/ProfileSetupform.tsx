import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { X, Camera } from 'lucide-react';
import { AuthService, Profile } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { v4 as uuidv4 } from 'uuid';
import { InterestsService } from "@/lib/interests-service";

const POPULAR_INTERESTS = [
  "Music", "Sports", "Travel", "Photography", "Reading", "Movies", "Gaming", "Cooking",
  "Art", "Dancing", "Hiking", "Fitness", "Technology", "Fashion", "Food", "Nature",
  "Writing", "Swimming", "Cycling", "Yoga", "Meditation", "Painting", "Singing",
  "Guitar", "Piano", "Football", "Basketball", "Cricket", "Tennis", "Badminton"
];

interface ProfileSetupFormProps {
  userEmail: string;
  onComplete: (profile: Profile) => void;
}

interface FormData {
  date_of_birth: string;
  bio: string;
  height: string;
  hometown: string;
  phone_number: string;
  instagram_handle: string;
}

interface PhotoFile {
  file: File;
  preview: string;
  order: number;
}

export function ProfileSetupForm({ userEmail, onComplete }: ProfileSetupFormProps) {
  const [formData, setFormData] = useState<FormData>({
    date_of_birth: '', bio: '', height: '', hometown: '', phone_number: '', instagram_handle: ''
  });

  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [currentInterest, setCurrentInterest] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await AuthService.getUserProfile(userEmail);
        if (profile) setUserProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    loadUserProfile();
  }, [userEmail]);

  // (Helper functions like getMinDate, handleInputChange, etc. remain the same)
  const getMinDate = () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    return minDate.toISOString().split('T')[0];
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: PhotoFile = { file, preview: e.target?.result as string, order: photos.length + 1 };
          setPhotos(prev => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated.map((photo, i) => ({ ...photo, order: i + 1 })));
  };

  const addInterest = (interestToAdd: string) => {
    const formattedInterest = interestToAdd.trim();
    if (formattedInterest && !interests.includes(formattedInterest) && interests.length < 10) {
      setInterests([...interests, formattedInterest]);
      setCurrentInterest('');
      setError('');
    }
  };

  const handleAddInterestFromInput = () => {
    addInterest(currentInterest);
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterestFromInput();
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const validateForm = (): boolean => {
    if (photos.length === 0) { setError('At least one photo is required'); return false; }
    if (!formData.date_of_birth) { setError('Date of birth is required'); return false; }
    if (interests.length < 3) { setError('Please add at least 3 interests'); return false; }
    const birthDate = new Date(formData.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (age < 16 || (age === 16 && monthDiff < 0) || (age === 16 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      setError('You must be at least 16 years old');
      return false;
    }
    if (formData.height && (parseInt(formData.height) < 120 || parseInt(formData.height) > 250)) {
      setError('Height must be between 120 and 250 cm');
      return false;
    }
    return true;
  };

  // --- REWRITTEN: This function now provides "all or nothing" behavior ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const uploadedPhotoPaths: string[] = [];
    
    try {
      // --- Stage 1: Upload photos to storage ---
      // We collect their paths so we can clean them up if anything fails later.
      const photoUploadPromises = photos.map(async (photo) => {
        const file = photo.file;
        const fileExt = file.name.split('.').pop();
        const fileName = `${userEmail}/${uuidv4()}.${fileExt}`;

        const { error } = await supabase.storage.from('user-photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        
        uploadedPhotoPaths.push(fileName); // Track successful uploads for potential cleanup
        const { data: { publicUrl } } = supabase.storage.from('user-photos').getPublicUrl(fileName);
        return { url: publicUrl, order: photo.order };
      });
      
      const uploadedPhotos = await Promise.all(photoUploadPromises);

      // --- Stage 2: Prepare all database records ---
      const profileUpdatePayload = {
        date_of_birth: formData.date_of_birth,
        bio: formData.bio.trim(),
        is_active: true,
        height: formData.height ? parseInt(formData.height) : null,
        hometown: formData.hometown.trim() || null,
        phone_number: formData.phone_number.trim() || null,
        instagram_handle: formData.instagram_handle.trim() || null,
      };

      const photoInsertPayload = uploadedPhotos.map((p, index) => ({
        user_email: userEmail,
        photo_url: p.url,
        photo_order: p.order,
        is_primary: index === 0,
        is_verified: false,
      }));

      // --- Stage 3: Execute all database operations ---
      
      // We start by clearing any old records to prevent duplicate key errors on retry
      await supabase.from('user_photos').delete().eq('user_email', userEmail);
      
      // Then, we execute the new updates
      const { error: profileError } = await supabase.from('profiles').update(profileUpdatePayload).eq('email', userEmail);
      if (profileError) throw profileError; // If this fails, we jump to the catch block

      const { error: photosError } = await supabase.from('user_photos').insert(photoInsertPayload);
      if (photosError) throw photosError; // If this fails, we jump to the catch block

      await InterestsService.updateUserInterests(userEmail, interests); // This service already clears old interests

      // --- Success ---
      const finalProfile = await AuthService.getUserProfile(userEmail);
      onComplete(finalProfile!);

    } catch (error: any) {
      // --- Failure and Cleanup ---
      // If any part of the process failed, we land here.
      console.error('Error completing profile setup:', error);
      setError(error.message || 'Failed to save profile. Please try again.');

      // CRITICAL: Clean up any photos that were successfully uploaded to storage
      if (uploadedPhotoPaths.length > 0) {
        console.log('An error occurred. Cleaning up orphaned photos from storage...');
        await supabase.storage.from('user-photos').remove(uploadedPhotoPaths);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {userProfile ? `Hi ${userProfile.first_name} ${userProfile.last_name}!` : 'Complete Your Profile'}
          </CardTitle>
          <CardDescription>
            Let's set up your profile. Fields with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            {/* Photos Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Photos *</Label>
              <p className="text-sm text-gray-600">Add at least one photo. The first is your primary photo.</p>
              <div className="grid grid-cols-3 gap-4">{photos.map((photo, index) => (<div key={index} className="relative aspect-square"><img src={photo.preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover rounded-lg border-2 border-gray-200" /><button type="button" onClick={() => removePhoto(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X size={16} /></button>{index === 0 && <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">Primary</div>}</div>))}{photos.length < 6 && (<button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors"><Camera size={24} className="text-gray-400 mb-2" /><span className="text-sm text-gray-600">Add Photo</span></button>)}</div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            </div>

            {/* Date of Birth */}
            <div>
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={(e) => handleInputChange('date_of_birth', e.target.value)} max={getMinDate()} required />
              <p className="text-xs text-gray-500 mt-1">You must be at least 16 years old.</p>
            </div>
            
            {/* Bio Field */}
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="Tell us a little about yourself..." rows={3} />
            </div>

            {/* Interests Section */}
            <div className="space-y-3">
              <Label htmlFor="interests" className="text-base font-semibold">Interests *</Label>
              <p className="text-sm text-gray-600">Add at least 3 interests (max 10). Press Enter or click Add.</p>
              <div className="flex gap-2">
                <Input id="interests" value={currentInterest} onChange={(e) => setCurrentInterest(e.target.value)} onKeyDown={handleInterestKeyDown} placeholder="e.g., Music, Coding, Hiking" maxLength={25} disabled={interests.length >= 10} />
                <Button type="button" onClick={handleAddInterestFromInput} disabled={interests.length >= 10}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 min-h-[2rem]">
                {interests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="flex items-center gap-1.5 py-1 px-2">
                    {interest}
                    <button type="button" onClick={() => removeInterest(interest)} className="rounded-full hover:bg-muted-foreground/20 p-0.5"><X size={12} /></button>
                  </Badge>
                ))}
              </div>
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium">Suggestions:</Label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_INTERESTS
                    .filter(interest => !interests.includes(interest))
                    .slice(0, 15)
                    .map((interest) => (
                    <Button key={interest} type="button" variant="outline" size="sm" onClick={() => addInterest(interest)} className="text-xs h-7">
                      + {interest}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="height">Height (cm)</Label><Input id="height" type="number" min="120" max="250" value={formData.height} onChange={(e) => handleInputChange('height', e.target.value)} placeholder="170" /></div><div><Label htmlFor="hometown">Hometown</Label><Input id="hometown" value={formData.hometown} onChange={(e) => handleInputChange('hometown', e.target.value)} placeholder="Where are you from?" /></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="phone_number">Phone Number</Label><Input id="phone_number" type="tel" value={formData.phone_number} onChange={(e) => handleInputChange('phone_number', e.target.value)} placeholder="+1234567890" /></div><div><Label htmlFor="instagram_handle">Instagram Handle</Label><Input id="instagram_handle" value={formData.instagram_handle} onChange={(e) => handleInputChange('instagram_handle', e.target.value)} placeholder="@username" /></div></div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              {loading ? 'Saving Profile...' : 'Complete Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}