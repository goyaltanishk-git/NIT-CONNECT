import { useState, useEffect } from "react";
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

interface UserProfile {
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

  const handleSaveProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    // Save to localStorage
    localStorage.setItem('user-profile', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem('temp-user');
    localStorage.removeItem('user-profile');
    localStorage.removeItem('dating-app-settings');
    window.location.reload();
  };

  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold gradient-text">Profile</h1>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          {/* ELO Rating Display */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${ratingTier.bgColor}`}>
              <Award className={`h-4 w-4 ${ratingTier.color}`} />
              <span className={`font-semibold ${ratingTier.color}`}>{ratingTier.tier}</span>
              <span className="text-xs text-muted-foreground">({eloRating})</span>
            </div>
            <div className="flex-1">
              <Progress value={((eloRating - 500) / 1500) * 100} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.photos[0]} />
                  <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
                </Avatar>
                <Button 
                  size="sm" 
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <h2 className="text-2xl font-bold mb-1">{user.name}, {user.age}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Year {user.year} • {user.branch} • {user.hometown}
              </p>
              
              <EditProfileModal user={user} onSave={handleSaveProfile} />
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {user.bio}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stats */}
        <Card className="bg-gradient-to-br from-card to-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-3 rounded-lg bg-background/50">
                  <div className="flex justify-center mb-2">
                    <div className="h-12 w-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center">
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="capitalize">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Photos ({user.photos.length}/6)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {user.photos.map((photo, index) => (
                <div key={index} className="aspect-square bg-cover bg-center rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer group" style={{ backgroundImage: `url(${photo})` }}>
                  <div className="w-full h-full bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
              {Array.from({ length: 6 - user.photos.length }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square border-2 border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                  <div className="text-center">
                    <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">Add Photo</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Add more photos to increase your match rate by up to 40%!
            </p>
          </CardContent>
        </Card>

        {/* Account Options */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Privacy & Safety
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                Help & Support
              </Button>
              <Separator className="my-2" />
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}