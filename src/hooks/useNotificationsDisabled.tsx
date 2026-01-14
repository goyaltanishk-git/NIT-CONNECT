import { useState } from 'react';

interface Notification {
  id: string;
  type: 'match' | 'message' | 'like' | 'superlike' | 'story_view' | 'video_call';
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(userId: string) {
  const [notifications] = useState<Notification[]>([]);
  const [unreadCount] = useState(0);
  const [loading] = useState(false);

  const markAsRead = async (notificationId: string) => {
  };

  const markAllAsRead = async () => {
  };

  const createNotification = async (
    targetUserId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data: Record<string, unknown> = {}
  ) => {
  };

  const requestNotificationPermission = async () => {
    return false;
  };

  const refresh = async () => {
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    requestNotificationPermission,
    refresh,
  };
}