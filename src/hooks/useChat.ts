import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/lib/auth';
import { getDisplayBio,getDisplayDetails,getDisplayName,getDisplayPhotos,shouldDisplayAnonymously } from "@/utils/incognitoUtils";
import { supabase, syncAppSession } from '@/integrations/supabase/client'; // Import sync function
// Create proper realtime subscription interface
export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface ChatMessage {
 
  content: string;
  sender: string;        // Changed to match your DB schema
  reciever: string;      // Changed to match your DB schema
  created_at: string;
  is_read: boolean;
  read_at?: string | null;
  type: string;          // Changed from message_type to type
  attachment_url?: string | null;
}

export interface ChatUser {
  id: string;
  first_name: string;
  last_name: string;
  photos: Array<{
    photo_url: string;
    photo_order: number;
    is_primary: boolean;
  }>;
  isOnline?: boolean;
  last_active_at?: string;
  bio?: string | null;
  year_of_study?: string | null;
  branch?: string | null;
  hometown?: string | null;
  incognito_mode?:boolean;
}

export interface ChatConversation {
  id: string;
  match_id: string;
  user: ChatUser;
  lastMessage: {
    content: string;
    created_at: string;
    sender: string;
  } | null;
  unreadCount: number;
  created_at: string;
  is_active: boolean;
}

// Simple realtime functions
// ✅ FIXED VERSION
function subscribeToMessages(userId: string, onMessage: (message: ChatMessage) => void): RealtimeSubscription {
  const channel = supabase.channel(`messages:${userId}`);

  // Supabase Realtime does not support OR in filters, so we use two .on() calls
  channel
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `sender=eq.${userId}` },
      (payload) => onMessage(payload.new as ChatMessage)
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `reciever=eq.${userId}` },
      (payload) => onMessage(payload.new as ChatMessage)
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

