
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";

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
  profile: ProfileType;  // Changed from 'user' to 'profile'
  onSave: (updatedUser: Partial<ProfileType>) => Promise<void>;
}

const BRANCHES = [
  "Computer Science", "Electronics & Communication", "Mechanical Engineering",
  "Civil Engineering", "Electrical Engineering", "Chemical Engineering",
  "Information Technology", "Biotechnology", "Mathematics", "Physics", "Chemistry"
];

export function EditProfileModal({ profile, onSave }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  
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

  const handleSave = async () => {
    try {
      await onSave(formData);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      // Handle error (maybe show toast)
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Basic Info */}
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.first_name || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.last_name || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell others about yourself..."
              className="min-h-[100px]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.date_of_birth || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label>Year</Label>
            <Select
              value={formData.year_of_study || "1st Year"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, year_of_study: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Year">1st Year</SelectItem>
                <SelectItem value="2nd Year">2nd Year</SelectItem>
                <SelectItem value="3rd Year">3rd Year</SelectItem>
                <SelectItem value="4th Year">4th Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Branch</Label>
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

          <div className="grid gap-2">
            <Label htmlFor="hometown">Hometown</Label>
            <Input
              id="hometown"
              value={formData.hometown || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, hometown: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label>Gender</Label>
            <Select
              value={formData.gender || "male"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as "male" | "female" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Interested In</Label>
            <Select
              value={formData.interested_in || "female"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, interested_in: value as "male" | "female" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              value={formData.height || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, height: parseInt(e.target.value) || null }))}
              placeholder="e.g., 175"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled // Usually email shouldn't be editable
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={formData.phone_number || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="Your phone number"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="instagramHandle">Instagram Handle</Label>
            <Input
              id="instagramHandle"
              value={formData.instagram_handle || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value }))}
              placeholder="@your_handle"
            />
          </div>

          {/* Photos and Interests can be added here later */}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
