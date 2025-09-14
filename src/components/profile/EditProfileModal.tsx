// src/components/profile/EditProfileModal.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";
import { Profile } from "@/lib/auth"; // Import the correct Profile type

interface EditProfileModalProps {
  // Use the actual Profile type for consistency
  user: Profile;
  onSave: (updatedUser: Partial<Profile>) => void;
}

const BRANCHES = [
  "Computer Science", "Electronics & Communication", "Mechanical Engineering",
  "Civil Engineering", "Electrical Engineering", "Chemical Engineering",
  "Information Technology", "Biotechnology", "Mathematics", "Physics", "Chemistry"
];

export function EditProfileModal({ user, onSave }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Initialize form data directly from the user prop
  const [formData, setFormData] = useState<Partial<Profile>>(user);

  const handleSave = () => {
    onSave(formData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-4">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-1">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell others about yourself..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth?.split('T')[0] || ''} // Format for date input
                  onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Select value={formData.year_of_study || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, year_of_study: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select value={formData.branch || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BRANCHES.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hometown">Hometown</Label>
              <Input
                id="hometown"
                value={formData.hometown || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hometown: e.target.value }))}
              />
            </div>
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