function subscribeToMatches(userId: string, onMatch: () => void): RealtimeSubscription {
  const channel = supabase.channel(`matches:${userId}`);

  // This can remain mostly unchanged — but use .on() chaining for safety
  channel
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "matches" },
      (payload) => {
        const match = payload.new as any;
        if (match.user1_id === userId || match.user2_id === userId) {
          onMatch();
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

export function useChat(user: Profile | null) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Real-time subscriptions
  const [messageSubscription, setMessageSubscription] = useState<RealtimeSubscription | null>(null);
  const [matchSubscription, setMatchSubscription] = useState<RealtimeSubscription | null>(null);

  const fetchConversations = useCallback(async () => {
  if (!user?.email) return;

  try {
    setLoading(true);
    
    // ✅ STEP 1: Perform the Handshake
    await syncAppSession(user.email);

    // ✅ STEP 2: Fetch matches (Now unlocked by RLS)
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('user1_id, user2_id, created_at, is_active')
      .or(`user1_id.eq.${user.email},user2_id.eq.${user.email}`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (matchesError) throw matchesError;

      if (!matches || matches.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 3. Process each match into a conversation
      const conversationPromises = matches.map(async (match) => {
        const otherUserId = match.user1_id === user.email ? match.user2_id : match.user1_id;
        
        // Consistent match ID generation
        const sortedUserIds = [match.user1_id, match.user2_id].sort();
        const generatedMatchId = sortedUserIds.join('_');

        // Fetch other user's data in parallel
        // RLS "Secure_View_Profiles" and "Photos_Viewable" will filter these
        const [profileResult, photosResult, lastMessageResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('email', otherUserId)
            .maybeSingle(),
          supabase
            .from('user_photos')
            .select('photo_url, photo_order, is_primary')
            .eq('user_email', otherUserId)
            .order('photo_order')
            .limit(3),
          supabase
            .from('messages')
            .select('content, created_at, sender')
            .or(`and(sender.eq.${user.email},reciever.eq.${otherUserId}),and(sender.eq.${otherUserId},reciever.eq.${user.email})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);

        // If the profile is blocked by RLS, we skip processing this conversation
        if (!profileResult.data) return null;

        // Get unread count specifically sent to current user by this person
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('reciever', user.email)
          .eq('sender', otherUserId)
          .eq('is_read', false);

        // Process incognito/privacy logic using your utils
        const displayDetails = getDisplayDetails(profileResult.data);
        const displayName = getDisplayName(profileResult.data);
        const displayBio = getDisplayBio(profileResult.data);
        const displayPhotos = getDisplayPhotos(
          profileResult.data, 
          photosResult.data?.map(p => p.photo_url) || []
        );

        return {
          id: generatedMatchId,
          match_id: generatedMatchId,
          user: {
            id: otherUserId,
            first_name: displayName,
            last_name: " ",
            photos: (displayPhotos || []).map((url: string, index: number) => ({
              photo_url: url,
              photo_order: index,
              is_primary: index === 0,
            })),
            last_active_at: profileResult.data?.last_active_at,
            bio: displayBio,
            year_of_study: displayDetails.year,
            branch: displayDetails.branch,
            hometown: displayDetails.hometown,
            gender: profileResult.data?.gender,
            height: displayDetails.height,
            incognito_mode: profileResult.data?.incognito_mode,
            college: profileResult.data?.college
          },
          lastMessage: lastMessageResult.data,
          unreadCount: unreadCount || 0,
          created_at: match.created_at || '',
          is_active: match.is_active || true
        };
      });

      // Wait for all promises and filter out any nulls (blocked profiles)
      const conversationData = (await Promise.all(conversationPromises)).filter(c => c !== null);

      // Sort by last message time, then by match creation time
      const sortedConversations = conversationData.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(sortedConversations);
      
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load conversations');
      toast({
        title: "Error loading conversations",
        description: "Failed to load your conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  // Inside useChat.ts



  const markMessagesAsRead = useCallback(async (otherUserId: string, currentUserId: string) => {
    try {
      // Fixed: Update using sender and receiver
      const { error } = await supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('sender', otherUserId)
        .eq('reciever', currentUserId)
        .eq('is_read', false);

      if (error) {
      } else {
        // Update conversations to reflect read messages
        setConversations(prev =>
          prev.map(conv => {
            if (conv.user.id === otherUserId) {
              return { ...conv, unreadCount: 0 };
            }
            return conv;
          })
        );
      }
    } catch (error) {
    }
  }, []);

  const fetchMessages = useCallback(async (matchId: string, limit: number = 50, offset: number = 0) => {
  try {
    setError(null);
    if (!user) throw new Error('User not authenticated');

    const userIds = matchId.split('_');
    const otherUserId = userIds.find(id => id !== user.email) || userIds[0];

    // 1. Fetch with DESCENDING order to get the "Latest" messages first from the DB
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender.eq.${user.email},reciever.eq.${otherUserId}),and(sender.eq.${otherUserId},reciever.eq.${user.email})`)
      .order('created_at', { ascending: false }) // Get newest first
      .range(offset, offset + limit - 1);        // Select the top 'limit' newest records

    if (error) {
      setError('Failed to load messages');
      return;
    }

    const transformedMessages: ChatMessage[] = (messagesData || []).map(msg => ({
      content: msg.content,
      sender: msg.sender,
      reciever: msg.reciever,
      created_at: msg.created_at || '',
      is_read: msg.is_read || false,
      type: msg.type || 'text'
    }));

    // 2. CRITICAL: Reverse the array so the UI displays them Chronologically 
    // (Oldest at the top, Newest at the bottom)
    const chronologicalMessages = transformedMessages.reverse();
    
   if (offset === 0) {
      setMessages(chronologicalMessages); // Show only the latest 100
    } else {
      setMessages(prev => [...chronologicalMessages, ...prev]);
    }

    setCurrentMatchId(matchId);
    await markMessagesAsRead(otherUserId, user.email);
  } catch (error) {
  }
}, [user, markMessagesAsRead]);
  // Inside useChat.ts -> sendMessage function
// @/hooks/useChat.ts

const sendMessage = async (content: string, type: string = 'text', attachmentUrl?: string) => {
  // 1. Guard: Ensure we have a user, a match, and actual text
  if (!user?.email || !currentMatchId || !content.trim()) return;

  try {
    setSendingMessage(true);
    
    // 2. Perform the Handshake
    await syncAppSession(user.email);

    // 3. Find the recipient
    const conversation = conversations.find(c => c.match_id === currentMatchId);
    const otherUserId = conversation?.user.id;

    if (!otherUserId) {
      console.error("Recipient not found");
      return;
    }

    // 4. Construct the message for the DB
    const newMessage = {
      content: content.trim(), // This is the "Hi" or "Hello"
      sender: user.email.toLowerCase(),
      reciever: otherUserId.toLowerCase(),
      type: type,
      attachment_url: attachmentUrl,
      is_read: false
    };

    // 5. Insert into Supabase
    const { data, error: insertError } = await supabase
      .from('messages')
      .insert(newMessage)
      .select() // This gets the full row back from the DB
      .single();

    if (insertError) throw insertError;

    // 6. ✅ THE CRITICAL FIX: Update the UI with the DB result
    // This ensures 'msg.content' is available for IndividualChat.tsx
    if (data) {
      setMessages(prev => [...prev, data as ChatMessage]);
    }

  } catch (err) {
    console.error('Send message error:', err);
    toast({
      title: "Failed to send message",
      variant: "destructive",
    });
  } finally {
    setSendingMessage(false);
  }
};
  const loadMoreMessages = useCallback(async (matchId: string, currentCount: number) => {
    if (!matchId) return;
    try {
      await fetchMessages(matchId, 25, currentCount);
    } catch (error) {
    }
  }, [fetchMessages]);

  const unmatch = useCallback(async (matchId: string) => {
    try {
      // The matchId is the generated 'user1_user2' string
      const userIds = matchId.split('_');
      if (userIds.length !== 2) throw new Error('Invalid match ID format for unmatching.');
      
      const [u1, u2] = userIds;

      // Update using the composite primary key
      const { error } = await supabase
        .from('matches')
        .update({ is_active: false })
        .or(`and(user1_id.eq.${u1},user2_id.eq.${u2}),and(user1_id.eq.${u2},user2_id.eq.${u1})`);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.match_id !== matchId));
      toast({
        title: 'Unmatched',
        description: 'You have successfully unmatched.',
        variant: 'destructive',
      });

      return { success: true };
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to unmatch.', variant: 'destructive' });
      return { success: false, error: 'Failed to unmatch' };
    }
  }, [toast]);

   useEffect(() => {
  let isMounted = true;
  // Local variables to track the channels for this specific effect run
  let msgChannel: any = null;
  let matchChannel: any = null;

  const setupSubscriptions = () => {
    if (!user || !isMounted) return;

    // 1. Setup Messages Channel
    msgChannel = supabase.channel(`messages:${user.email}`);
    
    msgChannel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sender=eq.${user.email}` },
        (payload: any) => handleIncomingMessage(payload.new as ChatMessage)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `reciever=eq.${user.email}` },
        (payload: any) => handleIncomingMessage(payload.new as ChatMessage)
      )
      .subscribe();

    // 2. Setup Matches Channel
    matchChannel = supabase.channel(`matches:${user.email}`);
    matchChannel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        (payload: any) => {
          const match = payload.new;
          if (match.user1_id === user.email || match.user2_id === user.email) {
            fetchConversations();
          }
        }
      )
      .subscribe();
  };

  // Helper function to keep the logic clean
  const handleIncomingMessage = (newMessage: ChatMessage) => {
    if (!isMounted) return;

    const sortedIds = [newMessage.sender, newMessage.reciever].sort();
    const incomingMatchId = sortedIds.join('_');

    // CONTEXT FILTER: Only add to messages if it's the current chat
    if (incomingMatchId === currentMatchId) {
      setMessages(prev => {
        const isDup = prev.some(m => m.created_at === newMessage.created_at && m.sender === newMessage.sender);
        if (isDup) return prev;
        return [...prev, newMessage].slice(-100);
      });

      if (newMessage.reciever === user.email) {
        markMessagesAsRead(newMessage.sender, user.email);
      }
    }
 
    // Always update the sidebar
    setConversations(prev =>
      prev.map(conv => {
        if (conv.match_id === incomingMatchId) {
          return {
            ...conv,
            lastMessage: {
              content: newMessage.content,
              created_at: newMessage.created_at,
              sender: newMessage.sender
            },
            unreadCount: (newMessage.sender !== user.email && incomingMatchId !== currentMatchId) 
              ? conv.unreadCount + 1 
              : conv.unreadCount
          };
        }
        return conv;
      }).sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      })
    );
  };

  setupSubscriptions();

  return () => {
    isMounted = false;
    // Cleanup: Only remove if they exist to avoid the WebSocket error
    if (msgChannel) supabase.removeChannel(msgChannel);
    if (matchChannel) supabase.removeChannel(matchChannel);
  };
}, [user?.email, currentMatchId, fetchConversations, markMessagesAsRead]);

  useEffect(() => {
  const initChat = async () => {
    if (user?.email) {
      // 1. Authenticate the connection for RLS
      await syncAppSession(user.email);
      // 2. Now the database will allow the fetch
      fetchConversations();
    }
  };
  initChat();
}, [user?.email, fetchConversations]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (messageSubscription) {
        messageSubscription.unsubscribe();
      }
      if (matchSubscription) {
        matchSubscription.unsubscribe();
      }
    };
  }, [messageSubscription, matchSubscription]);

  const clearCurrentChat = useCallback(() => {
    setCurrentMatchId(null);
    setMessages([]);
  }, []);

  const getUnreadCount = useCallback(() => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  }, [conversations]);

  return {
    conversations,
    messages,
    loading: false,
    sendingMessage,
    error,
    unmatch,
    currentMatchId,
    fetchConversations,
    fetchMessages,
    sendMessage,
    loadMoreMessages,
    setCurrentMatchId,
    clearCurrentChat,
    getUnreadCount,
    markMessagesAsRead
  };
} 