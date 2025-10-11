import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Settings, Camera, Heart, Star, Eye, LogOut, TrendingUp, Award, Zap, Shield } from "lucide-react";
import { useEloRating } from "@/hooks/useEloRating";
import { EditProfileModal, ProfileType } from "./EditProfileModal";
import { SettingsScreen } from "../settings/SettingsScreen";
import { useState, useEffect } from "react";
import { useUserProfile, FullProfile } from "@/hooks/useUserProfile";
import { AuthService } from "@/lib/auth";

// Import new screens from their respective locations
import { HelpScreen } from "./HelpScreen";
import { PrivacyScreen } from "./privacyandsafety/PrivacyScreen";
import { ReportConcernScreen } from "./privacyandsafety/ReportConcernScreen";
import { PrivacyPolicyScreen } from "./privacyandsafety/PrivacyPolicyScreen";
import { TermsScreen } from "./privacyandsafety/TermsScreen";
import { SafetyCenterScreen } from "./privacyandsafety/SafetyCenterScreen";

// Interface for local UI state
interface UIProfile {
  name: string;
  age: number;
  bio: string;
  year: number;
  branch: string;
  hometown: string;
  height: string;
  interests: string[];
  photos: string[];
}

export function ProfileScreen() {
  const { profile, loading, updateProfile } = useUserProfile();
  
  // State for managing which screen is visible
  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReportConcern, setShowReportConcern] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);

  // Local state for UI elements
  const [eloRating, setEloRating] = useState(1245);
  
  const { getRatingTier } = useEloRating();
  const ratingTier = getRatingTier(eloRating);

  // Transform database profile to UI profile
  const getUIProfile = (dbProfile: FullProfile | null): UIProfile => {
    if (!dbProfile) {
      return {
        name: "Loading...",
        age: 0,
        bio: "",
        year: 0,
        branch: "",
        hometown: "",
        height: "",
        interests: [],
        photos: []
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
      bio: dbProfile.bio || "Tell others about yourself...",
      year: parseInt(dbProfile.year_of_study?.replace(/\D/g, '') || '1'),
      branch: dbProfile.branch || "Computer Science",
      hometown: dbProfile.hometown || "Your Hometown",
      height: dbProfile.height?.toString() || "5'8\"",
      // --- FIX: Read interests from the profile object ---
      interests: dbProfile.interests || [],
      photos: dbProfile.photos || []
    };
  };

  const user = getUIProfile(profile);

  useEffect(() => {
    // Load ELO rating from localStorage or database
    const tempUser = localStorage.getItem('temp-user');
    if (tempUser) {
      try {
        const userData = JSON.parse(tempUser);
        setEloRating(userData.eloRating || 1245);
      } catch (error) {
        console.error('Error loading temp user data:', error);
      }
    }
  }, []);

  const handleSaveProfile = async (updatedUser: Partial<ProfileType>) => {
    if (!profile) return;

    try {
      console.log('📝 Saving profile updates:', updatedUser);
      
      // Map the updates to database fields
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
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }
  if (showHelp) {
    return <HelpScreen onBack={() => setShowHelp(false)} />;
  }

  // --- Loading and Error States ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>No profile found. Please try logging in again.</p>
          <Button onClick={handleLogout} className="mt-4">
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
    photos: profile.photos || [],
    interests: user.interests
  };

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-6 rounded-b-3xl">
        {/* ELO Rating Display */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-90">Your Rating</p>
              <p className="text-lg font-bold">
                {ratingTier.tier}
                <span className="text-sm font-normal opacity-75"> ({eloRating})</span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Profile Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/50">
              <AvatarImage src={user.photos[0]} />
              <AvatarFallback className="bg-white/20 text-white text-xl">
                {user.name[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{user.name}, {user.age}</h1>
              <p className="text-sm opacity-90 mb-2">
                Year {user.year} • {user.branch} • {user.hometown}
              </p>
              <p className="text-sm opacity-80 leading-relaxed">{user.bio}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Interests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary">
                    {interest}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground">
                  Add your interests to help others connect with you!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Photos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Photos ({user.photos.length}/6)</span>
              <Camera className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {user.photos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg bg-cover bg-center border-2 border-muted"
                  style={{ backgroundImage: `url(${photo})` }}
                />
              ))}
              {Array.from({ length: 6 - user.photos.length }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg border-2 border-dashed border-muted flex items-center justify-center text-muted-foreground"
                >
                  <div className="text-center">
                    <Camera className="h-6 w-6 mx-auto mb-1" />
                    <p className="text-xs">Add Photo</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Add more photos to increase your match rate by up to 40%!
            </p>
          </CardContent>
        </Card>

        {/* Account Options */}
        <div className="space-y-3">
          <EditProfileModal
            profile={profileForModal}
            onSave={handleSaveProfile}
          />
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Account Settings
          </Button>
        </div>
      </div>
    </div>
  );
}