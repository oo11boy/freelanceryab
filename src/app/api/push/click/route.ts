// app/api/push/click/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notification_id, user_id } = body;

    if (!notification_id) {
      return NextResponse.json({ error: 'داده نامعتبر' }, { status: 400 });
    }

    // 🔑 ثبت کلیک
    if (user_id) {
      await query(
        `UPDATE push_notification_logs
         SET status = 'clicked', clicked_at = NOW()
         WHERE notification_id = ? AND user_id = ? AND clicked_at IS NULL`,
        [Number(notification_id), Number(user_id)]
      );
    } else {
      // fallback: اولین log بدون کلیک رو علامت بزن
      await query(
        `UPDATE push_notification_logs
         SET status = 'clicked', clicked_at = NOW()
         WHERE notification_id = ? AND clicked_at IS NULL
         ORDER BY sent_at ASC
         LIMIT 1`,
        [Number(notification_id)]
      );
    }

    // 🔑 آپدیت آمار کلی
    await query(
      `UPDATE push_notifications
       SET clicked_count = (
         SELECT COUNT(*) FROM push_notification_logs
         WHERE notification_id = ? AND clicked_at IS NOT NULL
       )
       WHERE id = ?`,
      [Number(notification_id), Number(notification_id)]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Push click error:', error);
    return NextResponse.json({ error: 'خطا' }, { status: 500 });
  }
}