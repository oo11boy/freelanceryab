// lib/support.ts
import { query } from '@/lib/db';

// 🔑 id کاربر پشتیبانی رو از DB بگیر
export async function getSupportUserId(): Promise<number | null> {
  try {
    const rows = (await query(
      `SELECT id FROM users WHERE phone = '00000000000' AND role = 'admin' LIMIT 1`
    )) as any[];
    return rows[0]?.id || null;
  } catch (err) {
    console.error('getSupportUserId error:', err);
    return null;
  }
}

// 🔑 ارسال پیام از پشتیبانی به کاربر
export async function sendSupportMessage(
  userId: number,
  message: string,
  postId: number | null = null,
  title: string = 'پیام از پشتیبانی'
): Promise<boolean> {
  try {
    const supportId = await getSupportUserId();
    if (!supportId) {
      console.warn('Support user not found');
      return false;
    }

    // ۱. پیام توی جدول messages
    await query(
      `INSERT INTO messages (sender_id, receiver_id, post_id, message, is_read)
       VALUES (?, ?, ?, ?, FALSE)`,
      [supportId, userId, postId || null, message.trim()]
    );

    // ۲. اعلان (notification)
    let link = `/messages?user=${supportId}`;
    if (postId) link += `&post=${postId}`;

    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'system', ?, ?, ?)`,
      [userId, title, message.trim().substring(0, 100), link]
    );

    return true;
  } catch (err: any) {
    console.error('sendSupportMessage error:', err.message);
    return false;
  }
}

// 🔑 ارسال از طریق Socket.io (اختیاری — برای لحظه‌ای)
export async function emitSupportMessage(
  userId: number,
  message: string,
  postId: number | null = null
): Promise<void> {
  try {
    const supportId = await getSupportUserId();
    if (!supportId) return;

    const socketUrl = process.env.SOCKET_INTERNAL_URL || 'http://localhost:3001';

    await fetch(`${socketUrl}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'new_message',
        data: {
          id: Date.now(),
          text: message,
          message: message,
          sender_id: supportId,
          receiver_id: userId,
          post_id: postId || null,
          is_read: false,
          created_at: new Date().toISOString(),
          targetUsers: [userId],
        },
        secret: process.env.SOCKET_SECRET,
      }),
    });
  } catch (err) {
    console.error('emitSupportMessage error:', err);
  }
}