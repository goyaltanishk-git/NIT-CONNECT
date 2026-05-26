// src/hooks/useCommunity.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Community {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  join_type: string;
  member_count?: number;
}

export interface MyCommunity {
  community_id: string;
  role: string;
  community: {
    id: string;
    name: string;
    description: string;
    image_url: string | null;
  };
}

export interface CommunityMessage {
  id: string;
  content: string;
  created_at: string;
  sender_email: string;
  sender_name: string;

}

export function useCommunity(currentUser: any) {
  const [exploreCommunities, setExploreCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<MyCommunity[]>([]);
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [pendingCreatedCommunities, setPendingCreatedCommunities] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null);
  const [currentCommunityId, setCurrentCommunityId] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Track pending join requests locally
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  const currentCommunityIdRef = useRef<string | null>(null);
  useEffect(() => { currentCommunityIdRef.current = currentCommunityId; }, [currentCommunityId]);

  const { toast } = useToast();

  // 1. Fetch Explore Communities
  const fetchExploreCommunities = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_explore_communities', {
        p_email: currentUser.email
      });
      if (error) throw error;
      setExploreCommunities((data as Community[]) || []);
    } catch (err) {
      console.error('Error fetching explore communities:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  const fetchPendingCreatedCommunities = useCallback(async () => {
  if (!currentUser?.email) return;

  try {
    const { data, error } = await supabase.rpc(
      "get_pending_created_communities",
      { p_email: currentUser.email }
    );
  
    if (error) throw error;

    setPendingCreatedCommunities(data || []);
  } catch (err) {
    console.error("Error fetching pending created communities:", err);
  }
}, [currentUser?.email]);
const fetchPendingRequests = useCallback(async () => {
  if (!currentUser?.email) return;

  try {
    const { data, error } = await supabase.rpc("get_my_pending_requests", {
      p_email: currentUser.email,
    });

    if (error) throw error;

    const set = new Set<string>();

    (data || []).forEach((r: any) => {
      set.add(r.community_id);
    });

    setPendingRequests(set);
  } catch (err) {
    console.error("Error fetching pending requests:", err);
  }
}, [currentUser?.email]);
  // 2. Fetch My Communities
  const fetchMyCommunities = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      const { data, error } = await supabase.rpc('get_my_communities', {
        p_email: currentUser.email
      });
      if (error) throw error;
      setMyCommunities((data as MyCommunity[]) || []);
    } catch (err) {
      console.error('Error fetching my communities:', err);
    }
  }, [currentUser?.email]);

  // 3. Join Community
  const joinCommunity = useCallback(async (communityId: string) => {
    if (!currentUser?.email) return;
    setJoiningCommunity(communityId);
    try {
      const { data, error } = await supabase.rpc('join_community', {
        p_community_id: communityId,
        p_email: currentUser.email
      });
      if (error) throw error;

      const result = data as string;

      if (result === 'JOINED') {
        toast({ title: "Joined!", description: "You've successfully joined the community." });
        // Refresh both lists
        fetchExploreCommunities();
        fetchMyCommunities();
      } else if (result === 'REQUEST_SENT') {
        toast({ title: "Request Sent", description: "Your join request has been sent to the moderator." });
        setPendingRequests(prev => new Set(prev).add(communityId));
      } else if (result === 'LIMIT_REACHED') {
        setShowUpgradePrompt(true);
      }

      return result;
    } catch (err) {
      console.error('Error joining community:', err);
      toast({ title: "Error", description: "Failed to join community", variant: "destructive" });
    } finally {
      setJoiningCommunity(null);
    }
  }, [currentUser?.email, toast, fetchExploreCommunities, fetchMyCommunities]);

  // 4. Fetch Community Messages
  const fetchCommunityMessages = useCallback(async (communityId: string) => {
    if (!currentUser?.email) return;
    setCurrentCommunityId(communityId);
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_community_messages', {
        p_community_id: communityId,
        p_email: currentUser.email
      });
      if (error) throw error;
      setCommunityMessages((data as CommunityMessage[]) || []);
    } catch (err) {
      console.error('Error fetching community messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [currentUser?.email]);

  // 5. Send Community Message
  const sendCommunityMessage = useCallback(async (content: string) => {
    if (!currentUser?.email || !currentCommunityId || !content.trim()) return;

    const tempMessage: CommunityMessage = {
      id: `temp-${Date.now()}`,
      content,
      sender_email: currentUser.email,
      created_at: new Date().toISOString(),
      sender_name: currentUser.first_name || currentUser.email.split('@')[0],
    };

    setCommunityMessages(prev => [...prev, tempMessage]);
    setSendingMessage(true);

    try {
      const { error } = await supabase.rpc('send_community_message', {
        p_community_id: currentCommunityId,
        p_content: content,
        p_email: currentUser.email
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove failed message
      setCommunityMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  }, [currentUser?.email, currentCommunityId, toast]);

  // 6. Clear current community chat
  const clearCurrentCommunityChat = useCallback(() => {
    setCurrentCommunityId(null);
    setCommunityMessages([]);
  }, []);

  // Realtime subscription for community messages
  useEffect(() => {
    if (!currentUser?.email) return;

    fetchExploreCommunities();
    fetchMyCommunities();
    fetchPendingRequests(); 
    fetchPendingCreatedCommunities();

    const channel = supabase
      .channel('community_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          const newMsg = payload.new as any;

          // If this message belongs to the currently active community chat
          if (currentCommunityIdRef.current === newMsg.community_id) {
            setCommunityMessages(prev => {
              // Deduplicate
              const exists = prev.some(m =>
                m.id === newMsg.id ||
                (m.created_at === newMsg.created_at && m.content === newMsg.content && m.sender_email === newMsg.sender_email)
              );
              if (exists) return prev;

              return [...prev, {
                id: newMsg.id,
                content: newMsg.content,
                created_at: newMsg.created_at,
                sender_email: newMsg.sender_email,
                sender_name: newMsg.sender_name, // Will be updated on next fetch
              }];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.email, fetchExploreCommunities, fetchMyCommunities]);

  return {
    exploreCommunities,
    myCommunities,
    communityMessages,
    loading,
    messagesLoading,
    sendingMessage,
    joiningCommunity,
    pendingRequests,
    currentCommunityId,
    showUpgradePrompt,
    setShowUpgradePrompt,
    fetchExploreCommunities,
    fetchMyCommunities,
    fetchCommunityMessages,
    joinCommunity,
    pendingCreatedCommunities,
    sendCommunityMessage,
    clearCurrentCommunityChat,
    setMyCommunities
  };
}
