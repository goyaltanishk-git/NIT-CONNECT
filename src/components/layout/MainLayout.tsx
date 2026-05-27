import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Sparkles, Globe, BriefcaseBusiness } from "lucide-react";
import { DiscoveryScreenIntegrated } from "@/components/discovery/DiscoveryScreenIntegrated";
import { DiscoveryScreenGlobal } from "@/components/discovery/DiscoveryScreenGlobal";
import { JobSearchScreen } from "@/components/jobs/JobSearchScreen";
import { LikesScreenIntegrated } from "@/components/matches/LikesScreenIntegrated";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { SettingsScreen } from "@/components/settings/SettingsScreen";
import { DatingSettingsScreen } from "@/components/settings/DatingSettingsScreen";
import { LeaderboardScreen } from "@/components/leaderboard/LeaderboardScreen";
import { AuthService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { CommunityScreen } from "../Community/CommunityScreen";
import NewsScreen from "../news/Newscreen";

type Profile = Tables<"profiles">;

const pageThemes = {
  news: {
    accent: "#7dd3fc",
    accentSoft: "rgba(125, 211, 252, 0.20)",
    accentGlow: "rgba(125, 211, 252, 0.18)",
    spark: "text-sky-400",
    particles: ["bg-sky-400/20", "bg-indigo-400/20", "bg-cyan-400/20"],
  },
  discord: {
    accent: "#6ee7b7",
    accentSoft: "rgba(110, 231, 183, 0.20)",
    accentGlow: "rgba(110, 231, 183, 0.18)",
    spark: "text-emerald-400",
    particles: ["bg-emerald-400/20", "bg-lime-400/20", "bg-teal-400/20"],
  },
  "job-search": {
    accent: "#67e8f9",
    accentSoft: "rgba(103, 232, 249, 0.20)",
    accentGlow: "rgba(103, 232, 249, 0.18)",
    spark: "text-cyan-400",
    particles: ["bg-cyan-400/20", "bg-slate-400/20", "bg-blue-400/20"],
  },
  "discovery-global": {
    accent: "#fb7185",
    accentSoft: "rgba(251, 113, 133, 0.20)",
    accentGlow: "rgba(251, 113, 133, 0.18)",
    spark: "text-rose-400",
    particles: ["bg-rose-400/20", "bg-pink-400/20", "bg-fuchsia-400/20"],
  },
  profile: {
    accent: "#c084fc",
    accentSoft: "rgba(192, 132, 252, 0.20)",
    accentGlow: "rgba(192, 132, 252, 0.18)",
    spark: "text-violet-400",
    particles: ["bg-violet-400/20", "bg-purple-400/20", "bg-fuchsia-400/20"],
  },
} as const;

const tabThemes = {
  news: { activeBg: "#38bdf8", activeBorder: "transparent", activeShadow: "0 0 0 0.5px rgba(56, 189, 248, 0.88), 0 0 6px rgba(56, 189, 248, 0.16)" },
  discord: { activeBg: "#10b981", activeBorder: "transparent", activeShadow: "0 0 0 0.5px rgba(16, 185, 129, 0.88), 0 0 6px rgba(16, 185, 129, 0.16)" },
  "job-search": { activeBg: "#06b6d4", activeBorder: "transparent", activeShadow: "0 0 0 0.5px rgba(6, 182, 212, 0.88), 0 0 6px rgba(6, 182, 212, 0.16)" },
  "discovery-global": { activeBg: "#fb7185", activeBorder: "transparent", activeShadow: "0 0 0 0.5px rgba(251, 113, 133, 0.88), 0 0 6px rgba(251, 113, 133, 0.16)" },
  profile: { activeBg: "#a855f7", activeBorder: "transparent", activeShadow: "0 0 0 0.5px rgba(168, 85, 247, 0.88), 0 0 6px rgba(168, 85, 247, 0.16)" },
} as const;

export function MainLayout() {
  const [activeTab, setActiveTab] = useState("discovery-global");
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const[ischatopen,setischatopen]=useState(false);
  const activeTheme = pageThemes[activeTab as keyof typeof pageThemes] ?? pageThemes["discovery-global"];

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
                <Heart className="h-10 w-10 animate-heartbeat" style={{ color: activeTheme.accent }} />
                <div className="absolute inset-0 h-10 w-10 rounded-full animate-pulse-glow" style={{ backgroundColor: activeTheme.accentGlow }}></div>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold gradient-text-animated whitespace-nowrap">
                NIT Connect
              </h1>
              
              <div className="flex space-x-1">
                <Sparkles className={`h-6 w-6 animate-pulse stagger-1 ${activeTheme.spark}`} />
                <Sparkles className="h-4 w-4 text-white/80 animate-pulse stagger-2" />
                <Sparkles className="h-5 w-5 text-white/70 animate-pulse stagger-3" />
              </div>
            </div>
          </div>
        </div>)
}
        {/* Main Content with enhanced smooth transitions */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative bg-black ">
            <TabsContent value="news" className="min-h-full animate-fade-in  ">
             
            <NewsScreen />
          </TabsContent>
          <TabsContent value="discovery" className="min-h-full animate-fade-in  ">
             
            <DiscoveryScreenIntegrated />
          </TabsContent>

          {/* NEW: Discover Global Tab */}
          <TabsContent value="discovery-global" className="min-h-full animate-fade-in">
            <DiscoveryScreenGlobal 
              onNavigateToLikes={() => setActiveTab("likes")} 
              onNavigateToChat={() => setActiveTab("chat")}
              onNavigateToDatingSettings={() => setActiveTab("dating-settings")}
            />
          </TabsContent>

          <TabsContent value="job-search" className="min-h-full animate-fade-in">
            <JobSearchScreen onNavigateToSettings={() => setActiveTab("settings")} />
          </TabsContent>

          <TabsContent value="likes" className="min-h-full animate-fade-in">
            <LikesScreenIntegrated onNavigateToDiscovery={() => setActiveTab("discovery-global")} />
          </TabsContent>

          <TabsContent value="chat" className="min-h-full animate-fade-in">
            <ChatScreen onNavigateToDiscovery={() => setActiveTab("discovery-global")} setischatopen={setischatopen}/>
          </TabsContent>


          <TabsContent value="profile" className="min-h-full animate-fade-in">
            <ProfileScreen />
          </TabsContent>

          <TabsContent value="settings" className="min-h-full animate-fade-in">
            <SettingsScreen onBack={() => setActiveTab("profile")} />
          </TabsContent>

          <TabsContent value="dating-settings" className="min-h-full animate-fade-in">
            <DatingSettingsScreen onBack={() => setActiveTab("discovery-global")} />
          </TabsContent>
           <TabsContent value="discord" className="min-h-full animate-fade-in">
            <CommunityScreen  />
          </TabsContent>
        </div> 

        {/* Enhanced Bottom Navigation */}
      { (ischatopen==false)&&(<div className="sticky bottom-0 z-50 glass border-t border-white/10 px-2 py-0.5">
          <div className="flex items-center w-full max-w-3xl mx-auto">
            {[
              { tab: "news", icon: Globe, label: "News", accentText: "#7dd3fc", accentRing: "ring-sky-300/20", accentBg: "bg-sky-300/10" },
              { tab: "discord", icon: MessageCircle, label: "Community", accentText: "#6ee7b7", accentRing: "ring-emerald-300/20", accentBg: "bg-emerald-300/10" },
              { tab: "job-search", icon: BriefcaseBusiness, label: "Jobs", accentText: "#67e8f9", accentRing: "ring-cyan-300/20", accentBg: "bg-cyan-300/10" },
              { tab: "discovery-global", icon: Heart, label: "Dating", accentText: "#fb7185", accentRing: "ring-rose-300/20", accentBg: "bg-rose-300/10" },
              { tab: "profile", icon: User, label: "Profile", accentText: "#c084fc", accentRing: "ring-violet-300/20", accentBg: "bg-violet-300/10" },
            ].map(({ tab, icon: Icon, label, accentText, accentRing, accentBg }, index) => {
              const tabTheme = tabThemes[tab as keyof typeof tabThemes];

              return (
              <Button
                key={tab}
                variant="ghost"
                onClick={() => setActiveTab(tab)}
                /* UPDATED LAYOUT: 
                   - gap-1.5: increased space between icon and text
                   - pb-2: pushes the text up further
                   - pt-3: ensures icons aren't too high
                */
                className={`flex-1 flex flex-col items-center justify-center pt-0.5 pb-0.5 px-0.5 gap-0.5 rounded-2xl transition-all duration-500 interactive group relative overflow-hidden min-h-[3rem] ${
                  activeTab === tab
                    ? "shadow-none scale-100"
                    : "hover:bg-white/10 hover:scale-105"
                } animate-bounce-in stagger-${index + 1}`}
                style={activeTab === tab ? { backgroundColor: tabTheme.activeBg, boxShadow: tabTheme.activeShadow } : undefined}
              >
                {activeTab === tab && <div className={`absolute inset-0 ${accentBg} opacity-70 blur-xl`}></div>}
                
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
                
                <span aria-hidden className="relative z-10 transition-all duration-300 select-none">
                  <Icon
                    className="h-4 w-4"
                    style={{ color: activeTab === tab ? "#ffffff" : "rgba(255,255,255,0.7)" }}
                  />
                </span>
                
                <span
                  className="text-[8.5px] font-medium leading-none relative z-10 transition-all duration-300 whitespace-nowrap"
                  style={{ color: activeTab === tab ? "#ffffff" : "rgba(255,255,255,0.7)" }}
                >
                  {label}
                </span>

                <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100 bg-white/10 animate-ping"></div>
              </Button>
              );
            })}
          </div>
        </div>)}
      </Tabs>

      <div
        className="fixed inset-0 -z-10 pointer-events-none animate-gradient-shift"
        style={{
          backgroundImage: `radial-gradient(circle at top, ${activeTheme.accentGlow} 0%, rgba(0,0,0,0) 42%), linear-gradient(135deg, #000000 0%, #111111 45%, #000000 100%)`,
        }}
      ></div>
      
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full animate-pulse ${
              activeTheme.particles[i % 3]
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
            className="absolute w-4 h-4 animate-float"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 2}s`,
              color: activeTheme.accent,
              opacity: 0.10,
            }}
          />
        ))}
      </div>
    </div>
  );
}