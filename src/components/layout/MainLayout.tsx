import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Settings, Sparkles } from "lucide-react";
import { DiscoveryScreenIntegrated } from "@/components/discovery/DiscoveryScreenIntegrated";
import { LikesScreenIntegrated } from "@/components/matches/LikesScreenIntegrated";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { SettingsScreen } from "@/components/settings/SettingsScreen";
import { AuthService } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
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
        description: "You have been successfully signed out"
      });
      window.location.reload();
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-screen flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                NIT Connect
              </h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="discovery" className="h-full m-0">
            <DiscoveryScreenIntegrated />
          </TabsContent>
          
          <TabsContent value="likes" className="h-full m-0">
            <LikesScreenIntegrated onNavigateToDiscovery={() => setActiveTab("discovery")}/>
          </TabsContent>
          
          <TabsContent value="chat" className="h-full m-0">
            <ChatScreen />
          </TabsContent>
          
          <TabsContent value="profile" className="h-full m-0">
            <ProfileScreen />
          </TabsContent>
          
          <TabsContent value="settings" className="h-full m-0">
            <SettingsScreen onBack={() => setActiveTab("profile")} />
          </TabsContent>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-around p-2">
            <Button
              variant={activeTab === "discovery" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("discovery")}
              className="flex-col h-auto py-2 px-3"
            >
              <Heart className="h-5 w-5 mb-1" />
              <span className="text-xs">Discover</span>
            </Button>
            
            <Button
              variant={activeTab === "likes" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("likes")}
              className="flex-col h-auto py-2 px-3"
            >
              <Sparkles className="h-5 w-5 mb-1" />
              <span className="text-xs">Likes</span>
            </Button>
            
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("chat")}
              className="flex-col h-auto py-2 px-3"
            >
              <MessageCircle className="h-5 w-5 mb-1" />
              <span className="text-xs">Chat</span>
            </Button>
            
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("profile")}
              className="flex-col h-auto py-2 px-3"
            >
              <User className="h-5 w-5 mb-1" />
              <span className="text-xs">Profile</span>
            </Button>
            
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("settings")}
              className="flex-col h-auto py-2 px-3"
            >
              <Settings className="h-5 w-5 mb-1" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}