import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Create proper realtime subscription interface
export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  match_id: string;
  created_at: string;
  is_read: boolean;
  read_at?: string | null;
  message_type: 'text' | 'image' | 'gif';
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
}

export interface ChatConversation {
  id: string;
  match_id: string;
  user: ChatUser;
  lastMessage: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unreadCount: number;
  created_at: string;
  is_active: boolean;
}

// Simple realtime functions
function subscribeToMessages(matchId: string, onMessage: (message: ChatMessage) => void): RealtimeSubscription {
  const subscription = supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(subscription)
  };
}

function subscribeToMatches(userId: string, onMatch: () => void): RealtimeSubscription {
  const subscription = supabase
    .channel(`matches:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches'
      },
      (payload) => {
        const match = payload.new as any;
        if (match.user1_id === userId || match.user2_id === userId) {
          onMatch();
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(subscription)
  };
}

export function useChat() {
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
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setConversations([]);
        return;
      }

      // Get matches for current user
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at,
          is_active
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        setError('Failed to load conversations');
        return;
      }

      if (!matches || matches.length === 0) {
        setConversations([]);
        return;
      }

      // Get conversation data for each match
      const conversationPromises = matches.map(async (match) => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

        // Fetch other user's profile and photos in parallel
        const [profileResult, photosResult, lastMessageResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('user_id, first_name, last_name, last_active_at')
            .eq('user_id', otherUserId)
            .single(),
          supabase
            .from('user_photos')
            .select('photo_url, photo_order, is_primary')
            .eq('user_id', otherUserId)
            .order('photo_order')
            .limit(3),
          supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        return {
          id: match.id,
          match_id: match.id,
          user: {
            id: otherUserId,
            first_name: profileResult.data?.first_name || 'Unknown',
            last_name: profileResult.data?.last_name || 'User',
            photos: photosResult.data || [],
            last_active_at: profileResult.data?.last_active_at
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
  }, [toast]);

  const fetchMessages = useCallback(async (matchId: string, limit: number = 50, offset: number = 0) => {
    try {
      setError(null);

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
        return;
      }

      // Transform the data to match our ChatMessage interface
      const transformedMessages: ChatMessage[] = (messagesData || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        match_id: msg.match_id,
        created_at: msg.created_at || '',
        is_read: msg.is_read || false,
        read_at: msg.read_at,
        message_type: (msg.message_type as 'text' | 'image' | 'gif') || 'text',
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await markMessagesAsRead(matchId, user.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  }, []);

  const markMessagesAsRead = async (matchId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('match_id', matchId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
      } else {
        // Update local conversations state to reflect read status
        setConversations(prev => 
          prev.map(conv => 
            conv.match_id === matchId 
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = useCallback(async (matchId: string, content: string) => {
    if (!content.trim()) {
      return { success: false, error: 'Message cannot be empty' };
    }

    try {
      setSendingMessage(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'text',
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
        id: data.id,
        content: data.content,
        sender_id: data.sender_id,
        match_id: data.match_id,
        created_at: data.created_at || '',
        is_read: data.is_read || false,
        read_at: data.read_at,
        message_type: (data.message_type as 'text' | 'image' | 'gif') || 'text',
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
                sender_id: newMessage.sender_id
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
  }, [currentMatchId, toast]);

  const loadMoreMessages = useCallback(async (matchId: string, currentCount: number) => {
    if (!matchId) return;
    
    try {
      await fetchMessages(matchId, 25, currentCount);
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  }, [fetchMessages]);

  // Set up real-time subscriptions
  useEffect(() => {
    let isMounted = true;

    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      // Clean up existing subscriptions
      if (messageSubscription) {
        messageSubscription.unsubscribe();
      }
      if (matchSubscription) {
        matchSubscription.unsubscribe();
      }

      // Subscribe to new messages for current conversation
      if (currentMatchId) {
        const msgSub = subscribeToMessages(currentMatchId, (newMessage: ChatMessage) => {
          if (isMounted) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.find(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });

            // Update conversations
            setConversations(prev => 
              prev.map(conv => {
                if (conv.match_id === currentMatchId) {
                  return {
                    ...conv,
                    lastMessage: {
                      content: newMessage.content,
                      created_at: newMessage.created_at,
                      sender_id: newMessage.sender_id
                    },
                    unreadCount: newMessage.sender_id === user.id ? conv.unreadCount : conv.unreadCount + 1
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
      }

      // Subscribe to match updates
      const matchSub = subscribeToMatches(user.id, () => {
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
  }, [currentMatchId, fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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

  const clearCurrentChat = () => {
    setCurrentMatchId(null);
    setMessages([]);
    if (messageSubscription) {
      messageSubscription.unsubscribe();
      setMessageSubscription(null);
    }
  };

  const getUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  return {
    conversations,
    messages,
    loading,
    sendingMessage,
    error,
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