// src/hooks/useChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const MAX_MESSAGE_LENGTH = 1000; // BUG-159
const RATE_LIMIT_MAX = 5;        // BUG-158
const RATE_LIMIT_WINDOW_MS = 5000;

export interface ChatMessage {
  content: string;
  sender: string;
  reciever: string;
  created_at: string;
  is_read: boolean;
  type: string;
  attachment_url?: string | null;
  _clientId?: string; // local-only field for reliable dedup (BUG-025)
}

export interface ChatUser {
  email?: string;
  first_name: string;
  last_name: string;
  photos: Array<{ photo_url: string; photo_order: number; is_primary: boolean; }>;
  incognito_mode?: boolean;
}

export interface ChatConversation {
  match_id: string; // this is the other user's email
  user: ChatUser;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export function useChat(currentUser: any) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);

  const currentMatchIdRef = useRef<string | null>(null);
  useEffect(() => { currentMatchIdRef.current = currentMatchId; }, [currentMatchId]);

  // BUG-158: track send timestamps for rate limiting
  const recentSendTimestamps = useRef<number[]>([]);

  const { toast } = useToast();

  // 1. Fetch Conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_my_conversations', { p_email: currentUser.email });
      if (error) throw error;

      const formatted = (data as any[] || []).map(item => ({
        match_id: item.match_id,  // match_id IS the other user's email (from DB)
        user: { ...item.user, photos: item.user?.photos || [] },
        lastMessage: item.lastMessage,
        unreadCount: item.unreadCount || 0
      }));
      setConversations(formatted);
    } catch {
      // silent — conversations will just be empty
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  // 2. Fetch Messages + mark as read in DB (BUG-027)
  const fetchMessages = useCallback(async (matchId: string) => {
    if (!currentUser?.email) return;
    // BUG-026: matchId from conversations is already the other user's email
    const targetEmail = matchId;
    setCurrentMatchId(targetEmail);
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_chat_messages', {
        p_user_email: currentUser.email,
        p_target_email: targetEmail
      });
      if (error) throw error;
      setMessages(data as ChatMessage[] || []);

      // BUG-027: persist read status to DB so other devices see it too
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('reciever', currentUser.email)
        .eq('sender', targetEmail)
        .eq('is_read', false)
        .then(() => {
          setConversations(prev =>
            prev.map(c => c.match_id === matchId ? { ...c, unreadCount: 0 } : c)
          );
        });
    } catch {
      toast({ title: "Couldn't load messages", description: "Please try again.", variant: "destructive" });
    } finally {
      setMessagesLoading(false);
    }
  }, [currentUser?.email, toast]);

  // 3. Send Message
  const sendMessage = useCallback(async (content: string, type: string = 'text', attachmentUrl?: string) => {
    if (!currentUser?.email || !currentMatchId || !content.trim()) return;

    // BUG-159: max message length
    if (content.length > MAX_MESSAGE_LENGTH) {
      toast({
        title: "Message too long",
        description: `Keep messages under ${MAX_MESSAGE_LENGTH} characters.`,
        variant: "destructive"
      });
      return;
    }

    // BUG-158: client-side rate limiting
    const now = Date.now();
    recentSendTimestamps.current = recentSendTimestamps.current.filter(
      t => t > now - RATE_LIMIT_WINDOW_MS
    );
    if (recentSendTimestamps.current.length >= RATE_LIMIT_MAX) {
      toast({
        title: "Slow down",
        description: "You're sending messages too fast.",
        variant: "destructive"
      });
      return;
    }
    recentSendTimestamps.current.push(now);

    // BUG-025: unique clientId so dedup is reliable even with identical content/timestamp
    const clientId = `${now}-${Math.random().toString(36).slice(2, 9)}`;
    const tempMessage: ChatMessage = {
      content,
      sender: currentUser.email,
      reciever: currentMatchId,
      created_at: new Date().toISOString(),
      is_read: false,
      type,
      attachment_url: attachmentUrl,
      _clientId: clientId
    };

    setMessages(prev => [...prev, tempMessage]);
    setSendingMessage(true);

    try {
      const { error } = await supabase.rpc('send_chat_message', {
        p_sender: currentUser.email,
        p_reciever: currentMatchId,
        p_content: content,
        p_type: type,
        p_attachment_url: attachmentUrl
      });
      if (error) throw error;
      // Confirm temp message (strip _clientId)
      setMessages(prev =>
        prev.map(m => m._clientId === clientId ? { ...m, _clientId: undefined } : m)
      );
      fetchConversations();
    } catch {
      // BUG-071: show error instead of silently swallowing it
      toast({ title: "Failed to send", description: "Message could not be sent. Please try again.", variant: "destructive" });
      setMessages(prev => prev.filter(m => m._clientId !== clientId));
    } finally {
      setSendingMessage(false);
    }
  }, [currentUser?.email, currentMatchId, fetchConversations, toast]);

  // 4. Unmatch
  const unmatch = useCallback(async (targetUserId: string) => {
    if (!currentUser?.email) return;
    try {
      await supabase.rpc('process_interaction', {
        p_actor_email: currentUser.email,
        p_target_user_id: targetUserId,
        p_action: 'pass'
      });

      const { error } = await supabase
        .from('matches')
        .update({ is_active: false })
        .or(`and(user1_id.eq.${currentUser.email},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUser.email})`);

      if (error) throw error;
      setConversations(prev => prev.filter(c => c.match_id !== targetUserId));
      toast({ title: "Unmatched", description: "User has been removed." });
    } catch {
      toast({ title: "Error", description: "Failed to unmatch", variant: "destructive" });
    }
  }, [currentUser?.email, toast]);

  const clearCurrentChat = useCallback(() => {
    setCurrentMatchId(null);
    setMessages([]);
  }, []);

  // 5. Realtime subscription
  useEffect(() => {
    if (!currentUser?.email) return;

    fetchConversations();

    // BUG-106: user-specific channel name prevents cross-user collisions
    const safeEmail = currentUser.email.replace(/[@.]/g, '_');
    const channelName = `chat_${safeEmail}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // BUG-124: only INSERT — no wasted bandwidth on UPDATE/DELETE
          schema: 'public',
          table: 'messages',
          filter: `reciever=eq.${currentUser.email}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;

          if (currentMatchIdRef.current === newMsg.sender) {
            setMessages(prev => {
              // BUG-025: dedup using sender + created_at + content (no _clientId on real messages)
              const isDuplicate = prev.some(m =>
                !m._clientId &&
                m.sender === newMsg.sender &&
                m.created_at === newMsg.created_at &&
                m.content === newMsg.content
              );
              if (isDuplicate) return prev;
              return [...prev, newMsg];
            });

            // BUG-027: mark as read immediately since the chat is open
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('reciever', currentUser.email)
              .eq('sender', newMsg.sender)
              .eq('is_read', false)
              .then(() => {});
          }

          fetchConversations();
        }
      )
      .subscribe();

    // BUG-106: cleanup removes the channel so no duplicate listeners accumulate
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.email, fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    messagesLoading,
    sendingMessage,
    fetchConversations,
    fetchMessages,
    sendMessage,
    unmatch,
    clearCurrentChat
  };
}
