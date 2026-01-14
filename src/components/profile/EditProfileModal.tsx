import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Tag, ArrowLeft } from "lucide-react"; 
import { UserPhoto } from "@/lib/photoservice";
import { InterestsService } from "../../lib/interests-service";
import { useToast } from "@/hooks/use-toast";

// Define the profile type that matches your database schema
export interface ProfileType {
  bio?: string | null;
  branch?: string | null;
  first_name: string;
  last_name: string;
  hometown?: string | null;
  year_of_study?: string | null;
  height?: number | null;
  date_of_birth: string;
  email: string;
  gender: "male" | "female";
  interested_in: "male" | "female";
  phone_number?: string | null;
  instagram_handle?: string | null;
  verification_status?: string | null;
  is_verified?: boolean | null;
  is_active?: boolean | null;
  incognito_mode?: boolean | null;
  hide_year_branch?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  last_active_at?: string | null;
  created_at: string;
  updated_at: string;
  verification_document_url?: string | null;
  photos?: string[];
  interests?: string[];
}

interface EditProfileModalProps {
  profile: ProfileType;
  onSave: (updatedUser: Partial<ProfileType>) => Promise<void>;
  // Props kept for compatibility, though photos are no longer displayed here
  photos: UserPhoto[];
  onPhotosUpdate: (updatedPhotos: UserPhoto[]) => void;
  photosLoading: boolean;
  children: React.ReactNode; 
}

const BRANCHES = [
  "Computer Science", "Electronics & Communication", "Mechanical Engineering",
  "Civil Engineering", "Electrical Engineering", "Chemical Engineering",
  "Information Technology", "Biotechnology", "Mathematics", "Physics", "Chemistry"
];

const POPULAR_INTERESTS = [
  "Music", "Sports", "Travel", "Photography", "Reading", "Movies", "Gaming", "Cooking",
  "Art", "Dancing", "Hiking", "Fitness", "Technology", "Fashion", "Food", "Nature",
  "Writing", "Swimming", "Cycling", "Yoga", "Meditation", "Painting", "Singing",
  "Guitar", "Piano", "Football", "Basketball", "Cricket", "Tennis", "Badminton"
];

export function EditProfileModal({
  profile,
  onSave,
  photos, // Kept in destructuring to satisfy interface
  onPhotosUpdate,
  photosLoading,
  children 
}: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const [interests, setInterests] = useState<string[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const { toast } = useToast();
  
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Initialize form data from profile with safe defaults
  const [formData, setFormData] = useState<Partial<ProfileType>>({
    ...profile,
    bio: profile.bio || "",
    branch: profile.branch || "",
    hometown: profile.hometown || "",
    year_of_study: profile.year_of_study || "1st Year",
    height: profile.height || 168,
    phone_number: profile.phone_number || "",
    instagram_handle: profile.instagram_handle || "",
  });

  // Load user interests when modal opens
  const loadInterests = async () => {
    if (!profile.email) return;
    
    setInterestsLoading(true);
    try {
      const userInterests = await InterestsService.getUserInterests(profile.email);
      setInterests(userInterests);
    } catch (error) {
      toast({
        title: "Error loading interests",
        description: "Could not load your interests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInterestsLoading(false);
    }
  };

  // Handle modal open/close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadInterests();
      setFormData({
        ...profile,
        bio: profile.bio || "",
        branch: profile.branch || "",
        hometown: profile.hometown || "",
        year_of_study: profile.year_of_study || "1st Year",
        height: profile.height || 168,
        phone_number: profile.phone_number || "",
        instagram_handle: profile.instagram_handle || "",
      });
      setPhoneError(null);
    }
  };

  // Add interest
  const addInterest = (interest: string) => {
    const trimmedInterest = interest.trim();
    if (trimmedInterest && !interests.includes(trimmedInterest) && interests.length < 10) {
      setInterests([...interests, trimmedInterest]);
      setNewInterest("");
    }
  };

  // Remove interest
  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  // Handle adding new interest from input
  const handleAddNewInterest = () => {
    if (newInterest.trim()) {
      addInterest(newInterest);
    }
  };

  // Handle key press in interest input
  const handleInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewInterest();
    }
  };

  // Phone number validation handler
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');
    
    setFormData(prev => ({ ...prev, phone_number: numericValue }));

    if (numericValue === '') {
      setPhoneError(null);
    } else if (numericValue.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
    } else {
      setPhoneError(null);
    }
  };

  const handleSave = async () => {
    if (phoneError) {
      toast({
        title: "Invalid Input",
        description: phoneError,
        variant: "destructive",
      });
      return;
    }

    try {
      const editableData: Partial<ProfileType> = {
        bio: formData.bio,
        hometown: formData.hometown,
        height: formData.height,
        phone_number: formData.phone_number,
        instagram_handle: formData.instagram_handle,
        date_of_birth: formData.date_of_birth,
      };
      
      await onSave(editableData);
      
      await InterestsService.updateUserInterests(profile.email, interests);
      
      setIsOpen(false);
      toast({
        title: "Profile updated",
        description: "Your profile and interests have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center gap-2">
          {/* Go Back Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)} 
            className="h-8 w-8 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          
          {/* 1. First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                disabled 
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                disabled 
              />
            </div>
          </div>

          {/* 2. Year & Branch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year_of_study">Year</Label>
              <Select
                value={formData.year_of_study || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, year_of_study: value }))}
                disabled 
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select
                value={formData.branch || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}
                disabled 
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. Gender & Height */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as "male" | "female" }))}
                disabled 
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, height: parseInt(e.target.value) || null }))}
                placeholder="e.g., 175"
              />
            </div>
          </div>

          {/* 4. Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled
            />
          </div>

          {/* 5. Date of Birth */}
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
            />
          </div>

          {/* 6. Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell others about yourself..."
              className="min-h-[100px]"
            />
          </div>

          {/* 7. Hometown */}
          <div>
            <Label htmlFor="hometown">Hometown</Label>
            <Input
              id="hometown"
              value={formData.hometown || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, hometown: e.target.value }))}
            />
          </div>

          {/* 8. Interests Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Tag className="w-5 h-5" />
              <Label className="text-base font-semibold">Interests</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Add up to 10 interests to help others connect with you.
            </p>

            {interestsLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {interest}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeInterest(interest)}
                      />
                    </Badge>
                  ))}
                </div>

                {interests.length < 10 && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyPress={handleInterestKeyPress}
                        placeholder="Add an interest..."
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleAddNewInterest}
                        disabled={!newInterest.trim()}
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Popular interests:</Label>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_INTERESTS
                          .filter(interest => !interests.includes(interest))
                          .slice(0, 15)
                          .map((interest) => (
                          <Button
                            key={interest}
                            variant="outline"
                            size="sm"
                            onClick={() => addInterest(interest)}
                            className="text-xs h-7"
                          >
                            + {interest}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {interests.length >= 10 && (
                  <p className="text-sm text-muted-foreground">
                    You've reached the maximum of 10 interests.
                  </p>
                )}
              </>
            )}
          </div>

          {/* 9. Phone Number */}
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number || ""}
              onChange={handlePhoneChange} 
              placeholder="10 digit phone number"
              maxLength={10} 
            />
            {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
          </div>

          {/* 10. Instagram Handle */}
          <div>
            <Label htmlFor="instagram_handle">Instagram Handle</Label>
            <Input
              id="instagram_handle"
              value={formData.instagram_handle || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value }))}
              placeholder="@your_handle"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={!!phoneError}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}