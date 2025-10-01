import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Settings, Camera, Heart, Star, Eye, LogOut, TrendingUp, Award } from "lucide-react";
import { useEloRating } from "@/hooks/useEloRating";
import { EditProfileModal } from "./EditProfileModal";
import { SettingsScreen } from "../settings/SettingsScreen";

interface UserProfile {
  email: string; // primary key
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
}

export function ProfileScreen() {
  const [user, setUser] = useState<UserProfile>({
    email: "demo@nitkkr.ac.in",
    first_name: "Your Name",
    bio: "Computer Science student at NIT Kurukshetra. Love coding, music, and making new connections! Always up for deep conversations and exploring new places.",
    year_of_study: "3",
    branch: "Computer Science",
    hometown: "Delhi",
    height: 5,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [eloRating, setEloRating] = useState(1245);
  const [dailyStats, setDailyStats] = useState({
    likesGiven: 47,
    superLikes: 3,
    profileViews: 142,
    matches: 12,
  });

  const { getRatingTier } = useEloRating();
  const ratingTier = getRatingTier(eloRating);

  const stats = [
    { label: "Likes Given", value: dailyStats.likesGiven.toString(), icon: Heart, color: "text-like" },
    { label: "Super Likes", value: dailyStats.superLikes.toString(), icon: Star, color: "text-superlike" },
    { label: "Profile Views", value: dailyStats.profileViews.toString(), icon: Eye, color: "text-primary" },
    { label: "Matches", value: dailyStats.matches.toString(), icon: TrendingUp, color: "text-green-500" },
  ];

  useEffect(() => {
    // Load user data from localStorage
    const savedUser = localStorage.getItem("current-user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }

    const tempUser = localStorage.getItem("temp-user");
    if (tempUser) {
      try {
        const userData = JSON.parse(tempUser);
        setEloRating(userData.eloRating || 1245);
      } catch (error) {
        console.error("Error loading temp user data:", error);
      }
    }
  }, []);

  const handleSaveProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem("current-user", JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem("temp-user");
    localStorage.removeItem("current-user");
    localStorage.removeItem("dating-app-settings");
    window.location.reload();
  };

  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold gradient-text">Profile</h1>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* ELO Rating */}
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
                  <AvatarFallback className="text-2xl">
                    {user.first_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <h2 className="text-2xl font-bold mb-1">
                {user.first_name || "User"} {user.last_name || ""},{" "}
                {user.year_of_study || "1"}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Year {user.year_of_study || "N/A"} • {user.branch || "Unknown"} •{" "}
                {user.hometown || "Unknown"}
              </p>

              <EditProfileModal user={user} onSave={handleSaveProfile} />

              <p className="text-sm text-muted-foreground leading-relaxed">
                {user.bio || "No bio added yet."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
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
                <div
                  key={index}
                  className="text-center p-3 rounded-lg bg-background/50"
                >
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

        {/* Account Options */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setShowSettings(true)}
              >
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
