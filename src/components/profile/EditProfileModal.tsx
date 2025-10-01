import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, X, Plus, Edit } from "lucide-react";

interface UserProfile {
  email: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  interested_in?: string;
  bio?: string;
  year_of_study?: string;
  branch?: string;
  hometown?: string;
  height?: number | null;
  interests?: string[];
  photos?: string[];
}

interface EditProfileModalProps {
  user: UserProfile;
  onSave: (updatedUser: UserProfile) => void;
}

const AVAILABLE_INTERESTS = [
  "coding", "music", "travel", "photography", "books", "coffee", "gaming", "startup",
  "fitness", "movies", "art", "cooking", "dancing", "hiking", "reading", "sports",
  "yoga", "meditation", "volunteering", "languages", "design", "entrepreneurship"
];

const BRANCHES = [
  "Computer Science", "Electronics & Communication", "Mechanical Engineering",
  "Civil Engineering", "Electrical Engineering", "Chemical Engineering",
  "Information Technology", "Biotechnology", "Mathematics", "Physics", "Chemistry"
];

export function EditProfileModal({ user, onSave }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    ...user,
    interests: user.interests || [],
    photos: user.photos || [],
  });
  const [newInterest, setNewInterest] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave(formData);
    setIsOpen(false);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (formData.photos?.length ?? 0) < 6) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto = e.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          photos: [...(prev.photos || []), newPhoto],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index),
    }));
  };

  const addInterest = (interest: string) => {
    if (
      interest &&
      !(formData.interests || []).includes(interest) &&
      (formData.interests?.length ?? 0) < 10
    ) {
      setFormData((prev) => ({
        ...prev,
        interests: [...(prev.interests || []), interest],
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests?.filter((i) => i !== interest),
    }));
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

        <div className="space-y-6">
          {/* Profile Photo */}
          <div className="text-center">
            <div className="relative inline-block">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.photos?.[0]} />
                <AvatarFallback className="text-2xl">
                  {formData.first_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, first_name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Tell others about yourself..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year_of_study">Year</Label>
                <Select
                  value={formData.year_of_study || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, year_of_study: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      height: Number(e.target.value),
                    }))
                  }
                  placeholder="170"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select
                value={formData.branch || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, branch: value }))
                }
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

            <div>
              <Label htmlFor="hometown">Hometown</Label>
              <Input
                id="hometown"
                value={formData.hometown || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hometown: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Photos */}
          <div>
            <Label>Photos ({formData.photos?.length ?? 0}/6)</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {formData.photos?.map((photo, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {(formData.photos?.length ?? 0) < 6 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Interests */}
          <div>
            <Label>Interests ({formData.interests?.length ?? 0}/10)</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-3">
              {formData.interests?.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="capitalize cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeInterest(interest)}
                >
                  {interest} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Select value={newInterest} onValueChange={setNewInterest}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add an interest..." />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_INTERESTS.filter(
                    (interest) => !(formData.interests || []).includes(interest)
                  ).map((interest) => (
                    <SelectItem key={interest} value={interest} className="capitalize">
                      {interest}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => addInterest(newInterest)}
                disabled={
                  !newInterest ||
                  (formData.interests || []).includes(newInterest) ||
                  (formData.interests?.length ?? 0) >= 10
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

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
