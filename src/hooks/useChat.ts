import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/lib/auth';
import { getDisplayBio,getDisplayDetails,getDisplayName,getDisplayPhotos,shouldDisplayAnonymously } from "@/utils/incognitoUtils";

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
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Real-time subscriptions
  const [messageSubscription, setMessageSubscription] = useState<RealtimeSubscription | null>(null);
  const [matchSubscription, setMatchSubscription] = useState<RealtimeSubscription | null>(null);

  const fetchConversations = useCallback(async () => {
    console.log("🐛 DEBUG: 1. --- Starting fetchConversations ---");
    try {
      setLoading(true);
      console.log("🐛 DEBUG: 2. Checking for provided user object:", user);
      
      if (!user) {
        console.error("🐛 DEBUG: EXIT - No user provided to useChat hook. Aborting.");
        setConversations([]);
        setLoading(false);
        return;
      }

      console.log(`🐛 DEBUG: 3. Querying matches for user email: ${user.email}`);
      
      // Get matches for current user
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('user1_id, user2_id, created_at, is_active')
        .or(`user1_id.eq.${user.email},user2_id.eq.${user.email}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (matchesError) {
        console.error("🐛 DEBUG: ERROR - Supabase error fetching matches:", matchesError);
        throw matchesError;
      }

      console.log("🐛 DEBUG: 4. Received matches from Supabase:", matches);
      
      if (!matches || matches.length === 0) {
        console.log("🐛 DEBUG: EXIT - No matches found in the database. The function will now stop.");
        setConversations([]);
        setLoading(false);
        return;
      }

      console.log(`🐛 DEBUG: 5. Found ${matches.length} matches. Now fetching profile data for each...`);

      // Get conversation data for each match
      const conversationPromises = matches.map(async (match) => {
        const otherUserId = match.user1_id === user.email ? match.user2_id : match.user1_id;
        const sortedUserIds = [match.user1_id, match.user2_id].sort();
        const generatedMatchId = sortedUserIds.join('_');
  console.log(`[DEBUG] Fetching profile for email: '${otherUserId}'`);
      

        // Fetch other user's profile and photos in parallel
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
          // Fixed: Query messages using sender and receiver
          supabase
            .from('messages')
            .select('content, created_at, sender')
            .or(`and(sender.eq.${user.email},reciever.eq.${otherUserId}),and(sender.eq.${otherUserId},reciever.eq.${user.email})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);
        
        

        // Get unread count - Fixed: Using sender and receiver
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('reciever', user.email)
          .eq('sender', otherUserId)
          .eq('is_read', false);
         const displayDetails = getDisplayDetails(profileResult.data);
          const displayName = getDisplayName(profileResult.data);
          const displayBio = getDisplayBio(profileResult.data);
          const displayPhotos = getDisplayPhotos(profileResult.data, photosResult.data?.map(p => p.photo_url) || []);
             
          // const displayPhotos = getDisplayPhotos(profileResult.data, profileResult.data.photos?.map(p => p.photo_url) || []);
          const isAnonymous = shouldDisplayAnonymously(profileResult.data);
          console.log(profileResult.data);
          console.log(photosResult.data);
          console.log(displayPhotos);


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
    gender:profileResult.data?.gender,
    height:displayDetails.height,
    incognito_mode:profileResult.data?.incognito_mode
          },
          lastMessage: lastMessageResult.data,
          unreadCount: unreadCount || 0,
          created_at: match.created_at || '',
          is_active: match.is_active || true
        };
      });

      const conversationData = await Promise.all(conversationPromises);

      // Sort by last message time, then by match creation time
      const sortedConversations = conversationData.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(sortedConversations);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
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

  const fetchMessages = useCallback(async (matchId: string, limit: number = 100000, offset: number = 0) => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Extract the other user ID from matchId
      const userIds = matchId.split('_');
      if (userIds.length !== 2) {
        throw new Error('Invalid match ID format');
      }
      
      const otherUserId = userIds.find( id => id !== user.email) || userIds[0];
      
      console.log('Fetching messages between:', user.email, 'and', otherUserId);
      
      // Fixed: Query using sender and receiver instead of user1_id and user2_id
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender.eq.${user.email},reciever.eq.${otherUserId}),and(sender.eq.${otherUserId},reciever.eq.${user.email})`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
        return;
      }

      // Transform the data to match our ChatMessage interface
      const transformedMessages: ChatMessage[] = (messagesData || []).map(msg => ({
     // id: msg.id,
        content: msg.content,
        sender: msg.sender,
        reciever: msg.reciever,
        created_at: msg.created_at || '',
        is_read: msg.is_read || false,
        read_at: msg.read_at,
        type: msg.type || 'text',
        attachment_url: msg.attachment_url
      }));

      const reversedMessages = transformedMessages.reverse();
      
      if (offset === 0) {
        setMessages(reversedMessages);
      } else {
        setMessages(prev => [...reversedMessages, ...prev]);
      }

      setCurrentMatchId(matchId);
      
      // Mark messages as read
      if (user) {
        await markMessagesAsRead(otherUserId, user.email);
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  }, [user]);

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
        console.error('Error marking messages as read:', error);
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
      console.error('Error marking messages as read:', error);
    }
  }, []);

  const sendMessage = useCallback(async (matchId: string, content: string) => {
    if (!content.trim()) {
      return { success: false, error: 'Message cannot be empty' };
    }

    try {
      setSendingMessage(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Extract the other user ID from matchId
      const userIds = matchId.split('_');
      if (userIds.length !== 2) {
        throw new Error('Invalid match ID format');
      }
      
      const otherUserId = userIds.find(id => id !== user.email);
      if (!otherUserId) {
        throw new Error('Could not determine reciever');
      }

      console.log('Sending message from:', user.email, 'to:', otherUserId);

      // Fixed: Insert message with sender and receiver
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender: user.email,
          reciever: otherUserId,
          content: content.trim(),
          type: 'text',
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      // Transform the response to match our interface
      const newMessage: ChatMessage = {
        //id: data.id,
        content: data.content,
        sender: data.sender,
        reciever: data.reciever,
        created_at: data.created_at || '',
        is_read: data.is_read || false,
        read_at: data.read_at,
        type: data.type || 'text',
        attachment_url: data.attachment_url
      };

      // Add message to local state immediately for better UX
      if (currentMatchId === matchId) {
        setMessages(prev => [...prev, newMessage]);
      }

      // Update conversations to reflect the new last message
      setConversations(prev =>
        prev.map(conv => {
          if (conv.match_id === matchId) {
            return {
              ...conv,
              lastMessage: {
                content: newMessage.content,
                created_at: newMessage.created_at,
                sender: newMessage.sender
              }
            };
          }
          return conv;
        }).sort((a, b) => {
          const aTime = a.lastMessage?.created_at || a.created_at;
          const bTime = b.lastMessage?.created_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        })
      );

      return { success: true, message: newMessage };

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = 'Failed to send message';
      setError(errorMessage);
      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again",
        variant: "destructive"
      });
      return { success: false, error: errorMessage };
    } finally {
      setSendingMessage(false);
    }
  }, [currentMatchId, toast, user]);

  const loadMoreMessages = useCallback(async (matchId: string, currentCount: number) => {
    if (!matchId) return;
    try {
      await fetchMessages(matchId, 25, currentCount);
    } catch (error) {
      console.error('Error loading more messages:', error);
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
      console.error('Error unmatching:', err);
      toast({ title: 'Error', description: 'Failed to unmatch.', variant: 'destructive' });
      return { success: false, error: 'Failed to unmatch' };
    }
  }, [toast]);

  useEffect(() => {
    let isMounted = true;
    
    const setupSubscriptions = async () => {
      if (!user || !isMounted) return;

      // Clean up existing subscriptions
      if (messageSubscription) {
        messageSubscription.unsubscribe();
      }
      if (matchSubscription) {
        matchSubscription.unsubscribe();
      }

      // Subscribe to new messages for current user
      const msgSub = subscribeToMessages(user.email, (newMessage: ChatMessage) => {
        if (isMounted) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg =>
    msg.sender === newMessage.sender &&
    msg.created_at === newMessage.created_at &&
    msg.content === newMessage.content
)) {
  return prev;
}
            return [...prev, newMessage];
          });

          // Update conversations
          const otherUserId = newMessage.sender === user.email ? newMessage.reciever : newMessage.sender;
          const sortedUserIds = [user.email, otherUserId].sort();
          const matchId = sortedUserIds.join('_');

          setConversations(prev =>
            prev.map(conv => {
              if (conv.match_id === matchId) {
                return {
                  ...conv,
                  lastMessage: {
                    content: newMessage.content,
                    created_at: newMessage.created_at,
                    sender: newMessage.sender
                  },
                  unreadCount: newMessage.sender === user.email ? conv.unreadCount : conv.unreadCount + 1
                };
              }
              return conv;
            }).sort((a, b) => {
              const aTime = a.lastMessage?.created_at || a.created_at;
              const bTime = b.lastMessage?.created_at || b.created_at;
              return new Date(bTime).getTime() - new Date(aTime).getTime();
            })
          );
        }
      });
      setMessageSubscription(msgSub);

      // Subscribe to match updates
      const matchSub = subscribeToMatches(user.email, () => {
        if (isMounted) {
          fetchConversations();
        }
      });
      setMatchSubscription(matchSub);
    };

    setupSubscriptions();

    return () => {
      isMounted = false;
      if (messageSubscription) {
        messageSubscription.unsubscribe();
      }
      if (matchSubscription) {
        matchSubscription.unsubscribe();
      }
    };
  }, [fetchConversations, user]);

  useEffect(() => {
    // Only try to fetch conversations if a valid user object exists
    if (user) {
      fetchConversations();
    } else {
      // If user logs out, clear the conversations
      setConversations([]);
      setLoading(false);
    }
  }, [user, fetchConversations]);

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
    loading,
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