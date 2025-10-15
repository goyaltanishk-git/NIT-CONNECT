import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Settings, Camera, Heart, Star, Eye, LogOut, TrendingUp, Award, Zap, Shield, User, Edit } from "lucide-react";
import { useEloRating } from "@/hooks/useEloRating";
import { EditProfileModal, ProfileType } from "./EditProfileModal";
import { IncognitoModeToggle } from "./IncognitoModeToggle";
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

  const handleIncognitoToggle = async (enabled: boolean) => {
    if (!profile) return;

    try {
      await updateProfile({ incognito_mode: enabled });
      console.log('✅ Incognito mode updated:', enabled);
    } catch (error) {
      console.error('❌ Error updating incognito mode:', error);
      throw error;
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
    photos: profile.photos || [],
    interests: user.interests
  };

  return (
    <div className="max-w-lg mx-auto bg-black min-h-screen text-white">
      {/* Enhanced Header with Glassmorphism */}
      <div className="glass border-b border-white/10 p-6">
        {/* ELO Rating Display */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 glass-light">
                <Award className="h-6 w-6 text-pink-500" />
              </div>
              <div className="absolute inset-0 bg-pink-500/20 rounded-2xl animate-pulse-glow"></div>
            </div>
            <div>
              <p className="text-sm text-gray-400">Your Rating</p>
              <p className="text-xl font-bold gradient-text">
                {ratingTier.tier}
                <span className="text-sm font-normal text-gray-400 ml-2">({eloRating})</span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="glass-light hover:bg-white/10 interactive rounded-full"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Enhanced Profile Card */}
        <div className="glass-light rounded-3xl p-6 border border-white/10">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-pink-500/30">
                <AvatarImage src={user.photos[0]} />
                <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 text-2xl font-bold">
                  {user.name[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-1">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold gradient-text-animated">{user.name}, {user.age}</h1>
              <p className="text-sm text-gray-400 mb-3 font-medium">
                Year {user.year} • {user.branch} • {user.hometown}
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">{user.bio}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Incognito Mode Toggle - Only for Female Users */}
        {profile.gender === "female" && (
          <IncognitoModeToggle
            isIncognito={Boolean(profile.incognito_mode)}
            userGender={profile.gender as "male" | "female"}
            onToggle={handleIncognitoToggle}
          />
        )}

        {/* Enhanced Interests */}
        <Card className="glass-light border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-400" />
              Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest, index) => (
                  <Badge 
                    key={index} 
                    className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30 px-3 py-1 hover:scale-105 transition-transform duration-200 interactive"
                  >
                    {interest}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-400">
                  Add your interests to help others connect with you!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Photos */}
        <Card className="glass-light border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-pink-400" />
                <span>Photos ({user.photos.length}/6)</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {user.photos.map((photo, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl bg-cover bg-center border-2 border-white/10 hover:border-pink-500/50 transition-colors duration-200"
                  style={{ backgroundImage: `url(${photo})` }}
                />
              ))}
              {Array.from({ length: 6 - user.photos.length }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-gray-400 hover:border-pink-500/50 hover:text-pink-400 transition-all duration-200 interactive"
                >
                  <div className="text-center">
                    <Camera className="h-6 w-6 mx-auto mb-1" />
                    <p className="text-xs">Add Photo</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">
              Add more photos to increase your match rate by up to 40%!
            </p>
          </CardContent>
        </Card>

        {/* Enhanced Account Options */}
        <div className="space-y-4">
          <EditProfileModal
            profile={profileForModal}
            onSave={handleSaveProfile}
          />
          
          <Button
            variant="ghost"
            className="w-full justify-start glass-light border border-white/10 hover:bg-white/10 text-white interactive rounded-xl p-4 h-auto"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-5 w-5 mr-3 text-pink-400" />
            <div className="text-left">
              <p className="font-medium">Account Settings</p>
              <p className="text-sm text-gray-400">Privacy, notifications, and more</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}