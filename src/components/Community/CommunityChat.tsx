import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Send,
  Users,
  Lock,
  MoreVertical,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommunityMessage } from "@/hooks/useCommunity";
import { CommunityDetailsModal } from "./CommunityDetailsModal";

interface CommunityInfo {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  member_count?: number;
  created_by?: string;
}

interface Props {
  community: CommunityInfo;
  messages: CommunityMessage[];

  currentUserEmail: string;
  role: string;
  onBack: () => void;
   
  onSendMessage: (content: string) => void;
  messagesLoading: boolean;
  setMyCommunities: any;
}

export function CommunityChat({
  community,
  messages,
  currentUserEmail,
  role,
  onBack,
 
  onSendMessage,
  messagesLoading,
  setMyCommunities
}: Props) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const isModerator = role === "moderator";


  const [showDetails, setShowDetails] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [requestsCount, setRequestsCount] = useState(0);

  // 🔥 FETCH REQUEST COUNT
  const fetchRequestCount = async () => {
    if (!isModerator) return;

    const { data } = await supabase.rpc("get_community_requests", {
      p_community_id: community.id,
      p_email: currentUserEmail,
    });

    setRequestsCount(data?.length || 0);
  };

  useEffect(() => {
    fetchRequestCount();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  

  const handleLeaveCommunity = async () => {
  setShowMenu(false); // 👈 close menu

  const confirmLeave = confirm("Are you sure you want to leave this community?");
  if (!confirmLeave) return;

  const { data, error } = await supabase.rpc("leave_community", {
    p_community_id: community.id,
    p_email: currentUserEmail,
  });

  if (error) {
    return;
  }

  if (data === "LEFT") {
    // BUG-084: state update before unmount
    setMyCommunities((prev: any[]) =>
      prev.filter((c: any) => c.community_id !== community.id)
    );
    onBack();
  }
};



  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage("");
  };
  return (
    <div className="h-full flex flex-col bg-black text-white">

      {/* HEADER */}
      <div className="border-b border-white/10 p-4 flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft />
          </Button>

          {/* CLICKABLE HEADER */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setShowDetails(true)}
          >
            <Avatar>
              {community.image_url ? (
                <img src={community.image_url} />
              ) : (
                <AvatarFallback>
                  {community.name[0]?.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            <div>
              <h2 className="font-bold">{community.name}</h2>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="h-3 w-3" />
                
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        {/* RIGHT SIDE */}
<div className="flex items-center gap-3 relative">

  {/* MODERATOR VIEW */}
  {isModerator ? (
    <div className="relative">
      <ShieldCheck
        className="cursor-pointer text-pink-400"
        onClick={() => setShowRequests(true)}
      />
      {requestsCount > 0 && (
        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
      )}
    </div>
  ) : (
    <>
      {/* MEMBER VIEW (ONLY MENU) */}
      <MoreVertical
        className="cursor-pointer"
        onClick={() => setShowMenu(prev => !prev)}
      />

      {showMenu && (
        <div className="absolute right-0 top-8 bg-black border border-white/10 rounded-lg p-2 space-y-2">
          
     {!confirmLeave ? (
  <button
    className="block w-full text-left text-sm hover:text-red-400"
    onClick={() => setConfirmLeave(true)}
  >
    Leave Community
  </button>
) : (
  <div className="space-y-2">
    <p className="text-xs text-gray-400">Are you sure?</p>

    <div className="flex gap-2">
      <button
        className="text-red-400 text-sm"
        onClick={async () => {
          const { data } = await supabase.rpc("leave_community", {
            p_community_id: community.id,
            p_email: currentUserEmail,
          });

          if (data === "LEFT") {
            // BUG-084: update state BEFORE onBack() to avoid setState on unmounted component
            setMyCommunities((prev: any[]) =>
              prev.filter((c: any) => c.community_id !== community.id)
            );
            onBack();
          }
        }}
      >
        Yes
      </button>

      <button
        className="text-gray-400 text-sm"
        onClick={() => setConfirmLeave(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}

          <button className="block w-full text-left text-sm hover:text-yellow-400">
            Report Community
          </button>

        </div>
      )}
    </>
  )}

</div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <Card className="text-center text-pink-400 p-2">
          <Lock className="inline h-4 w-4" /> Community Chat
        </Card>

        {messagesLoading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400">
            No messages yet 👋
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_email === currentUserEmail;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isMe ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "px-3 py-2 rounded-xl max-w-[70%]",
                    isMe
                      ? "bg-pink-600"
                      : "bg-white/10 border border-white/10"
                  )}
                >
                  {!isMe && (
                    <p className="text-xs mb-1 text-pink-400">
                      {msg.first_name}
                    </p>
                  )}
                  <p>{msg.content}</p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t border-white/10 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type message..."
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />

        <Button onClick={handleSendMessage}>
          <Send />
        </Button>
      </div>

      {/* COMMUNITY DETAILS MODAL */}
     {showDetails && (
  <CommunityDetailsModal
    community={community}
    onClose={() => setShowDetails(false)}
  />
)}

      {/* REQUEST PAGE (SEPARATE) */}
      {showRequests && (
        <RequestModal
          community={community}
          currentUserEmail={currentUserEmail}
          onClose={() => {
            setShowRequests(false);
            fetchRequestCount();
          }}
        />
      )}
    </div>
  );
}

function RequestModal({ community, currentUserEmail, onClose }: any) {
  const [requests, setRequests] = useState<any[]>([]);

  const fetch = async () => {
    const { data } = await supabase.rpc("get_community_requests", {
      p_community_id: community.id,
      p_email: currentUserEmail,
    });
    setRequests(data || []);
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 p-4">
      <h2 className="text-lg font-bold mb-4">Join Requests</h2>

      {requests.map((r) => (
        <div key={r.email} className="flex justify-between mb-3">
          <span>{r.email}</span>

          <div className="flex gap-2">
            <Button onClick={async () => {
              await supabase.rpc("approve_join_request", {
                p_community_id: community.id,
                p_target_email: r.email,
                p_email: currentUserEmail,
              });
              fetch();
            }}>
              Approve
            </Button>

            <Button variant="destructive" onClick={async () => {
              await supabase.rpc("reject_join_request", {
                p_community_id: community.id,
                p_target_email: r.email,
                p_email: currentUserEmail,
              });
              fetch();
            }}>
              Reject
            </Button>
          </div>
        </div>
      ))}

      <Button onClick={onClose}>Close</Button>
    </div>
  );
}