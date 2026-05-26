// src/components/community/CommunityScreen.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button as UIButton } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AdminPanel } from "./AdminPanel";
import {
  Users,
  Sparkles,
  ArrowLeft,
  Globe,
  UserCheck,
  Clock,
  LogIn,
  Plus
} from "lucide-react";
import { CommunityChat } from "./CommunityChat";
import { useCommunity, MyCommunity } from "@/hooks/useCommunity";
import { useAuth } from "@/hooks/useAuth";
import { CreateCommunityModal } from "./CreateCommunityModal";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";

interface CommunityScreenProps {
  onNavigateBack?: () => void;
  setiscommunityopen?: (value: boolean) => void;
}

type TabType = "explore" | "my";

export function CommunityScreen({
  onNavigateBack,
  setiscommunityopen,
}: CommunityScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>("explore");
  const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);
  const { user: currentUser } = useAuth();
  const [ShowCreate, setShowCreate] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
const [showAdminPanel, setShowAdminPanel] = useState(false);

  const {
    exploreCommunities,
    myCommunities,
    communityMessages,
    loading,
    messagesLoading,
    joiningCommunity,
    pendingRequests,
    showUpgradePrompt,
    setShowUpgradePrompt,
    fetchCommunityMessages,
    joinCommunity,
    pendingCreatedCommunities,
    sendCommunityMessage,
    clearCurrentCommunityChat,
    setMyCommunities
  } = useCommunity(currentUser);

  useEffect(() => {
    if (selectedCommunity) {
      fetchCommunityMessages(selectedCommunity.id);
    }
    return () => {
      clearCurrentCommunityChat();
    };
  }, [selectedCommunity, fetchCommunityMessages, clearCurrentCommunityChat]);

  useEffect(() => {
  const checkAdmin = async () => {
    if (!currentUser?.email) return;

    const { data } = await supabase.rpc("is_job_admin", {
      p_email: currentUser.email,
    });

    setIsAdmin(data === true);
  };

  checkAdmin();
}, [currentUser]);

  const handleSendMessage = async (content: string) => {
    if (!selectedCommunity) return;
    await sendCommunityMessage(content);
  };

  const handleJoinCommunity = async (communityId: string) => {
    await joinCommunity(communityId);
  };

  // Check if user is a member of a community
  const isMember = (communityId: string) => {
    return myCommunities.some((mc) => mc.community_id === communityId);
  };

  const isPending = (communityId: string) => {
    return pendingRequests.has(communityId);
  };
  console.log(selectedCommunity);

  // If a community chat is selected (from My Communities)
  if (selectedCommunity && currentUser) {
    return (
      <CommunityChat
        community={selectedCommunity}
        messages={communityMessages}
        currentUserEmail={currentUser.email}
        role={selectedCommunity.role}
        
        onBack={() => {
          setSelectedCommunity(null);
          setiscommunityopen?.(false);
        }}
        
        onSendMessage={handleSendMessage}
        messagesLoading={messagesLoading}
        setMyCommunities={setMyCommunities}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="h-8 w-8 text-pink-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Loading communities...
            </h3>
            <p className="text-gray-400">Discovering communities for you</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Header */}

      <div className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 p-4">
        <div className="flex items-center gap-4">
          <UIButton
            variant="ghost"
            size="icon"
            onClick={onNavigateBack}
            className="h-10 w-10 rounded-full hover:bg-white/20 transition-all flex-shrink-0"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </UIButton>
          <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-sm flex-shrink-0">
            <Users className="h-6 w-6 text-pink-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Communities
            </h1>
            <p className="text-sm text-gray-400">
              {activeTab === "explore"
                ? `${exploreCommunities.length} available`
                : `${myCommunities.length} joined`}
            </p>
          </div>
          <div className="flex space-x-1 flex-shrink-0">
            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
            <Sparkles className="h-3 w-3 text-pink-400 animate-pulse" />
            <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
          </div>
          {isAdmin && (
  <UIButton
    onClick={() => setShowAdminPanel(true)}
    className="bg-red-600 text-white px-3 py-1 rounded-lg"
  >
    Admin
  </UIButton>
)}
        </div>

        {/* Tab Switcher */}
        <div className="flex mt-4 bg-white/5 rounded-full p-1 border border-white/10">
          <button
            onClick={() => setActiveTab("explore")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "explore"
                ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Globe className="h-4 w-4" />
            Explore
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "my"
                ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            My Communities
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "explore" ? (
          <ExploreTab
            communities={exploreCommunities}
            isMember={isMember}
            isPending={isPending}
            joiningCommunity={joiningCommunity}
            onJoin={handleJoinCommunity}
          />
        ) : (
          <MyCommunitiesTab
            myCommunities={myCommunities}
            pendingCreatedCommunities={pendingCreatedCommunities}
         
            onSelectCommunity={(community) => {
              setSelectedCommunity(community);
              setiscommunityopen?.(true);
            }}
          />
        )}
      </div>

      {/* Bottom button */}
      <div className="sticky bottom-0 z-40 p-4 bg-gradient-to-t from-black to-transparent">
        <UIButton
  onClick={() => setShowCreate(true)}
  className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg"
>
  <Plus className="h-6 w-6" />
</UIButton>
      </div>
{showAdminPanel && currentUser&&(
  <AdminPanel
    email={currentUser.email}
    onClose={() => setShowAdminPanel(false)}
  />
)}
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-3/4 left-3/4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        {Array.from({ length: 8 }).map((_, i) => (
          <Users
            key={i}
            className="absolute w-3 h-3 text-pink-500/10 animate-float"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      {ShowCreate && (
  <CreateCommunityModal
    onClose={() => setShowCreate(false)}
    onCreated={() => {
     // refresh explore
    }}
  />
)}
    </div>
  );
}

// ==========================================
// Explore Tab Component
// ==========================================
interface ExploreTabProps {
  communities: any[];
  isMember: (id: string) => boolean;
  isPending: (id: string) => boolean;
  joiningCommunity: string | null;
  onJoin: (id: string) => void;
}

function ExploreTab({
  communities,
  isMember,
  isPending,
  joiningCommunity,
  onJoin,
}: ExploreTabProps) {
  if (communities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-8 animate-fade-in">
          <div className="h-32 w-32 bg-white/5 backdrop-blur-sm rounded-full flex items-center justify-center relative border border-white/10">
            <Globe className="h-16 w-16 text-pink-500/60 animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            No communities yet
          </h2>
          <p className="text-gray-400 text-base max-w-md leading-relaxed">
            Communities will appear here once they are approved. Check back
            soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {communities.map((community, index) => {
        const memberAlready = isMember(community.id);
        const pending = isPending(community.id);

        return (
          <Card
            key={community.id}
            className={`bg-white/5 backdrop-blur-sm border-white/10 transition-all duration-500 hover:scale-[1.02] hover:bg-white/10 animate-fade-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Community Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-16 w-16 ring-2 ring-pink-500/30">
                    {community.image_url ? (
                      <AvatarImage src={community.image_url} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 font-semibold text-2xl">
                      {community.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Community Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-lg text-white truncate">
                      {community.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-xs flex-shrink-0 ml-2 ${
                        community.join_type === "open"
                          ? "border-green-500/50 text-green-400"
                          : "border-yellow-500/50 text-yellow-400"
                      }`}
                    >
                      {community.join_type === "open" ? "Open" : "Restricted"}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {community.description || "No description"}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {community.member_count || 0} members
                    </span>

                    {memberAlready ? (
                      <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Joined
                      </Badge>
                    ) : pending ? (
                      <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    ) : (
                      <UIButton
                        size="sm"
                        disabled={joiningCommunity === community.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onJoin(community.id);
                        }}
                        className="rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs px-4 h-8"
                      >
                        {joiningCommunity === community.id ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <LogIn className="h-3 w-3 mr-1" />
                            Join
                          </>
                        )}
                      </UIButton>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}

// ==========================================
// My Communities Tab Component
// ==========================================
interface MyCommunitiesTabProps {
  myCommunities: MyCommunity[];
  pendingCreatedCommunities:any[];
  onSelectCommunity: (community: any) => void;
}

function MyCommunitiesTab({
  myCommunities,
  onSelectCommunity,
  pendingCreatedCommunities
  
}: MyCommunitiesTabProps) {
   
  if (myCommunities.length === 0&&pendingCreatedCommunities.length===0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-8 animate-fade-in">
          <div className="h-32 w-32 bg-white/5 backdrop-blur-sm rounded-full flex items-center justify-center relative border border-white/10">
            <UserCheck className="h-16 w-16 text-pink-500/60 animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            No communities joined
          </h2>
          <p className="text-gray-400 text-base max-w-md leading-relaxed">
            Join communities from the Explore tab to start chatting with groups!
          </p>
        </div>
      </div>
    );
  }
 console.log(pendingCreatedCommunities);
  return (
    <>
      <UpgradeModal
        open={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        userEmail={currentUser?.email || ""}
        userName={currentUser?.first_name}
      />

      {pendingCreatedCommunities.length > 0 && (
  <>
    

    {pendingCreatedCommunities.map((pc, index) => (
      <Card
        key={pc.id}
        className="bg-white/5 border-white/10 opacity-60 cursor-not-allowed"
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">

            <Avatar className="h-16 w-16 ring-2 ring-blue-500/30">
              {pc.image_url ? (
                <AvatarImage src={pc.image_url} />
              ) : (
                <AvatarFallback>
                  {pc.name[0]?.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">
                {pc.name}
              </h3>

              <p className="text-sm text-gray-400">
                {pc.description || "No description"}
              </p>

              <p className="text-xs text-blue-400 mt-1">
                Waiting for admin approval
              </p>
            </div>

          </div>
        </CardContent>
      </Card>
    ))}
  </>
)}
      {myCommunities.map((mc, index) => (
        <Card
          key={mc.community_id}
          className="bg-white/5 backdrop-blur-sm border-white/10 transition-all duration-500 hover:scale-[1.02] hover:bg-white/10 cursor-pointer animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
          onClick={() =>
            onSelectCommunity({
              id: mc.community_id,
              name: mc.community.name,
              description: mc.community.description,
              image_url: mc.community.image_url,
              role:mc.role
            })
          }
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Community Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-16 w-16 ring-2 ring-pink-500/30 transition-all duration-300 hover:ring-pink-500/50">
                  {mc.community.image_url ? (
                    <AvatarImage src={mc.community.image_url} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 font-semibold text-2xl">
                    {mc.community.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Community Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-xl text-white truncate hover:text-pink-300 transition-colors duration-300">
                    {mc.community.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-xs flex-shrink-0 ml-2 border-pink-500/30 text-pink-400 capitalize"
                  >
                    {mc.role}
                  </Badge>
                </div>

                <p className="text-sm text-gray-400 truncate">
                  {mc.community.description || "Tap to open group chat"}
                </p>
              </div>

              {/* Chat indicator */}
              <div className="flex-shrink-0">
                <div className="p-2 rounded-full bg-pink-500/10">
                  <Users className="h-5 w-5 text-pink-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
    </>
  );
}
