// lib/push.ts
import webpush from 'web-push';
import { query } from '@/lib/db';

// تنظیم VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@freelanceryaab.ir',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  message: string;
  link?: string;
  icon?: string;
  tag?: string;
}

export interface PushResult {
  userId: number;
  success: boolean;
  error?: string;
}

// 🔑 ارسال به یک کاربر (همه دستگاه‌هاش)
export async function sendPushToUser(
  userId: number,
  payload: PushPayload
): Promise<PushResult> {
  try {
    const subs = (await query(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
      [userId]
    )) as any[];

    if (subs.length === 0) {
      return { userId, success: false, error: 'No subscriptions' };
    }

    const notificationPayload = JSON.stringify(payload);
    let success = false;
    let lastError = '';

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notificationPayload
        );
        success = true;
      } catch (err: any) {
        lastError = err.message || 'Unknown error';
        // اگه subscription منقضی شده، حذف کن
        if (err.statusCode === 410 || err.statusCode === 404) {
          await query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
        }
      }
    }

    return { userId, success, error: success ? undefined : lastError };
  } catch (err: any) {
    return { userId, success: false, error: err.message };
  }
}

// 🔑 ارسال به چند کاربر
export async function sendPushToUsers(
  userIds: number[],
  payload: PushPayload
): Promise<PushResult[]> {
  const results: PushResult[] = [];
  for (const uid of userIds) {
    const res = await sendPushToUser(uid, payload);
    results.push(res);
  }
  return results;
}