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
  import {
  Newspaper,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  {
    tab: "news",
    icon: Newspaper,
    filledIcon: Newspaper,
    label: "News",
    active: "from-sky-500 to-cyan-400",
  },
  {
    tab: "discord",
    icon: Users,
    filledIcon: Users,
    label: "Community",
    active: "from-emerald-500 to-teal-400",
  },
  {
    tab: "job-search",
    icon: BriefcaseBusiness,
    filledIcon: BriefcaseBusiness,
    label: "Jobs",
    active: "from-cyan-500 to-blue-500",
  },
  {
    tab: "discovery-global",
    icon: Heart,
    filledIcon: Heart,
    label: "Dating",
    active: "from-rose-500 to-pink-500",
  },
  {
    tab: "profile",
    icon: User,
    filledIcon: User,
    label: "Profile",
    active: "from-violet-500 to-fuchsia-500",
  },
];

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
  const [activeTab, setActiveTab] = useState("news");
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const[ischatopen,setischatopen]=useState(false);
  const[iscommunityopen,setiscommunityopen]=useState(false);
  
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
    <div className="h-dvh  bg-gradient-to-br from-[#0b1020] via-[#111827] to-[#1e1b4b] text-white ">
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
            <CommunityScreen   setiscommunityopen={setiscommunityopen} />
          </TabsContent>
        </div> 

        {/* Enhanced Bottom Navigation */}
      { (ischatopen==false)&&(iscommunityopen==false)&&(
       








<div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-sm">
  <div
    className="
      relative overflow-hidden
      rounded-[20px]
      border border-white/[0.06]
      bg-black/80
      backdrop-blur-3xl
      shadow-[0_8px_30px_rgba(0,0,0,0.55)]
      px-1.5 py-1
    "
  >
    {/* Glass Overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02]" />

    {/* Reflection */}
    <div className="absolute inset-x-0 top-0 h-[1px] bg-white/[0.08]" />

    <div className="relative flex items-center justify-between gap-1">
      {tabs.map(
        ({ tab, icon: Icon, filledIcon: FilledIcon, label, active }) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="
                relative flex-1
                flex flex-col items-center justify-center
                rounded-[14px]
                px-2 py-1
                min-w-[52px]
                overflow-hidden
                transition-all duration-300
                group
              "
            >
              {/* iOS Sliding Active Background */}
              {isActive && (
                <motion.div
                  layoutId="ios26-navbar-pill"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                  className={`
                    absolute inset-0
                    rounded-[14px]
                    bg-gradient-to-br ${active}
                  `}
                >
                  {/* Gloss */}
                  <div className="absolute inset-0 rounded-[14px] bg-white/[0.10]" />

                  {/* Glow */}
                  <div
                    className={`
                      absolute -inset-[1px]
                      rounded-[16px]
                      bg-gradient-to-br ${active}
                      blur-md opacity-35
                    `}
                  />

                  {/* Reflection */}
                  <div
                    className="
                      absolute inset-x-2 top-[1px]
                      h-[35%]
                      rounded-full
                      bg-white/[0.16]
                      blur-sm
                    "
                  />
                </motion.div>
              )}

              {/* Hover Glass */}
              {!isActive && (
                <>
                  <div
                    className="
                      absolute inset-0 rounded-[14px]
                      opacity-0 group-hover:opacity-100
                      bg-white/[0.05]
                      backdrop-blur-xl
                      transition-all duration-300
                    "
                  />

                  {/* Shine */}
                  <div
                    className="
                      absolute inset-0 rounded-[14px]
                      opacity-0 group-hover:opacity-100
                      transition-all duration-500
                      bg-gradient-to-br
                      from-white/[0.08]
                      to-transparent
                    "
                  />

                  {/* Moving reflection */}
                  <div className="absolute inset-0 overflow-hidden rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div
                      className="
                        absolute top-0 -left-[120%]
                        h-full w-[60%]
                        rotate-12
                        bg-white/[0.08]
                        blur-md
                        group-hover:left-[140%]
                        transition-all duration-1000
                      "
                    />
                  </div>
                </>
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-[1px]">
                {/* Icon */}
                {isActive ? (
                  <motion.div
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 18,
                    }}
                  >
                    <FilledIcon
                      className="h-[15px] w-[15px] text-white fill-white"
                      strokeWidth={2.6}
                    />
                  </motion.div>
                ) : (
                  <Icon
                    className="
                      h-[15px] w-[15px]
                      text-white/50
                      group-hover:text-white/90
                      transition-all duration-300
                    "
                    strokeWidth={2.2}
                  />
                )}

                {/* Label */}
                <span
                  className={`
                    text-[8px]
                    font-medium
                    tracking-tight
                    transition-all duration-300
                    ${
                      isActive
                        ? "text-white"
                        : "text-white/45 group-hover:text-white/80"
                    }
                  `}
                >
                  {label}
                </span>
              </div>
            </button>
          );
        }
      )}
    </div>
  </div>
</div>
      )}
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