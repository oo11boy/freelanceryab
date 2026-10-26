// app/hooks/useUnreadMessages.ts
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { initializeSocket } from '@/app/services/socket';

export function useUnreadMessages() {
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    if (!token) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const total = (data.conversations || []).reduce(
        (s: number, c: any) => s + (c.unread_count || 0),
        0
      );
      setUnreadCount(total);
    } catch (err) {
      console.error('fetchUnreadCount error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // هر ۳۰ ثانیه رفرش
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Socket.io برای آپدیت لحظه‌ای
  useEffect(() => {
    if (!token) return;

    const socket = initializeSocket(token);
    if (!socket) return;

    const handleNewMessage = () => {
      setUnreadCount((prev) => prev + 1);
    };

    // 🔑 وقتی کاربر پیام‌ها رو خوند، badge صفر بشه
    const handleConversationRead = () => {
      fetchUnreadCount();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_read', handleConversationRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_read', handleConversationRead);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { unreadCount, loading, refresh: fetchUnreadCount };
}