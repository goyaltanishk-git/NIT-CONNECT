import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Settings, Camera, Heart, Shield, User, Edit, Ruler, Home, BookOpen, GitBranch } from "lucide-react";
import { EditProfileModal, ProfileType } from "./EditProfileModal";
import { SettingsScreen } from "../settings/SettingsScreen";
import { useState, useEffect, useCallback } from "react";
import { useUserProfile, FullProfile } from "@/hooks/useUserProfile";
import { AuthService } from "@/lib/auth";

// Imports for Photo Upload
import { PhotoUpload } from "@/components/discovery/PhotoUpload";
import { PhotoService, UserPhoto } from "@/lib/photoservice";
import { useToast } from "@/hooks/use-toast";

// Import new screens from their respective locations
import { HelpScreen } from "./HelpScreen";
import { PrivacyScreen } from "./privacyandsafety/PrivacyScreen";
import { ReportConcernScreen } from "./privacyandsafety/ReportConcernScreen";
import { PrivacyPolicyScreen } from "./privacyandsafety/PrivacyPolicyScreen";
import { TermsScreen } from "./privacyandsafety/TermsScreen";
import { SafetyCenterScreen } from "./privacyandsafety/SafetyCenterScreen";

// 🆕 Import the new dialog and its Profile type
import { MyProfileDialog, Profile as MyProfileType } from "./MyProfileDialog";

// Interface for local UI state
interface UIProfile {
  name: string;
  age: number;
  bio: string;
  year: string; 
  branch: string;
  hometown: string;
  height: string; 
  interests: string[];
}

