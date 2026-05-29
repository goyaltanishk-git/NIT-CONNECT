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
    fetchPendingCreatedCommunities,
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
  const success = await joinCommunity(communityId);

  if (success) {
    setActiveTab("my");

    // optional small delay for fresh fetch
   
  }
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
      <div className="flex min-h-dvh items-center justify-center bg-[#050506]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
          </div>
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Loading communities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#050506] text-zinc-100">
      {/* Hero */}
      <div className="border-b border-zinc-800 bg-[#050506]">
        <div className="px-4 py-4 md:px-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="space-y-2">
                <h1 className="text-[clamp(1.8rem,9vw,4.4rem)] font-black leading-[0.9] tracking-[-0.06em] text-zinc-100">
                  NIT DISCORD
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
                  Join student communities, discover fresh groups, and chat in real time.
                </p>
              </div>
              {isAdmin && (
                <UIButton
                  onClick={() => setShowAdminPanel(true)}
                  className="h-10 rounded-none border border-red-500/50 bg-red-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-200 hover:bg-red-500/30"
                >
                  Admin
                </UIButton>
              )}
            </div>

            <div className="inline-flex items-center border border-zinc-700 bg-zinc-900 p-1">
              <button
                onClick={() => setActiveTab("explore")}
                className={`inline-flex min-w-[160px] items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                  activeTab === "explore"
                    ? "bg-pink-500 text-black"
                    : "bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <Globe className="h-4 w-4" />
                Explore
              </button>
              <button
                onClick={() => setActiveTab("my")}
                className={`inline-flex min-w-[160px] items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                  activeTab === "my"
                    ? "bg-cyan-400 text-black"
                    : "bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                My Communities
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
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
            showUpgradePrompt={showUpgradePrompt}
            setShowUpgradePrompt={setShowUpgradePrompt}
            currentUser={currentUser}
            onSelectCommunity={(community) => {
              setSelectedCommunity(community);
              setiscommunityopen?.(true);
            }}
          />
        )}
      </div>

      {/* Bottom button */}
      <div className="pointer-events-none sticky bottom-0 z-40 p-4">
        <UIButton
          onClick={() => setShowCreate(true)}
          className="pointer-events-auto fixed bottom-24 right-6 z-50 h-14 w-14 rounded-md border border-pink-500/50 bg-pink-500 text-black shadow-[0_16px_28px_rgba(0,0,0,0.45)] hover:bg-pink-400"
        >
          <Plus className="h-6 w-6" />
        </UIButton>
      </div>
      {showAdminPanel && currentUser && (
        <AdminPanel
          email={currentUser.email}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
      {ShowCreate && (
       <CreateCommunityModal
  onClose={() => setShowCreate(false)}
  onCreated={async() => {
    setShowCreate(false);
    await fetchPendingCreatedCommunities();
    setActiveTab("my");

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
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900">
          <Globe className="h-10 w-10 text-zinc-500" />
          </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold uppercase tracking-[0.1em] text-zinc-100">
            No communities yet
          </h2>
          <p className="max-w-md text-sm text-zinc-500">
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
            className="animate-fade-in border-zinc-800 bg-[#0a0a0d] transition-all duration-300 hover:border-zinc-600"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Community Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-16 w-16 ring-1 ring-zinc-700">
                    {community.image_url ? (
                      <AvatarImage src={community.image_url} />
                    ) : null}
                    <AvatarFallback className="bg-zinc-900 text-zinc-200 font-semibold text-2xl">
                      {community.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Community Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="truncate text-lg font-semibold text-zinc-100">
                      {community.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-xs flex-shrink-0 ml-2 ${
                        community.join_type === "open"
                          ? "border-emerald-500/40 text-emerald-300"
                          : "border-amber-500/40 text-amber-300"
                      }`}
                    >
                      {community.join_type === "open" ? "Open" : "Restricted"}
                    </Badge>
                  </div>

                  <p className="mb-3 line-clamp-2 text-sm text-zinc-500">
                    {community.description || "No description"}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Users className="h-3 w-3" />
                      {community.member_count || 0} members
                    </span>

                    {memberAlready ? (
                      <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Joined
                      </Badge>
                    ) : pending ? (
                      <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-300">
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
                        className="h-8 rounded-md border border-pink-500/45 bg-pink-500 px-4 text-xs font-semibold text-black hover:bg-pink-400"
                      >
                        {joiningCommunity === community.id ? (
                          <div className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
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
  showUpgradePrompt: boolean;
  setShowUpgradePrompt: (value: boolean) => void;
  currentUser: any;
  onSelectCommunity: (community: any) => void;
}

function MyCommunitiesTab({
  myCommunities,
  onSelectCommunity,
  pendingCreatedCommunities,
  showUpgradePrompt,
  setShowUpgradePrompt,
  currentUser
  
}: MyCommunitiesTabProps) {
   
  if (myCommunities.length === 0&&pendingCreatedCommunities.length===0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900">
          <UserCheck className="h-10 w-10 text-zinc-500" />
          </div>
        <div className="space-y-3">
          <h2 className="text-xl font-semibold uppercase tracking-[0.1em] text-zinc-100">
            No communities joined
          </h2>
          <p className="max-w-md text-sm text-zinc-500">
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
        className="cursor-not-allowed border-zinc-800 bg-zinc-900/70 opacity-70"
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">

            <Avatar className="h-16 w-16 ring-1 ring-zinc-700">
              {pc.image_url ? (
                <AvatarImage src={pc.image_url} />
              ) : (
                <AvatarFallback className="bg-zinc-950 text-zinc-200">
                  {pc.name[0]?.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-100">
                {pc.name}
              </h3>

              <p className="text-sm text-zinc-500">
                {pc.description || "No description"}
              </p>

              <p className="mt-1 text-xs uppercase tracking-[0.1em] text-sky-300">
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
          className="animate-fade-in cursor-pointer border-zinc-800 bg-[#0a0a0d] transition-all duration-300 hover:border-zinc-600"
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
                <Avatar className="h-16 w-16 ring-1 ring-zinc-700">
                  {mc.community.image_url ? (
                    <AvatarImage src={mc.community.image_url} />
                  ) : null}
                  <AvatarFallback className="bg-zinc-900 text-zinc-200 font-semibold text-2xl">
                    {mc.community.name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Community Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="truncate text-xl font-semibold text-zinc-100">
                    {mc.community.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className="ml-2 flex-shrink-0 border-zinc-600 text-xs capitalize text-zinc-300"
                  >
                    {mc.role}
                  </Badge>
                </div>

                <p className="truncate text-sm text-zinc-500">
                  {mc.community.description || "Tap to open group chat"}
                </p>
              </div>

              {/* Chat indicator */}
              <div className="flex-shrink-0">
                <div className="rounded-md border border-zinc-700 bg-zinc-900 p-2">
                  <Users className="h-5 w-5 text-zinc-300" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
    </>
  );
}
