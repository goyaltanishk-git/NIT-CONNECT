import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Settings, Sparkles, Zap } from "lucide-react";
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
  const[ischatopen,setischatopen]=useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-black">
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
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce stagger-1"></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce stagger-2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-red text-white ">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-dvh">

        {/* Enhanced Glassmorphism Header */}
        {(activeTab!="settings")&&(activeTab!="profile")&&(ischatopen==false)&&
       (<div className="sticky top-0 z-50 glass border-b border-white/10 p-4">
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
        </div>)
}
        {/* Main Content with enhanced smooth transitions */}
        <div className="flex-1 overflow-hidden relative bg-black ">
          <TabsContent value="discovery" className="h-full animate-fade-in  ">
             
            <DiscoveryScreenIntegrated />
          </TabsContent>

          <TabsContent value="likes" className="h-full animate-fade-in">
            <LikesScreenIntegrated onNavigateToDiscovery={() => setActiveTab("discovery")} />
          </TabsContent>

          <TabsContent value="chat" className="h-full animate-fade-in">
            <ChatScreen  setischatopen={setischatopen}/>
          </TabsContent>

          <TabsContent value="profile" className="h-full animate-fade-in">
            <ProfileScreen />
          </TabsContent>

          <TabsContent value="settings" className="h-full animate-fade-in">
            <SettingsScreen onBack={() => setActiveTab("profile")} />
          </TabsContent>
        </div>

        {/* Enhanced Bottom Navigation */}
       { (ischatopen==false)&&(<div className="sticky bottom-0 z-50 glass border-t border-white/10 p-2">
          <div className="flex justify-around items-center max-w-md mx-auto">
            {[
              { tab: "discovery", icon: Heart, label: "Discover", gradient: "from-pink-400 to-pink-600" },
              { tab: "likes", icon: Sparkles, label: "Likes", gradient: "from-purple-400 to-pink-500" },
              { tab: "chat", icon: MessageCircle, label: "Chat", gradient: "from-blue-400 to-purple-500" },
              { tab: "profile", icon: User, label: "Profile", gradient: "from-green-400 to-blue-500" },
              { tab: "settings", icon: Settings, label: "Settings", gradient: "from-gray-400 to-gray-600" },
            ].map(({ tab, icon: Icon, label, gradient }, index) => (
              <Button
                key={tab}
                variant="ghost"
                onClick={() => setActiveTab(tab)}
                /* UPDATED LAYOUT: 
                   - gap-1.5: increased space between icon and text
                   - pb-2: pushes the text up further
                   - pt-3: ensures icons aren't too high
                */
                className={`flex flex-col items-center justify-center pt-3 pb-2 px-3 gap-1.5 rounded-2xl transition-all duration-500 interactive group relative overflow-hidden ${
                  activeTab === tab
                    ? `bg-gradient-to-r ${gradient} shadow-lg scale-110 animate-pulse-glow`
                    : "hover:bg-white/10 hover:scale-105"
                } animate-bounce-in stagger-${index + 1}`}
              >
                {/* Active Tab Glow */}
                {activeTab === tab && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-30 blur-xl animate-pulse`}></div>
                )}
                
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
                
                <Icon className={`h-5 w-5 relative z-10 transition-all duration-300 ${
                  activeTab === tab ? "animate-heartbeat text-white" : "text-white/70 group-hover:text-white group-hover:scale-110"
                }`} />
                
                <span className={`text-[10px] font-medium leading-none relative z-10 transition-all duration-300 ${
                  activeTab === tab ? "text-white" : "text-white/70 group-hover:text-white"
                }`}>
                  {label}
                </span>

                {activeTab === tab && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-white rounded-full animate-ping"></div>
                  </div>
                )}

                <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 bg-white/20 animate-ping"></div>
              </Button>
            ))}
          </div>
        </div>)}
      </Tabs>

      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none animate-gradient-shift"></div>
      
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full animate-pulse ${
              i % 3 === 0 ? 'bg-pink-500/20' : i % 3 === 1 ? 'bg-purple-500/20' : 'bg-blue-500/20'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="fixed inset-0 -z-15 overflow-hidden pointer-events-none">
        {Array.from({ length: 5 }).map((_, i) => (
          <Heart
            key={i}
            className="absolute w-4 h-4 text-pink-500/10 animate-float"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );}