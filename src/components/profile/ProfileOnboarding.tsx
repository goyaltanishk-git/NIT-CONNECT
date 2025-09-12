import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Plus, X } from "lucide-react";
import { useUserProfile, CreateProfileData } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";

interface ProfileOnboardingProps {
  onComplete: () => void;
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

export function ProfileOnboarding({ onComplete }: ProfileOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateProfileData>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "male",
    interested_in: "everyone",
    bio: "",
    year_of_study: "",
    branch: "",
    hometown: "",
    photos: [],
    interests: []
  });

  const { createProfile, updating, uploadPhoto } = useUserProfile();
  const { toast } = useToast();

  const steps = [
    { title: "Basic Info", description: "Tell us about yourself" },
    { title: "Academic Details", description: "Your college information" },
    { title: "About You", description: "Write a bio and add interests" },
    { title: "Photos", description: "Add some photos" }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await createProfile(formData);
      if (result.success) {
        toast({
          title: "Welcome to NIT Connect!",
          description: "Your profile has been created successfully."
        });
        onComplete();
      }
    } catch (error) {
      console.error('Profile creation error:', error);
    }
  };

  const addInterest = (interest: string) => {
    if (interest && !formData.interests?.includes(interest) && (formData.interests?.length || 0) < 10) {
      setFormData(prev => ({
        ...prev,
        interests: [...(prev.interests || []), interest]
      }));
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests?.filter(i => i !== interest) || []
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.first_name && formData.last_name && formData.date_of_birth && formData.gender && formData.interested_in;
      case 1:
        return formData.year_of_study && formData.branch && formData.hometown;
      case 2:
        return formData.bio && formData.bio.length > 20;
      case 3:
        return true; // Photos are optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Welcome to NIT Connect!</CardTitle>
          <div className="text-center text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 0: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>

              <div>
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: "male" | "female" | "other") => 
                    setFormData(prev => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Interested In</Label>
                <Select
                  value={formData.interested_in}
                  onValueChange={(value: "male" | "female" | "other" | "everyone") => 
                    setFormData(prev => ({ ...prev, interested_in: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Men</SelectItem>
                    <SelectItem value="female">Women</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="everyone">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 1: Academic Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Year of Study</Label>
                <Select
                  value={formData.year_of_study}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, year_of_study: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your year" />
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
                <Label>Branch</Label>
                <Select
                  value={formData.branch}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map(branch => (
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
                  onChange={(e) => setFormData(prev => ({ ...prev, hometown: e.target.value }))}
                  placeholder="Where are you from?"
                />
              </div>
            </div>
          )}

          {/* Step 2: About You */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">Tell us about yourself</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Write a brief bio about yourself, your interests, what you're looking for..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.bio?.length || 0}/500 characters (minimum 20)
                </p>
              </div>

              <div>
                <Label>Interests (Select up to 10)</Label>
                
                {/* Selected interests */}
                {formData.interests && formData.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="cursor-pointer">
                        <span onClick={() => removeInterest(interest)} className="flex items-center">
                          {interest}
                          <X className="h-3 w-3 ml-1" />
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Available interests */}
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_INTERESTS
                    .filter(interest => !formData.interests?.includes(interest))
                    .map(interest => (
                      <Badge
                        key={interest}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => addInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Add Your Photos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add at least one photo to get started. You can add more later!
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {formData.photos?.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        photos: prev.photos?.filter((_, i) => i !== index) || []
                      }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {(!formData.photos || formData.photos.length < 6) && (
                  <div
                    className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const result = await uploadPhoto(file);
                          if (result.success && result.url) {
                            setFormData(prev => ({
                              ...prev,
                              photos: [...(prev.photos || []), result.url!]
                            }));
                          }
                        }
                      };
                      input.click();
                    }}
                  >
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Add Photo</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={updating || !canProceed()}
              >
                {updating ? "Creating Profile..." : "Complete Profile"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}