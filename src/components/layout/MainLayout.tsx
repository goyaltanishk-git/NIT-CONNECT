import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Settings, Sparkles, LogOut, Zap } from "lucide-react";
import { DiscoveryScreenIntegrated } from "@/components/discovery/DiscoveryScreenIntegrated";
import { LikesScreenIntegrated } from "@/components/matches/LikesScreenIntegrated";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { SettingsScreen } from "@/components/settings/SettingsScreen";
import { AuthService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export function MainLayout() {
  const [activeTab, setActiveTab] = useState("discovery");
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = AuthService.getCurrentUser();
      if (user) {
        setUserProfile(user);
      }
    } catch (error) {
      console.error("Error in loadUserProfile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthService.logout();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
      });
      window.location.reload();
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center space-y-8 p-8 animate-fade-in">
          <div className="relative">
            {/* Custom heart loading animation */}
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold gradient-text-animated">
              Loading your profile...
            </h3>
            <p className="text-gray-400 text-lg">Finding amazing connections for you</p>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-screen">

        {/* Glassmorphism Header */}
        <div className="sticky top-0 z-50 glass border-b border-white/10 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Heart className="h-8 w-8 text-pink-500 animate-heartbeat" />
              <div className="absolute inset-0 h-8 w-8 bg-pink-500/20 rounded-full animate-pulse-glow"></div>
            </div>
            <h1 className="text-3xl font-bold gradient-text-animated">
              NIT Connect
            </h1>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="glass-light text-white/80 hover:text-white hover:bg-pink-500/20 rounded-full px-6 py-3 transition-all duration-300 hover:scale-105 interactive"
          >
            <LogOut className="w-5 h-5 mr-2" /> 
            <span className="font-medium">Sign Out</span>
          </Button>
        </div>

        {/* Main Content with smooth transitions */}
        <div className="flex-1 overflow-hidden relative">
          <TabsContent value="discovery" className="h-full animate-fade-in">
            <DiscoveryScreenIntegrated />
          </TabsContent>

          <TabsContent value="likes" className="h-full animate-fade-in">
            <LikesScreenIntegrated onNavigateToDiscovery={() => setActiveTab("discovery")} />
          </TabsContent>

          <TabsContent value="chat" className="h-full animate-fade-in">
            <ChatScreen />
          </TabsContent>

          <TabsContent value="profile" className="h-full animate-fade-in">
            <ProfileScreen />
          </TabsContent>

          <TabsContent value="settings" className="h-full animate-fade-in">
            <SettingsScreen onBack={() => setActiveTab("profile")} />
          </TabsContent>
        </div>

        {/* Enhanced Bottom Navigation with Glassmorphism */}
        <div className="sticky bottom-0 z-50 glass border-t border-white/10 p-4">
          <div className="flex justify-around items-center max-w-md mx-auto">
            {[
              { tab: "discovery", icon: Heart, label: "Discover", gradient: "from-pink-400 to-pink-600" },
              { tab: "likes", icon: Sparkles, label: "Likes", gradient: "from-purple-400 to-pink-500" },
              { tab: "chat", icon: MessageCircle, label: "Chat", gradient: "from-blue-400 to-purple-500" },
              { tab: "profile", icon: User, label: "Profile", gradient: "from-green-400 to-blue-500" },
              { tab: "settings", icon: Settings, label: "Settings", gradient: "from-gray-400 to-gray-600" },
            ].map(({ tab, icon: Icon, label, gradient }) => (
              <Button
                key={tab}
                variant="ghost"
                onClick={() => setActiveTab(tab)}
                className={`flex flex-col items-center px-4 py-3 rounded-2xl transition-all duration-300 interactive group relative overflow-hidden ${
                  activeTab === tab
                    ? `bg-gradient-to-r ${gradient} shadow-lg scale-105 animate-pulse-glow`
                    : "hover:bg-white/10 hover:scale-105"
                }`}
              >
                {/* Background glow effect for active tab */}
                {activeTab === tab && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20 blur-xl`}></div>
                )}
                
                <Icon className={`h-6 w-6 mb-1 relative z-10 transition-all duration-300 ${
                  activeTab === tab ? "animate-heartbeat text-white" : "text-white/70 group-hover:text-white"
                }`} />
                <span className={`text-xs font-medium relative z-10 transition-all duration-300 ${
                  activeTab === tab ? "text-white" : "text-white/70 group-hover:text-white"
                }`}>
                  {label}
                </span>

                {/* Active indicator */}
                {activeTab === tab && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </Button>
            ))}
          </div>
        </div>
      </Tabs>

      {/* Background gradient overlay */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none"></div>
      
      {/* Animated background particles */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-pink-500/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}