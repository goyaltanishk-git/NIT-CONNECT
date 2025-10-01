// src/components/profile/ProfileScreen.tsx

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Settings, Camera, Heart, Star, Eye, LogOut, TrendingUp, Award, Zap, Shield } from "lucide-react";
import { useEloRating } from "@/hooks/useEloRating";
import { EditProfileModal } from "./EditProfileModal";
import { SettingsScreen } from "../settings/SettingsScreen";
import { useState, useEffect } from "react";

// Updated interface to match the database schema and be compatible with EditProfileModal
interface UserProfile {
  // Basic info that matches UI needs
  name: string;
  age: number;
  bio: string;
  year: number;
  branch: string;
  hometown: string;
  height: string;
  interests: string[];
  photos: string[];
  
  // Additional fields that match database schema for compatibility
  email?: string;
  first_name?: string;
  last_name?: string;
  gender?: "male" | "female";
  interested_in?: "male" | "female";
  date_of_birth?: string;
  year_of_study?: string;
  phone_number?: string;
  instagram_handle?: string;
  verification_status?: string;
  is_verified?: boolean;
  is_active?: boolean;
  incognito_mode?: boolean;
  hide_year_branch?: boolean;
  latitude?: number;
  longitude?: number;
  last_active_at?: string;
  created_at?: string;
  updated_at?: string;
  verification_document_url?: string;
}

export function ProfileScreen() {
  const [user, setUser] = useState<UserProfile>({
    name: "Your Name",
    age: 21,
    bio: "Computer Science student at NIT Kurukshetra. Love coding, music, and making new connections! Always up for deep conversations and exploring new places.",
    year: 3,
    branch: "Computer Science",
    hometown: "Delhi",
    height: "5'8\"",
    interests: ["coding", "music", "travel", "photography", "books", "coffee", "gaming", "startup"],
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop&crop=face"
    ]
  });

  const [showSettings, setShowSettings] = useState(false);
  const [eloRating, setEloRating] = useState(1245);
  const [dailyStats, setDailyStats] = useState({
    likesGiven: 47,
    superLikes: 3,
    profileViews: 142,
    matches: 12
  });

  const { getRatingTier } = useEloRating();
  const ratingTier = getRatingTier(eloRating);

  const stats = [
    { label: "Likes Given", value: dailyStats.likesGiven.toString(), icon: Heart, color: "text-like" },
    { label: "Super Likes", value: dailyStats.superLikes.toString(), icon: Star, color: "text-superlike" },
    { label: "Profile Views", value: dailyStats.profileViews.toString(), icon: Eye, color: "text-primary" },
    { label: "Matches", value: dailyStats.matches.toString(), icon: TrendingUp, color: "text-green-500" }
  ];

  useEffect(() => {
    // Load user data from localStorage
    const savedUser = localStorage.getItem('user-profile');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }

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

  const handleSaveProfile = (updatedUser: Partial<UserProfile>) => {
    const newUser = { ...user, ...updatedUser };
    
    // Handle field mappings for compatibility
    if (updatedUser.first_name && updatedUser.last_name) {
      newUser.name = `${updatedUser.first_name} ${updatedUser.last_name}`;
    }
    if (updatedUser.year_of_study) {
      newUser.year = parseInt(updatedUser.year_of_study.replace(/\D/g, '')) || newUser.year;
    }
    // Convert height to string if it comes as number
    if (typeof updatedUser.height === 'number') {
      newUser.height = `${Math.floor(updatedUser.height / 12)}'${updatedUser.height % 12}"`;
    }
    
    setUser(newUser);
    // Save to localStorage
    localStorage.setItem('user-profile', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    localStorage.removeItem('temp-user');
    localStorage.removeItem('user-profile');
    localStorage.removeItem('dating-app-settings');
    window.location.reload();
  };

  // Show a loading state while fetching data
  const [loading, setLoading] = useState(false);

  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }

  // Convert UserProfile to format expected by EditProfileModal
  const profileForModal = {
    bio: user.bio,
    branch: user.branch,
    first_name: user.first_name || user.name.split(' ')[0] || user.name,
    last_name: user.last_name || user.name.split(' ').slice(1).join(' ') || '',
    hometown: user.hometown,
    year_of_study: `${user.year}${user.year === 1 ? 'st' : user.year === 2 ? 'nd' : user.year === 3 ? 'rd' : 'th'} Year`,
    height: user.height,
    date_of_birth: user.date_of_birth || '',
    email: user.email || '',
    gender: user.gender || 'male' as const,
    interested_in: user.interested_in || 'female' as const,
    phone_number: user.phone_number || '',
    instagram_handle: user.instagram_handle || '',
    verification_status: user.verification_status || 'pending' as const,
    is_verified: user.is_verified || false,
    is_active: user.is_active || true,
    incognito_mode: user.incognito_mode || false,
    hide_year_branch: user.hide_year_branch || false,
    latitude: user.latitude || null,
    longitude: user.longitude || null,
    last_active_at: user.last_active_at || null,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString(),
    verification_document_url: user.verification_document_url || null,
    photos: user.photos,
    interests: user.interests
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Profile
          </h1>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
        {/* ELO Rating Display */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold opacity-90">Your Rating</h3>
                <div className="flex items-center gap-3 mt-1">

                  <div>
                    <div className="text-2xl font-bold">{ratingTier.tier}</div>
                    <div className="text-sm opacity-75">({eloRating})</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Shield className="h-12 w-12 opacity-50 ml-auto" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                <AvatarImage src={user.photos[0]} />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user.name}, {user.age}</h2>
                    <p className="text-gray-600 mt-1">Year {user.year} • {user.branch} • {user.hometown}</p>
                  </div>
                  <EditProfileModal
                    user={profileForModal}
                    onSave={handleSaveProfile}
                  />
                </div>
                <p className="mt-4 text-gray-700 leading-relaxed">{user.bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stats */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Your Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Photos */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Photos ({user.photos.length}/6)</span>
              <Camera className="h-5 w-5 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {user.photos.map((photo, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              {Array.from({ length: 6 - user.photos.length }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-purple-300 hover:text-purple-500 transition-colors cursor-pointer">
                  <div className="text-center">
                    <Camera className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-xs">Add Photo</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Add more photos to increase your match rate by up to 40%!
            </p>
          </CardContent>
        </Card>

        {/* Account Options */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-3">
            <Button variant="ghost" className="w-full justify-start" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-3" />
              Account Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-3" />
              Privacy & Safety
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Award className="h-4 w-4 mr-3" />
              Help & Support
            </Button>
            <Separator />
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}