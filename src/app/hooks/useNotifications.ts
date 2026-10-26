// app/hooks/useNotifications.ts
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { getSocket, initializeSocket } from '@/app/services/socket';

export function useNotifications() {
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔑 تابع دریافت تعداد unread
  const fetchUnreadCount = async () => {
    if (!token) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/notifications?limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('fetchUnreadCount error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔑 اولین بار + هر بار که توکن عوض شد
  useEffect(() => {
    fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 🔑 هر ۳۰ ثانیه رفرش (به‌عنوان fallback)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 🔑 گوش دادن به Socket.io
  useEffect(() => {
    if (!token) return;

    const socket = initializeSocket(token);
    if (!socket) return;

    const handleNewNotification = (data: any) => {
      console.log('🔔 New notification received:', data);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [token]);

  return { unreadCount, loading, refresh: fetchUnreadCount };
}