export function ProfileScreen() {
  const { profile, loading, updateProfile } = useUserProfile();
  const { toast } = useToast(); 
  
  // State for managing which screen is visible
  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReportConcern, setShowReportConcern] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);
  
  // 🆕 State for the new profile dialog
  const [showMyProfileDialog, setShowMyProfileDialog] = useState(false);

  // Photo state (THE SINGLE SOURCE OF TRUTH)
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Transform database profile to UI profile
  const getUIProfile = (dbProfile: FullProfile | null): UIProfile => {
    if (!dbProfile) {
      return {
        name: "Loading...",
        age: 0,
        bio: "...",
        year: "...",
        branch: "...",
        hometown: "...",
        height: "...",
        interests: [],
      };
    }

    // Calculate age from date_of_birth
    const calculateAge = (dateOfBirth: string) => {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    return {
      name: `${dbProfile.first_name} ${dbProfile.last_name}`.trim(),
      age: calculateAge(dbProfile.date_of_birth || '2000-01-01'),
      bio: dbProfile.bio || "No bio yet. Add one!",
      year: dbProfile.year_of_study || "N/A",
      branch: dbProfile.branch || "N/A",
      hometown: dbProfile.hometown || "N/A",
      height: dbProfile.height ? `${dbProfile.height} cm` : "N/A",
      interests: dbProfile.interests || [],
    };
  };

  const user = getUIProfile(profile);

  // Load photos when profile is available
  useEffect(() => {
    if (profile?.email) {
      loadPhotos();
    }
  }, [profile]);

  // Function to load photos
  const loadPhotos = async () => {
    if (!profile?.email) return;
    
    setPhotosLoading(true);
    try {
      console.log("[ProfileScreen] Loading photos for:", profile.email);
      const userPhotos = await PhotoService.getUserPhotos(profile.email);
      console.log("[ProfileScreen] Photos loaded:", userPhotos);
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

  // Handler for PhotoUpload component (wrapped in useCallback)
  const handlePhotosUpdate = useCallback((updatedPhotos: UserPhoto[]) => {
    console.log("[ProfileScreen] Photos updated:", updatedPhotos);
    setPhotos(updatedPhotos);
  }, []); // Empty dependency array means this function never changes

  const handleSaveProfile = async (updatedUser: Partial<ProfileType>) => {
    if (!profile) return;

    try {
      console.log('📝 Saving profile updates:', updatedUser);
      
      const dbUpdates: any = {};
      
      if (updatedUser.bio !== undefined) dbUpdates.bio = updatedUser.bio;
      if (updatedUser.branch !== undefined) dbUpdates.branch = updatedUser.branch;
      if (updatedUser.first_name !== undefined) dbUpdates.first_name = updatedUser.first_name;
      if (updatedUser.last_name !== undefined) dbUpdates.last_name = updatedUser.last_name;
      if (updatedUser.hometown !== undefined) dbUpdates.hometown = updatedUser.hometown;
      if (updatedUser.year_of_study !== undefined) dbUpdates.year_of_study = updatedUser.year_of_study;
      if (updatedUser.height !== undefined) dbUpdates.height = updatedUser.height;
      if (updatedUser.date_of_birth !== undefined) dbUpdates.date_of_birth = updatedUser.date_of_birth;
      if (updatedUser.gender !== undefined) dbUpdates.gender = updatedUser.gender;
      if (updatedUser.interested_in !== undefined) dbUpdates.interested_in = updatedUser.interested_in;
      if (updatedUser.phone_number !== undefined) dbUpdates.phone_number = updatedUser.phone_number;
      if (updatedUser.instagram_handle !== undefined) dbUpdates.instagram_handle = updatedUser.instagram_handle;
      if (updatedUser.incognito_mode !== undefined) dbUpdates.incognito_mode = updatedUser.incognito_mode;
      if (updatedUser.hide_year_branch !== undefined) dbUpdates.hide_year_branch = updatedUser.hide_year_branch;

      await updateProfile(dbUpdates);
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      throw error; // Re-throw so EditProfileModal can handle the error
    }
  };

  const handleIncognitoToggle = async (enabled: boolean) => {
    if (!profile) return;

    try {
      await updateProfile({ incognito_mode: enabled });
      console.log('✅ Incognito mode updated:', enabled);
    } catch (error) {
      console.error('❌ Error updating incognito mode:', error);
      throw error; // Re-throw so SettingsScreen can catch it
    }
  };

  const handleLogout = () => {
    AuthService.clearCurrentUser();
    window.location.reload();
  };

  // --- Screen Rendering Logic ---
  if (showSafetyCenter) {
    return <SafetyCenterScreen onBack={() => setShowSafetyCenter(false)} />;
  }
  if (showReportConcern) {
    return <ReportConcernScreen onBack={() => setShowReportConcern(false)} />;
  }
  if (showPrivacyPolicy) {
    return <PrivacyPolicyScreen onBack={() => setShowPrivacyPolicy(false)} />;
  }
  if (showTerms) {
    return <TermsScreen onBack={() => setShowTerms(false)} />;
  }
  if (showPrivacy) {
    return <PrivacyScreen
             onBack={() => setShowPrivacy(false)}
             onNavigateToReport={() => setShowReportConcern(true)}
             onNavigateToPolicy={() => setShowPrivacyPolicy(true)}
             onNavigateToTerms={() => setShowTerms(true)}
             onNavigateToSafetyCenter={() => setShowSafetyCenter(true)}
           />;
  }
  if (showSettings) {
    return <SettingsScreen 
      onBack={() => setShowSettings(false)}
      profile={profile}
      onIncognitoToggle={handleIncognitoToggle}
    />;
  }
  if (showHelp) {
    return <HelpScreen onBack={() => setShowHelp(false)} />;
  }

  // --- Loading and Error States ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="h-8 w-8 text-pink-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold gradient-text-animated">Loading your profile...</h3>
            <p className="text-gray-400">Getting your information ready</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-6 animate-fade-in">
          <User className="h-20 w-20 text-pink-500/60 mx-auto" />
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">No profile found</h2>
            <p className="text-gray-400">Please try logging in again.</p>
          </div>
          <Button onClick={handleLogout} className="btn-primary">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  // Prepare profile data for the Edit Profile Modal
  const profileForModal: ProfileType = {
    bio: profile.bio || "",
    branch: profile.branch || "",
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    hometown: profile.hometown || "",
    year_of_study: profile.year_of_study || "1st Year",
    height: profile.height || null,
    date_of_birth: profile.date_of_birth || "2000-01-01",
    email: profile.email || "",
    gender: (profile.gender as "male" | "female") || "male",
    interested_in: (profile.interested_in as "male" | "female") || "female",
    phone_number: profile.phone_number || "",
    instagram_handle: profile.instagram_handle || "",
    verification_status: profile.verification_status || "pending",
    is_verified: profile.is_verified || false,
    is_active: profile.is_active || true,
    incognito_mode: profile.incognito_mode || false,
    hide_year_branch: profile.hide_year_branch || false,
    latitude: profile.latitude || null,
    longitude: profile.longitude || null,
    last_active_at: profile.last_active_at || null,
    created_at: profile.created_at || new Date().toISOString(),
    updated_at: profile.updated_at || new Date().toISOString(),
    verification_document_url: profile.verification_document_url || null,
    photos: photos.map(p => p.photo_url), 
    interests: user.interests
  };
  
  // 🆕 Create the full profile object for the new dialog
  const myProfileForDialog: MyProfileType | null = profile ? {
      ...profile, // Spread all properties from the FullProfile object
      photos: photos, // Override with the local, up-to-date photos state
      interests: user.interests, // Use the interests from the UIProfile object
      prompts: profile.prompts || [],   // Use prompts from FullProfile
      elo_rating: profile.elo_rating || null // Use elo_rating from FullProfile
  } : null;

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen text-white">
      {/* New Tinder-style layout */}
      <div className="p-6 space-y-6">
        
        {/* "Profile" Title (Gray, Larger) */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-400 tracking-wide">Profile</h1>
        </div>

        {/* Top Profile Section */}
        <div className="flex flex-col items-center space-y-4">
          {/* 🆕 Wrapped Avatar in a button to open the dialog */}
          <button 
            className="relative interactive"
            onClick={() => setShowMyProfileDialog(true)}
          >
            {/* Increased Avatar Size */}
            <Avatar className="h-96 w-96 ring-4 ring-pink-500/30 border-4 border-black">
              <AvatarImage src={photos.length > 0 ? photos[0].photo_url : undefined} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 text-9xl font-bold">
                {user.name[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          </button>
          
          <div className="text-center">
            {/* Increased Text Size */}
            <h1 className="text-5xl font-bold gradient-text-animated">{user.name}, {user.age}</h1>
            {/* Updated info line */}
            <p className="text-lg text-gray-400 mt-1">
              {user.year} • {user.branch}
            </p>
          </div>
        </div>

        {/* "V" Shape Circular Button Row - Adjusted */}
        {/* Brought buttons closer together */}
        <div className="flex flex-col items-center gap-0 w-full max-w-sm mx-auto">
          {/* Top Row - Pushed to edges */}
          <div className="flex justify-between w-full">
            {/* Settings Button */}
            <button 
              onClick={() => setShowSettings(true)} 
              className="flex flex-col items-center space-y-2 group interactive"
            >
              {/* Increased size to h-24 w-24 */}
              <div className="h-24 w-24 rounded-full glass-light border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                {/* Increased icon size to h-10 w-10 */}
                <Settings className="h-10 w-10 text-gray-300 group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors">SETTINGS</span>
            </button>

            {/* Safety Button */}
            <button 
              onClick={() => setShowSafetyCenter(true)} 
              className="flex flex-col items-center space-y-2 group interactive"
            >
              {/* Increased size to h-24 w-24 */}
              <div className="h-24 w-24 rounded-full glass-light border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                {/* Increased icon size to h-10 w-10 */}
                <Shield className="h-10 w-10 text-gray-300 group-hover:text-white transition-colors" />
              </div>
              <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors">SAFETY</span>
            </button>
          </div>

          {/* Bottom (Edit Profile) Button */}
          {/* Pulled up with negative margin */}
          <EditProfileModal
            profile={profileForModal}
            onSave={handleSaveProfile}
            photos={photos}
            onPhotosUpdate={handlePhotosUpdate}
            photosLoading={photosLoading}
          >
            <div className="flex flex-col items-center space-y-2 group interactive cursor-pointer -mt-20">
              {/* Increased size to h-24 w-24 */}
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-pink-500/80 to-purple-600/80 border border-pink-5In0/50 flex items-center justify-center shadow-lg group-hover:from-pink-500 group-hover:to-purple-600 transition-all scale-105 group-hover:scale-110">
                {/* Increased icon size to h-10 w-10 */}
                <Edit className="h-10 w-10 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors">EDIT PROFILE</span>
            </div>
          </EditProfileModal>
        </div>

        <Separator className="bg-white/10" />

        {/* Photos Card */}
        <Card className="glass-light border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5 text-pink-400" />
              Edit My Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photosLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
              </div>
            ) : (
              <PhotoUpload
                userEmail={profile.email}
                photos={photos}
                onPhotosUpdate={handlePhotosUpdate}
                maxPhotos={3} 
              />
            )}
          </CardContent>
        </Card>
        
      </div>

      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* 🆕 Render the new dialog */}
      <MyProfileDialog
        profile={myProfileForDialog}
        isOpen={showMyProfileDialog}
        onClose={() => setShowMyProfileDialog(false)}
      />
    </div>
  );
}