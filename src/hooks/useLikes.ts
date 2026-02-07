// src/hooks/useLikes.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client'; 
import { useToast } from '@/hooks/use-toast';
import { encryptedStorage } from "@/utils/encryptedStorage";

export interface PendingLike {
  user_id: string;
  target_user_id: string;
  interaction_type: 'like' | 'pass'; // Removed superlike
  created_at: string;
  profile: any; // Keeping it simple as requested
}

export function useLikes() {
  const [pendingLikes, setPendingLikes] = useState<PendingLike[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getCurrentUserEmail = () => {
    const userd = encryptedStorage.get("current-user");
    if (!userd) return null;
    return JSON.parse(userd).email;
  };

  // 1. Fetch Likes
  const fetchPendingLikes = useCallback(async () => {
    try {
      setLoading(true);
      const email = getCurrentUserEmail();
      if (!email) return;

      const { data, error } = await supabase.rpc('get_my_pending_likes', { 
        p_email: email 
      });

      if (error) throw error;
      setPendingLikes(data as PendingLike[] || []);
        
    } catch (error) {
     
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingLikes();
  }, [fetchPendingLikes]);

  // 2. Handle Like Back
  const handleLikeBack = useCallback(async (targetUserId: string) => {
    const email = getCurrentUserEmail();
    if (!email) return;

    // Optimistic remove
    setPendingLikes(prev => prev.filter(like => like.user_id !== targetUserId));

    // Just push 'like'
    await supabase.rpc('process_interaction', {
      p_actor_email: email,
      p_target_user_id: targetUserId,
      p_action: 'like'
    });

    toast({ title: "It's a Match! 🎉" });
  }, [toast]);

  // 3. Handle Pass
  const handlePass = useCallback(async (targetUserId: string) => {
    const email = getCurrentUserEmail();
    if (!email) return;

    // Optimistic remove
    setPendingLikes(prev => prev.filter(like => like.user_id !== targetUserId));

    // Just push 'pass'
    await supabase.rpc('process_interaction', {
      p_actor_email: email,
      p_target_user_id: targetUserId,
      p_action: 'pass'
    });
  }, []);

  return {
    pendingLikes,
    loading,
    handleLikeBack,
    handlePass,
    refresh: fetchPendingLikes
  };
}