import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { encryptedStorage } from "@/utils/encryptedStorage";

// -- Interfaces --

export interface ChatMessage {
  id?: string;
  content: string;
  sender: string;
  reciever: string; // Matches DB column name
  created_at: string;
  is_read: boolean;
  read_at?: string | null;
  type: string;
  attachment_url?: string | null;
}

export interface ChatUser {
  email?: string;
  first_name: string;
  last_name: string;
  photos: Array<{
    photo_url: string;
    photo_order: number;
    is_primary: boolean;
  }>;
  // Optional profile fields
  bio?: string | null;
  year_of_study?: string | null;
  branch?: string | null;
  hometown?: string | null;
  incognito_mode?: boolean;
}

export interface ChatConversation {
  match_id: string; // The other user's email (Unique ID for React Keys)
  user: ChatUser;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export function useChat(currentUser: any) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // --------------------------------------------------------------------------
  // 1. Fetch Conversations (Matches + Profiles + Last Msg)
  // --------------------------------------------------------------------------
  const fetchConversations = useCallback(async () => {
    if (!currentUser?.email) return;
    
    try {
      setLoading(true);

      // ✅ RPC Call: atomic fetch prevents race conditions
      const { data, error } = await supabase.rpc('get_my_conversations', {
        p_email: currentUser.email
      });

      if (error) throw error;

      // Map the RPC result to our TypeScript interfaces
      const formattedConversations: ChatConversation[] = (data as any[] || []).map(item => ({
        match_id: item.match_id, // We use this as the KEY in ChatScreen
        user: {
          ...item.user,
          // Ensure photos is always an array
          photos: item.user.photos || []
        },
        lastMessage: item.lastMessage,
        unreadCount: item.unreadCount || 0
      }));

      setConversations(formattedConversations);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.email]);

  // --------------------------------------------------------------------------
  // 2. Fetch Messages for a specific chat
  // --------------------------------------------------------------------------
  const fetchMessages = useCallback(async (matchId: string) => {
    if (!currentUser?.email) return;
    setCurrentMatchId(matchId);
    
    try {
      // ✅ RPC Call: Get history securely
      const { data, error } = await supabase.rpc('get_chat_messages', {
        p_user_email: currentUser.email,
        p_target_email: matchId
      });

      if (error) throw error;
      
      setMessages(data as ChatMessage[] || []);
      
      // Local update: clear unread count for this chat immediately
      setConversations(prev => prev.map(c => 
        c.match_id === matchId ? { ...c, unreadCount: 0 } : c
      ));

    } catch (err: any) {
      console.error('Error fetching messages:', err);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  }, [currentUser?.email, toast]);

  // --------------------------------------------------------------------------
  // 3. Send Message
  // --------------------------------------------------------------------------
 const sendMessage = useCallback(async (content: string, type: string = 'text', attachmentUrl?: string) => {
    console.log("🚀 sendMessage called!");
    console.log("   -> Payload Content (What you typed):", content);
    console.log("   -> Current Receiver ID (Who it goes to):", currentMatchId);
    
    if (!currentUser?.email) {
        console.error("❌ Error: No Current User Email");
        return;
    }
    if (!currentMatchId) {
        console.error("❌ Error: No Active Match ID (Receiver)");
        return;
    }
    if (!content || !content.trim()) {
        console.error("❌ Error: Content is empty");
        return;
    }

    // Optimistic Update
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
        p_content: content,  // Ensure this is mapped correctly
        p_type: type,
        p_attachment_url: attachmentUrl
      });

      if (error) throw error;
      console.log("✅ Message sent successfully to DB");
      fetchConversations();
    } catch (err: any) {
      console.error('❌ Error sending message RPC:', err);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      setMessages(prev => prev.filter(m => m !== tempMessage));
    } finally {
      setSendingMessage(false);
    }
  }, [currentUser?.email, currentMatchId, fetchConversations, toast]);
  // --------------------------------------------------------------------------
  // 4. Unmatch / Block
  // --------------------------------------------------------------------------
  const unmatch = useCallback(async (targetUserId: string) => {
    if (!currentUser?.email) return;
    try {
      // 1. Log the 'pass' or 'block' interaction
      await supabase.rpc('process_interaction', {
          p_actor_email: currentUser.email,
          p_target_user_id: targetUserId,
          p_action: 'pass' // Using pass to hide them
      });
      
      // 2. Delete the match record
      const { error } = await supabase
        .from('matches')
        .delete()
        .or(`and(user1_id.eq.${currentUser.email},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUser.email})`);

      if (error) throw error;

      // 3. Update UI
      setConversations(prev => prev.filter(c => c.match_id !== targetUserId));
      toast({ title: "Unmatched", description: "User has been removed." });
    } catch (err) {
      console.error("Unmatch error", err);
      toast({ title: "Error", description: "Failed to unmatch", variant: "destructive" });
    }
  }, [currentUser?.email, toast]);

  const clearCurrentChat = useCallback(() => {
    setCurrentMatchId(null);
    setMessages([]);
  }, []);

  // --------------------------------------------------------------------------
  // 5. Initial Load & Realtime Subscriptions
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Load conversations on mount
    fetchConversations();

    // Subscribe to incoming messages
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `reciever=eq.${currentUser?.email}`
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          // If we are currently inside this chat, show the message
          if (currentMatchId === newMsg.sender) {
             setMessages(prev => [...prev, newMsg]);
          }
          // Always refresh the list (to update unread badges/last message)
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [currentUser?.email, fetchConversations, currentMatchId]);

  return {
    conversations,
    messages,
    loading,
    sendingMessage,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    unmatch,
    clearCurrentChat
  };
}