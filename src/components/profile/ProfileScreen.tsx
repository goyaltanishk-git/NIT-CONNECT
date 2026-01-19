import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Settings, Camera, Heart, Shield, User, Edit, Ruler, Home, BookOpen, GitBranch, Sparkles } from "lucide-react";
import { EditProfileModal, ProfileType } from "./EditProfileModal";
import { SettingsScreen } from "../settings/SettingsScreen";
import { useState, useEffect, useCallback } from "react";
import { useUserProfile, FullProfile } from "@/hooks/useUserProfile";
import { AuthService } from "@/lib/auth";
import { PhotoUpload } from "@/components/discovery/PhotoUpload";
import { PhotoService, UserPhoto } from "@/lib/photoservice";
import { useToast } from "@/hooks/use-toast";
import { HelpScreen } from "./HelpScreen";
import { PrivacyScreen } from "./privacyandsafety/PrivacyScreen";
import { ReportConcernScreen } from "./privacyandsafety/ReportConcernScreen";
import { PrivacyPolicyScreen } from "./privacyandsafety/PrivacyPolicyScreen";
import { TermsScreen } from "./privacyandsafety/TermsScreen";
import { SafetyCenterScreen } from "./privacyandsafety/SafetyCenterScreen";
import { MyProfileDialog, Profile as MyProfileType } from "./MyProfileDialog";

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
  
  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReportConcern, setShowReportConcern] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);
  
  const [showMyProfileDialog, setShowMyProfileDialog] = useState(false);

  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

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
      name: (dbProfile.last_name && dbProfile.last_name !== "NULL")
        ? `${dbProfile.first_name} ${dbProfile.last_name}`.trim()
        : dbProfile.first_name,
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

  useEffect(() => {
    if (profile?.email) {
      loadPhotos();
    }
  }, [profile]);

  const loadPhotos = async () => {
    if (!profile?.email) return;
    
    setPhotosLoading(true);
    try {
      const userPhotos = await PhotoService.getUserPhotos(profile.email);
      setPhotos(userPhotos);
    } catch (error) {
      toast({
        title: "Error loading photos",
        description: "Could not load your photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPhotosLoading(false);
    }
  };
 
  const handlePhotosUpdate = useCallback((updatedPhotos: UserPhoto[]) => {
    setPhotos(updatedPhotos);
  }, []);

  const handleSaveProfile = async (updatedUser: Partial<ProfileType>) => {
    if (!profile) return;
    try {
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
    } catch (error) {
      throw error;
    }
  };

  const handleIncognitoToggle = async (enabled: boolean) => {
    if (!profile) return;
    try {
      await updateProfile({ incognito_mode: enabled });
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    AuthService.clearCurrentUser();
    window.location.reload();
  };

  if (showSafetyCenter) return <SafetyCenterScreen onBack={() => setShowSafetyCenter(false)} />;
  if (showReportConcern) return <ReportConcernScreen onBack={() => setShowReportConcern(false)} />;
  if (showPrivacyPolicy) return <PrivacyPolicyScreen onBack={() => setShowPrivacyPolicy(false)} />;
  if (showTerms) return <TermsScreen onBack={() => setShowTerms(false)} />;
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
  if (showHelp) return <HelpScreen onBack={() => setShowHelp(false)} />;

  if (loading) {
    return (
      <>
      <div className="sticky top-0 z-50 glass border-b border-white/10 p-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 animate-slide-in-left">
              <div className="relative">
                <Heart className="h-10 w-10 text-pink-500 animate-heartbeat" />
                <div className="absolute inset-0 h-10 w-10 bg-pink-500/20 rounded-full animate-pulse-glow"></div>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold gradient-text-animated whitespace-nowrap">
                NIT Connect
              </h1>
              
              <div className="flex space-x-1">
                <Sparkles className="h-6 w-6 text-purple-400 animate-pulse stagger-1" />
                <Sparkles className="h-4 w-4 text-pink-400 animate-pulse stagger-2" />
                <Sparkles className="h-5 w-5 text-blue-400 animate-pulse stagger-3" />
              </div>
            </div>
          </div>
        </div>
      <div className="flex items-center justify-center h-full bg-black">
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
      </div></>
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
  
  const myProfileForDialog: MyProfileType | null = profile ? {
      ...profile,
      photos: photos,
      interests: user.interests,
      prompts: profile.prompts || [],
      elo_rating: profile.elo_rating || null
  } : null;

  return (
    <div className="h-full overflow-y-auto bg-black text-white pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      
      {/* Internal Header that scrolls */}
      <div className="glass border-b border-white/10 py-2 px-4 mb-2">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4 animate-slide-in-left">
            <div className="relative">
              <Heart className="h-10 w-10 text-pink-500 animate-heartbeat" />
              <div className="absolute inset-0 h-10 w-10 bg-pink-500/20 rounded-full animate-pulse-glow"></div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text-animated whitespace-nowrap">
              NIT Connect
            </h1>
            <div className="flex space-x-1">
              <Sparkles className="h-6 w-6 text-purple-400 animate-pulse stagger-1" />
              <Sparkles className="h-4 w-4 text-pink-400 animate-pulse stagger-2" />
              <Sparkles className="h-5 w-5 text-blue-400 animate-pulse stagger-3" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-0 space-y-3 max-w-lg mx-auto">
        
        {/* Top Profile Section */}
        <div className="flex flex-col items-center space-y-3 mt-0">
          <button 
            className="relative interactive"
            onClick={() => setShowMyProfileDialog(true)}
          >
            {/* KEPT SMALL: Avatar size 200px / 55vw */}
            <Avatar className="w-[55vw] h-[55vw] max-w-[200px] max-h-[200px] ring-4 ring-pink-500/30 border-4 border-black">
              <AvatarImage src={photos.length > 0 ? photos[0].photo_url : undefined} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 text-5xl font-bold">
                {user.name[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold gradient-text-animated">{user.name}, {user.age}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {user.year} • {user.branch}
            </p>
          </div>
        </div>

        {/* Buttons Section */}
        {/* RESTORED: Max width 270px */}
        <div className="flex flex-col items-center gap-0 w-full max-w-[270px] mx-auto">
          {/* Top Row: Settings & Safety */}
          <div className="flex justify-between w-full px-0.5">
            <button 
              onClick={() => setShowSettings(true)} 
              className="flex flex-col items-center space-y-1.5 group interactive"
            >
              {/* RESTORED: Size h-[60px] w-[60px] */}
              <div className="h-[60px] w-[60px] rounded-full glass-light border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                <Settings className="h-7 w-7 text-gray-300 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[9px] font-medium text-gray-400 group-hover:text-white transition-colors">SETTINGS</span>
            </button>

            <button 
              onClick={() => setShowSafetyCenter(true)} 
              className="flex flex-col items-center space-y-1.5 group interactive"
            >
              {/* RESTORED: Size h-[60px] w-[60px] */}
              <div className="h-[60px] w-[60px] rounded-full glass-light border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                <Shield className="h-7 w-7 text-gray-300 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[9px] font-medium text-gray-400 group-hover:text-white transition-colors">SAFETY</span>
            </button>
          </div>

          {/* Edit Profile Button */}
          <EditProfileModal
            profile={profileForModal}
            onSave={handleSaveProfile}
            photos={photos}
            onPhotosUpdate={handlePhotosUpdate}
            photosLoading={photosLoading}
          >
            {/* RESTORED: -mt-14 margin */}
            <div className="flex flex-col items-center space-y-1.5 group interactive cursor-pointer -mt-14">
              {/* RESTORED: Size h-[60px] w-[60px] */}
              <div className="h-[60px] w-[60px] rounded-full bg-gradient-to-br from-pink-500/80 to-purple-600/80 border border-pink-500/50 flex items-center justify-center shadow-lg group-hover:from-pink-500 group-hover:to-purple-600 transition-all scale-105 group-hover:scale-110">
                <Edit className="h-7 w-7 text-white" />
              </div>
              <span className="text-[9px] font-medium text-gray-400 group-hover:text-white transition-colors">EDIT PROFILE</span>
            </div>
          </EditProfileModal>
        </div>

        <Separator className="bg-white/10" />

        {/* Photos Card */}
        <Card className="glass-light border-white/10">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4 text-pink-400" />
              Edit My Photos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {photosLoading ? (
              <div className="flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/50"></div>
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

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <MyProfileDialog
        profile={myProfileForDialog}
        isOpen={showMyProfileDialog}
        onClose={() => setShowMyProfileDialog(false)}
      />
    </div>
  );
}