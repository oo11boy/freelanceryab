// app/hooks/usePushSubscription.ts
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const { token } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('⚠️ Push not supported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // 🔑 ثبت subscription
  const subscribe = async () => {
    if (!token || loading) return false;
    setLoading(true);

    try {
      // ۱. ثبت service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      // ۲. چک مجوز
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }
      setPermission(perm);

      if (perm !== 'granted') {
        console.log('❌ Permission denied');
        return false;
      }

      // ۳. ثبت subscription
      const existingSub = await registration.pushManager.getSubscription();

      let subscription = existingSub;
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        });
      }

      // ۴. ارسال به سرور
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) throw new Error('Failed to save subscription');

      setIsSubscribed(true);
      console.log('✅ Push subscription registered');
      return true;
    } catch (err: any) {
      console.error('❌ Push subscription failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 🔑 لغو
  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      await fetch(
        `/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await subscription.unsubscribe();
      setIsSubscribed(false);
      console.log('🔕 Push unsubscribed');
    } catch (err) {
      console.error('Unsubscribe error:', err);
    }
  };

  return {
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
  };
}