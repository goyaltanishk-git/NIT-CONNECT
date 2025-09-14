// src/components/profile/ProfileScreen.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Settings, LogOut } from "lucide-react";
import { EditProfileModal } from "./EditProfileModal";
import { SettingsScreen } from "../settings/SettingsScreen";
import { useUserProfile } from "@/hooks/useUserProfile"; // Your hook
import { AuthService, Profile } from "@/lib/auth"; // Your AuthService

// Helper function to calculate age from date of birth string
const calculateAge = (dob: string | undefined | null) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export function ProfileScreen() {
  // Use your hook to get REAL data and functions
  const { profile, loading, updateProfile } = useUserProfile();
  const [showSettings, setShowSettings] = useState(false);

  const handleSaveProfile = async (updatedUser: Partial<Profile>) => {
    // This function now correctly calls the update logic from your hook
    await updateProfile(updatedUser);
  };

  const handleLogout = () => {
    AuthService.logout();
    window.location.reload();
  };

  // Show a loading state while fetching data
  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading Profile...</div>;
  }
  
  // Show an error state if the profile couldn't be loaded
  if (!profile) {
    return <div className="h-full flex items-center justify-center text-red-500">Could not load profile.</div>;
  }

  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">Profile</h1>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  {/* TODO: Add photo logic later */}
                  <AvatarImage src={profile.photos?.[0]} /> 
                  <AvatarFallback className="text-2xl">{profile.first_name?.[0]}</AvatarFallback>
                </Avatar>
              </div>
              
              <h2 className="text-2xl font-bold mb-1">
                {profile.first_name} {profile.last_name}, {calculateAge(profile.date_of_birth)}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Year {profile.year_of_study} • {profile.branch} • {profile.hometown}
              </p>
              
              {/* The modal is now connected to the handleSaveProfile function */}
              <EditProfileModal user={profile} onSave={handleSaveProfile} />
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* You can add back other cards (Stats, Interests) and populate them with `profile` data */}

        {/* Account Options */}
        <Card>
          <CardContent className="p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}