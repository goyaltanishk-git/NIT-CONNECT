import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { X, Camera, Heart, Sparkles, User, Calendar, MapPin, Phone, Instagram } from 'lucide-react';
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

const MAX_PHOTOS = 3; // Set max photos constant

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
  
  // 🆕 State for phone number validation
  const [phoneError, setPhoneError] = useState<string | null>(null);

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

  // Helper functions
  const getMinDate = () => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    return minDate.toISOString().split('T')[0];
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // 🆕 Phone number validation handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    
    setFormData(prev => ({ ...prev, phone_number: numericValue }));

    if (numericValue === '') {
      setPhoneError(null); // No error if empty
    } else if (numericValue.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
    } else {
      setPhoneError(null); // Valid
    }
    setError(''); // Clear global error
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`You can only upload a maximum of ${MAX_PHOTOS} photos.`);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear input
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: PhotoFile = { file, preview: e.target?.result as string, order: photos.length + 1 };
          setPhotos(prev => (prev.length < MAX_PHOTOS ? [...prev, newPhoto] : prev));
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
    // Required fields
    if (photos.length === 0) { setError('At least one photo is required'); return false; }
    if (!formData.date_of_birth) { setError('Date of birth is required'); return false; }
    if (interests.length < 3) { setError('Please add at least 3 interests'); return false; }
    
    if (!formData.hometown.trim()) { setError('Hometown is required'); return false; }
    if (!formData.height) { setError('Height is required'); return false; }

    // Date of Birth validation
    const birthDate = new Date(formData.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (age < 16 || (age === 16 && monthDiff < 0) || (age === 16 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      setError('You must be at least 16 years old');
      return false;
    }

    // Height range validation
    const height = parseInt(formData.height);
    if (height < 120 || height > 250) {
      setError('Height must be between 120 and 250 cm');
      return false;
    }
    
    // 🆕 Check for phone error
    if (phoneError) {
      setError(phoneError);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    const uploadedPhotoPaths: string[] = [];
    
    try {
      // Stage 1: Upload photos to storage
      const photoUploadPromises = photos.map(async (photo) => {
        const file = photo.file;
        const fileExt = file.name.split('.').pop();
        const fileName = `${userEmail}/${uuidv4()}.${fileExt}`;

        const { error } = await supabase.storage.from('user-photos').upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        
        uploadedPhotoPaths.push(fileName);
        const { data: { publicUrl } } = supabase.storage.from('user-photos').getPublicUrl(fileName);
        return { url: publicUrl, order: photo.order };
      });
      
      const uploadedPhotos = await Promise.all(photoUploadPromises);

      // Stage 2: Prepare all database records
      const profileUpdatePayload = {
        date_of_birth: formData.date_of_birth,
        bio: formData.bio.trim(),
        is_active: true,
        height: parseInt(formData.height),
        hometown: formData.hometown.trim(),
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

      // Stage 3: Execute all database operations
      await supabase.from('user_photos').delete().eq('user_email', userEmail);
      
      const { error: profileError } = await supabase.from('profiles').update(profileUpdatePayload).eq('email', userEmail);
      if (profileError) throw profileError;

      const { error: photosError } = await supabase.from('user_photos').insert(photoInsertPayload);
      if (photosError) throw photosError;

      await InterestsService.updateUserInterests(userEmail, interests);

      // Success
      const finalProfile = await AuthService.getUserProfile(userEmail);
      onComplete(finalProfile!);

    } catch (error: any) {
      console.error('Error completing profile setup:', error);
      setError(error.message || 'Failed to save profile. Please try again.');

      if (uploadedPhotoPaths.length > 0) {
        console.log('An error occurred. Cleaning up orphaned photos from storage...');
        await supabase.storage.from('user-photos').remove(uploadedPhotoPaths);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-pink-500/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Background gradient overlay */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none"></div>

      <Card className="w-full max-w-2xl glass border-white/10 shadow-2xl animate-fade-in">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 rounded-full animate-heartbeat">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 bg-pink-500/50 rounded-full blur-xl animate-pulse-glow"></div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-pink-400 animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold gradient-text-animated">
            {userProfile ? `Hi ${userProfile.first_name} ${userProfile.last_name}!` : 'Complete Your Profile'}
          </CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            Let's set up your profile. Fields with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <Alert variant="destructive" className="glass-light border-red-500/30 bg-red-500/10">
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {/* Photos Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-pink-400" />
                <Label className="text-lg font-semibold text-white">Photos *</Label>
              </div>
              <p className="text-sm text-gray-400">Add 1 to 3 photos. The first is your primary photo.</p>
              <div className="grid grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img 
                      src={photo.preview} 
                      alt={`Upload ${index + 1}`} 
                      className="w-full h-full object-cover rounded-xl border-2 border-white/10 group-hover:border-pink-500/50 transition-all duration-300" 
                    />
                    <button 
                      type="button" 
                      onClick={() => removePhoto(index)} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors duration-200 shadow-lg interactive"
                    >
                      <X size={14} />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs px-2 py-1 rounded-lg font-medium">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="aspect-square border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center hover:border-pink-500/50 hover:bg-pink-500/5 transition-all duration-300 group interactive"
                  >
                    <Camera size={28} className="text-gray-400 group-hover:text-pink-400 mb-2 transition-colors duration-300" />
                    <span className="text-sm text-gray-400 group-hover:text-pink-400 transition-colors duration-300 font-medium">Add Photo</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            </div>

            {/* Date of Birth */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-pink-400" />
                <Label htmlFor="date_of_birth" className="text-white font-medium">Date of Birth *</Label>
              </div>
              <Input 
                id="date_of_birth" 
                type="date" 
                value={formData.date_of_birth} 
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)} 
                max={getMinDate()} 
                className="glass-light border-white/20 text-white focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300"
                required 
              />
              <p className="text-xs text-gray-400 mt-1">You must be at least 16 years old.</p>
            </div>
            
            {/* Bio Field */}
            <div className="space-y-3">
              <Label htmlFor="bio" className="text-white font-medium">Bio (Optional)</Label>
              <Textarea 
                id="bio" 
                value={formData.bio} 
                onChange={(e) => handleInputChange('bio', e.target.value)} 
                placeholder="Tell us a little about yourself..." 
                rows={4} 
                className="glass-light border-white/20 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300 resize-none"
              />
            </div>

            {/* Interests Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <Label htmlFor="interests" className="text-lg font-semibold text-white">Interests *</Label>
              </div>
              <p className="text-sm text-gray-400">Add at least 3 interests (max 10). Press Enter or click Add.</p>
              <div className="flex gap-3">
                <Input 
                  id="interests" 
                  value={currentInterest} 
                  onChange={(e) => setCurrentInterest(e.target.value)} 
                  onKeyDown={handleInterestKeyDown} 
                  placeholder="e.g., Music, Coding, Hiking" 
                  maxLength={25} 
                  disabled={interests.length >= 10} 
                  className="glass-light border-white/20 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300"
                />
                <Button 
                  type="button" 
                  onClick={handleAddInterestFromInput} 
                  disabled={interests.length >= 10}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white px-6 transition-all duration-300 hover:scale-105 interactive"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 min-h-[2rem]">
                {interests.map((interest) => (
                  <Badge 
                    key={interest} 
                    variant="secondary" 
                    className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30 flex items-center gap-2 py-2 px-3 hover:scale-105 transition-transform duration-200 interactive"
                  >
                    {interest}
                    <button 
                      type="button" 
                      onClick={() => removeInterest(interest)} 
                      className="rounded-full hover:bg-white/20 p-1 transition-colors duration-200"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-medium text-gray-300">Suggestions:</Label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_INTERESTS
                    .filter(interest => !interests.includes(interest))
                    .slice(0, 15)
                    .map((interest) => (
                    <Button 
                      key={interest} 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addInterest(interest)} 
                      className="text-xs h-8 glass-light border-white/20 text-gray-300 hover:bg-pink-500/20 hover:border-pink-500/50 hover:text-pink-300 transition-all duration-300 hover:scale-105 interactive"
                    >
                      + {interest}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold gradient-text-animated">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-pink-400" />
                    <Label htmlFor="height" className="text-white font-medium">Height (cm) *</Label>
                  </div>
                  <Input 
                    id="height" 
                    type="number" 
                    min="120" 
                    max="250" 
                    value={formData.height} 
                    onChange={(e) => handleInputChange('height', e.target.value)} 
                    placeholder="170" 
                    className="glass-light border-white/20 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-pink-400" />
                    <Label htmlFor="hometown" className="text-white font-medium">Hometown *</Label>
                  </div>
                  <Input 
                    id="hometown" 
                    value={formData.hometown} 
                    onChange={(e) => handleInputChange('hometown', e.target.value)} 
                    placeholder="Where are you from?" 
                    className="glass-light border-white/20 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-pink-400" />
                    <Label htmlFor="phone_number" className="text-white font-medium">Phone Number (Optional)</Label>
                  </div>
                  <Input 
                    id="phone_number" 
                    type="tel" 
                    value={formData.phone_number} 
                    onChange={handlePhoneChange} // 🆕 Use new handler
                    placeholder="10 digit phone number" 
                    maxLength={10} // 🆕 Add maxLength
                    className="glass-light border-white/20 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300"
                  />
                  {/* 🆕 Show error message if it exists */}
                  {phoneError && <p className="text-xs text-red-400 mt-1">{phoneError}</p>}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <Label htmlFor="instagram_handle" className="text-white font-medium">Instagram Handle (Optional)</Label>
                  </div>
                  <Input 
                    id="instagram_handle" 
                    value={formData.instagram_handle} 
                    onChange={(e) => handleInputChange('instagram_handle', e.target.value)} 
                    placeholder="@username" 
                    className="glass-light border-white/20 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || !!phoneError} // 🆕 Disable button if phone error
              className="w-full h-14 bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow interactive"
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving Profile...</span>
                </div>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}