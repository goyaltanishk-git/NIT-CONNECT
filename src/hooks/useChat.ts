// src/hooks/useChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { encryptedStorage } from "@/utils/encryptedStorage";

export interface ChatMessage {
  // Schema has NO 'id', so we remove it to prevent TypeScript errors
  content: string;
  sender: string;
  reciever: string; // Matches your DB spelling
  created_at: string;
  is_read: boolean;
  type: string;
  attachment_url?: string | null;
}

export interface ChatUser {
  email?: string;
  first_name: string;
  last_name: string;
  photos: Array<{ photo_url: string; photo_order: number; is_primary: boolean; }>;
  incognito_mode?: boolean;
}

export interface ChatConversation {
  match_id: string;
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

  // Ref to track active chat without stale closures
  const currentMatchIdRef = useRef<string | null>(null);
  useEffect(() => { currentMatchIdRef.current = currentMatchId; }, [currentMatchId]);

  const { toast } = useToast();

  // 1. Fetch Conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_my_conversations', { p_email: currentUser.email });
      if (error) throw error;
      
      const formatted = (data as any[] || []).map(item => ({
        match_id: item.match_id,
        user: { ...item.user, photos: item.user.photos || [] },
        lastMessage: item.lastMessage,
        unreadCount: item.unreadCount || 0
      }));
      setConversations(formatted);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [currentUser?.email]);

  // 2. Fetch Messages
  const fetchMessages = useCallback(async (matchId: string) => {
    if (!currentUser?.email) return;
    setCurrentMatchId(matchId);
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_chat_messages', {
        p_user_email: currentUser.email,
        p_target_email: matchId
      });
      if (error) throw error;
      setMessages(data as ChatMessage[] || []);
      setConversations(prev => prev.map(c => c.match_id === matchId ? { ...c, unreadCount: 0 } : c));
    } catch (err) { console.error(err); } 
    finally { setMessagesLoading(false); }
  }, [currentUser?.email]);

  // 3. Send Message
  const sendMessage = useCallback(async (content: string, type: string = 'text', attachmentUrl?: string) => {
    if (!currentUser?.email || !currentMatchId || !content.trim()) return;

    const tempMessage: ChatMessage = {
      content,
      sender: currentUser.email,
      reciever: currentMatchId,
      created_at: new Date().toISOString(),
      is_read: false,
      type,
      attachment_url: attachmentUrl
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
      fetchConversations();
    } catch (err) {
      console.error(err);
      // Remove failed message by checking created_at
      setMessages(prev => prev.filter(m => m.created_at !== tempMessage.created_at));
    } finally {
      setSendingMessage(false);
    }
  }, [currentUser?.email, currentMatchId, fetchConversations]);

  const unmatch = useCallback(async (targetUserId: string) => {
    if (!currentUser?.email) return;
    try {
      await supabase.rpc('process_interaction', { p_actor_email: currentUser.email, p_target_user_id: targetUserId, p_action: 'pass' });
      await supabase.from('matches').delete().or(`and(user1_id.eq.${currentUser.email},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUser.email})`);
      setConversations(prev => prev.filter(c => c.match_id !== targetUserId));
    } catch (err) { console.error(err); }
  }, [currentUser?.email]);

  const clearCurrentChat = useCallback(() => {
    setCurrentMatchId(null);
    setMessages([]);
  }, []);

  // ✅ REALTIME SUBSCRIPTION (Schema-Aware)
  useEffect(() => {
    if (!currentUser?.email) return;

    fetchConversations();

    const channel = supabase
      .channel('global_chat_v2')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `reciever=eq.${currentUser.email}` 
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          console.log("🚀 Realtime msg:", newMsg);

          // Check if this message belongs to the currently active chat
          if (currentMatchIdRef.current === newMsg.sender) {
             setMessages(prev => {
                // ✅ FIX: Deduplicate using created_at + content (since no ID)
                const exists = prev.some(m => 
                  m.created_at === newMsg.created_at && m.content === newMsg.content
                );
                if (exists) return prev;
                return [...prev, newMsg];
             });
          }
          
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [currentUser?.email, fetchConversations]);

  return { conversations, messages, loading, messagesLoading, sendingMessage, fetchConversations, fetchMessages, sendMessage, unmatch, clearCurrentChat };
}