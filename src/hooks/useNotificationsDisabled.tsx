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
    console.log('Notifications disabled - markAsRead:', notificationId);
  };

  const markAllAsRead = async () => {
    console.log('Notifications disabled - markAllAsRead');
  };

  const createNotification = async (
    targetUserId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data: Record<string, unknown> = {}
  ) => {
    console.log('Notifications disabled - createNotification:', { targetUserId, type, title, message, data });
  };

  const requestNotificationPermission = async () => {
    return false;
  };

  const refresh = async () => {
    console.log('Notifications disabled - refresh');
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