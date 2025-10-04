import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Camera, Plus, X, Tag } from "lucide-react";
import { PhotoUpload } from "@/components/discovery/PhotoUpload";
import { PhotoService, UserPhoto } from "@/lib/photoservice";
import { InterestsService } from "@/lib/interests-service";
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

export function EditProfileModal({ profile, onSave }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const { toast } = useToast();

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

  // Load user photos when modal opens
  const loadPhotos = async () => {
    if (!profile.email) return;
    
    setPhotosLoading(true);
    try {
      console.log("[EditProfileModal] Loading photos for:", profile.email);
      const userPhotos = await PhotoService.getUserPhotos(profile.email);
      console.log("[EditProfileModal] Photos loaded:", userPhotos);
      setPhotos(userPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
      toast({
        title: "Error loading photos",
        description: "Could not load your photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPhotosLoading(false);
    }
  };

  // Load user interests when modal opens
  const loadInterests = async () => {
    if (!profile.email) return;
    
    setInterestsLoading(true);
    try {
      console.log("[EditProfileModal] Loading interests for:", profile.email);
      const userInterests = await InterestsService.getUserInterests(profile.email);
      console.log("[EditProfileModal] Interests loaded:", userInterests);
      setInterests(userInterests);
    } catch (error) {
      console.error('Error loading interests:', error);
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
      console.log("[EditProfileModal] Modal opened, loading data...");
      loadPhotos();
      loadInterests();
    }
  };

  const handlePhotosUpdate = (updatedPhotos: UserPhoto[]) => {
    console.log("[EditProfileModal] Photos updated:", updatedPhotos);
    setPhotos(updatedPhotos);
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

  const handleSave = async () => {
    try {
      console.log("[EditProfileModal] Saving profile:", formData);
      console.log("[EditProfileModal] Saving interests:", interests);
      
      // Save profile data
      await onSave(formData);
      
      // Save interests separately
      await InterestsService.updateUserInterests(profile.email, interests);
      
      setIsOpen(false);
      toast({
        title: "Profile updated",
        description: "Your profile and interests have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
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
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photos Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <Label className="text-base font-semibold">Photos</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Add photos to make your profile stand out. Your first photo will be your primary photo.
            </p>
            
            {photosLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <PhotoUpload
                userEmail={profile.email}
                photos={photos}
                onPhotosUpdate={handlePhotosUpdate}
                maxPhotos={6}
              />
            )}
          </div>

          {/* Interests Section */}
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
                {/* Current Interests */}
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

                {/* Add New Interest */}
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

                    {/* Popular Interests */}
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

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
          </div>

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

          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year_of_study">Year</Label>
              <Select
                value={formData.year_of_study || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, year_of_study: value }))}
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

          <div>
            <Label htmlFor="hometown">Hometown</Label>
            <Input
              id="hometown"
              value={formData.hometown || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, hometown: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as "male" | "female" }))}
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
              <Label htmlFor="interested_in">Interested In</Label>
              <Select
                value={formData.interested_in || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, interested_in: value as "male" | "female" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="Your phone number"
            />
          </div>

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
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}