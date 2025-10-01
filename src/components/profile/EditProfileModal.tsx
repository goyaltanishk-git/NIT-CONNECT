// src/components/profile/EditProfileModal.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";

// Define the profile type that matches your database schema
interface ProfileType {
  bio: string;
  branch: string;
  first_name: string;
  last_name: string;
  hometown: string;
  year_of_study: string;
  height: string | number;
  date_of_birth: string;
  email: string;
  gender: "male" | "female";
  interested_in: "male" | "female";
  phone_number: string;
  instagram_handle: string;
  verification_status: string;
  is_verified: boolean;
  is_active: boolean;
  incognito_mode: boolean;
  hide_year_branch: boolean;
  latitude: number | null;
  longitude: number | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
  verification_document_url: string | null;
  photos: string[];
  interests: string[];
}

interface EditProfileModalProps {
  user: ProfileType;
  onSave: (updatedUser: Partial<ProfileType>) => void;
}

const BRANCHES = [
  "Computer Science", "Electronics & Communication", "Mechanical Engineering",
  "Civil Engineering", "Electrical Engineering", "Chemical Engineering",
  "Information Technology", "Biotechnology", "Mathematics", "Physics", "Chemistry"
];

export function EditProfileModal({ user, onSave }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize form data directly from the user prop
  const [formData, setFormData] = useState<Partial<ProfileType>>(user);

  const handleSave = () => {
    onSave(formData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.first_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.last_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell others about yourself..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={formData.year_of_study || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, year_of_study: value }))}>
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
            
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={formData.branch || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}>
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

          <div className="space-y-2">
            <Label htmlFor="hometown">Hometown</Label>
            <Input
              id="hometown"
              value={formData.hometown || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, hometown: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={formData.gender || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as "male" | "female" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Interested In</Label>
              <Select value={formData.interested_in || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, interested_in: value as "male" | "female" }))}>
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

          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              value={formData.height || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
              placeholder="e.g., 5'8\" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone_number || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="Your phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram Handle</Label>
            <Input
              id="instagram"
              value={formData.instagram_handle || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value }))}
              placeholder="@your_handle"
            />
          </div>

          {/* Photos and Interests can be added here later */}
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
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