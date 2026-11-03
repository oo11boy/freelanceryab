// app/api/admin/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

function getUserIdFromToken(request: NextRequest): number | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.id;
  } catch {
    return null;
  }
}

async function checkAdmin(userId: number): Promise<boolean> {
  const users = (await query('SELECT role FROM users WHERE id = ?', [userId])) as any[];
  return users[0]?.role === 'admin';
}

async function logAdminAction(
  adminId: number,
  action: string,
  targetType: string,
  targetId: number,
  details?: any
) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, action, targetType, targetId, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('Admin log error:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }
    if (!(await checkAdmin(adminId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, link, icon, audience, specific_user_ids } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'عنوان و متن الزامی است' },
        { status: 400 }
      );
    }

    const validAudiences = ['all', 'active', 'specific'];
    if (!validAudiences.includes(audience)) {
      return NextResponse.json({ error: 'نوع مخاطب نامعتبر' }, { status: 400 });
    }

    if (
      audience === 'specific' &&
      (!Array.isArray(specific_user_ids) || specific_user_ids.length === 0)
    ) {
      return NextResponse.json(
        { error: 'حداقل یک کاربر را انتخاب کنید' },
        { status: 400 }
      );
    }

    // 🔑 لیست گیرندگان
    let targetUsers: number[] = [];

    if (audience === 'all') {
      const rows = (await query(
        `SELECT DISTINCT ps.user_id
         FROM push_subscriptions ps
         JOIN users u ON u.id = ps.user_id
         WHERE u.is_active = 1`
      )) as any[];
      targetUsers = rows.map((r) => r.user_id);
    } else if (audience === 'active') {
      const rows = (await query(
        `SELECT DISTINCT ps.user_id
         FROM push_subscriptions ps
         JOIN users u ON u.id = ps.user_id
         WHERE u.is_active = 1 AND u.online_status = 1`
      )) as any[];
      targetUsers = rows.map((r) => r.user_id);
    } else {
      const ids = specific_user_ids
        .map((n: any) => Number(n))
        .filter((n: number) => !isNaN(n));
      const placeholders = ids.map(() => '?').join(',');
      const rows = (await query(
        `SELECT DISTINCT ps.user_id
         FROM push_subscriptions ps
         JOIN users u ON u.id = ps.user_id
         WHERE u.is_active = 1 AND ps.user_id IN (${placeholders})`,
        ids
      )) as any[];
      targetUsers = rows.map((r) => r.user_id);
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: 'هیچ کاربری با اشتراک پوش فعال یافت نشد' },
        { status: 404 }
      );
    }

    // 🔑 ذخیره ارسال
    const result = await query(
      `INSERT INTO push_notifications
        (admin_id, title, message, link, icon, audience, specific_user_ids, sent_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        title.trim(),
        message.trim(),
        link?.trim() || null,
        icon?.trim() || '/icons/icon-192.png',
        audience,
        audience === 'specific' ? JSON.stringify(targetUsers) : null,
        targetUsers.length,
      ]
    );

    const notificationId = (result as any).insertId;
    console.log('🔍 [push/send] Notification ID:', notificationId);

    if (!notificationId) {
      return NextResponse.json(
        { error: 'خطا در ذخیره ارسال' },
        { status: 500 }
      );
    }

    // 🔑 ارسال به هر کاربر (با notificationId و userId)
    const { sendPushToUser } = await import('@/lib/push');
    let delivered = 0;
    let failed = 0;

    for (const userId of targetUsers) {
      const res = await sendPushToUser(userId, {
        title: title.trim(),
        message: message.trim(),
        link: link?.trim() || '/',
        icon: icon?.trim() || '/icons/icon-192.png',
        tag: `push-${notificationId}`,
        notificationId,
      });

      console.log(
        `🔍 [push/send] User ${userId}:`,
        res.success ? '✅' : `❌ ${res.error}`
      );

      const status = res.success ? 'sent' : 'failed';
      if (res.success) delivered++;
      else failed++;

      await query(
        `INSERT INTO push_notification_logs (notification_id, user_id, status, error)
         VALUES (?, ?, ?, ?)`,
        [notificationId, userId, status, res.error || null]
      );
    }

    // 🔑 آپدیت آمار
    await query(
      `UPDATE push_notifications
       SET delivered_count = ?, failed_count = ?
       WHERE id = ?`,
      [delivered, failed, notificationId]
    );

    await logAdminAction(
      adminId,
      'send_push_notification',
      'push_notification',
      notificationId,
      {
        title: title.trim(),
        audience,
        total: targetUsers.length,
        delivered,
        failed,
      }
    );

    return NextResponse.json({
      success: true,
      id: notificationId,
      total: targetUsers.length,
      delivered,
      failed,
      message: `پوش برای ${delivered} کاربر ارسال شد (${failed} ناموفق)`,
    });
  } catch (error: any) {
    console.error('Push send error:', error);
    return NextResponse.json({ error: 'خطا در ارسال پوش' }, { status: 500 });
  }
}