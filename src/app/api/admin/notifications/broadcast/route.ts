// app/api/admin/notifications/broadcast/route.ts
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
  const users = await query('SELECT role FROM users WHERE id = ?', [userId]);
  const user = (users as any[])[0];
  return user?.role === 'admin';
}

async function logAdminAction(adminId: number, action: string, targetType: string, targetId: number, details?: any) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, action, targetType, targetId, details ? JSON.stringify(details) : null]
    );
  } catch (err) { console.error('Admin log error:', err); }
}

// ارسال اعلان به Socket.io
async function emitToSocket(payload: {
  event: string;
  data: any;
  targetUsers?: number[];
}) {
  try {
    const socketUrl = process.env.SOCKET_INTERNAL_URL || 'http://localhost:3001';
    await fetch(`${socketUrl}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: payload.event,
        data: payload.data,
        secret: process.env.SOCKET_SECRET,
      }),
    });
  } catch (err) {
    console.error('Socket emit error:', err);
  }
}

// POST /api/admin/notifications/broadcast
export async function POST(request: NextRequest) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const body = await request.json();
    const { title, message, type, link, recipients, specific_user_ids } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'عنوان و متن پیام الزامی است' }, { status: 400 });
    }

    const validTypes = ['info', 'warning', 'success', 'system'];
    const validRecipients = ['all', 'active', 'specific'];

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'نوع اعلان نامعتبر' }, { status: 400 });
    }
    if (!validRecipients.includes(recipients)) {
      return NextResponse.json({ error: 'نوع گیرندگان نامعتبر' }, { status: 400 });
    }

    if (recipients === 'specific' && (!Array.isArray(specific_user_ids) || specific_user_ids.length === 0)) {
      return NextResponse.json({ error: 'حداقل یک کاربر را انتخاب کنید' }, { status: 400 });
    }

    // لیست گیرندگان
    let targetUsers: number[] = [];
    if (recipients === 'all') {
      const rows = await query(`SELECT id FROM users WHERE is_active = 1`);
      targetUsers = (rows as any[]).map((r) => r.id);
    } else if (recipients === 'active') {
      const rows = await query(`SELECT id FROM users WHERE is_active = 1 AND online_status = 1`);
      targetUsers = (rows as any[]).map((r) => r.id);
    } else {
      // specific — چک کن کاربران وجود دارن
      const ids = specific_user_ids.map((n: any) => Number(n)).filter((n: number) => !isNaN(n));
      if (ids.length === 0) {
        return NextResponse.json({ error: 'شناسه کاربران نامعتبر' }, { status: 400 });
      }
      const placeholders = ids.map(() => '?').join(',');
      const rows = await query(
        `SELECT id FROM users WHERE id IN (${placeholders}) AND is_active = 1`,
        ids
      );
      targetUsers = (rows as any[]).map((r) => r.id);
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'کاربر هدف یافت نشد' }, { status: 404 });
    }

    // ذخیره در broadcast_notifications
    const result = await query(
      `INSERT INTO broadcast_notifications
        (admin_id, title, message, type, link, recipients, recipient_count, specific_user_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        title.trim(),
        message.trim(),
        type,
        link?.trim() || null,
        recipients,
        targetUsers.length,
        recipients === 'specific' ? JSON.stringify(targetUsers) : null,
      ]
    );
    const broadcastId = (result as any).insertId;

    // ذخیره در notifications برای هر کاربر (batch insert)
    const notifType = type === 'warning' ? 'system' : type === 'success' ? 'system' : 'system';
    const valuePlaceholders = targetUsers.map(() => '(?, ?, ?, ?, ?)').join(',');
    const notifParams: any[] = [];
    for (const uid of targetUsers) {
      notifParams.push(uid, notifType, title.trim(), message.trim(), link?.trim() || null);
    }

    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ${valuePlaceholders}`,
      notifParams
    );

    await logAdminAction(adminId, 'send_broadcast', 'broadcast', broadcastId, {
      title, type, recipients, recipient_count: targetUsers.length,
    });

    // 🔔 ارسال از طریق Socket.io به کاربران آنلاین
    await emitToSocket({
      event: 'new_notification',
      data: {
        title: title.trim(),
        message: message.trim(),
        type,
        link: link?.trim() || null,
        broadcast_id: broadcastId,
      },
      targetUsers,
    });

    return NextResponse.json({
      success: true,
      id: broadcastId,
      recipient_count: targetUsers.length,
      message: `اعلان برای ${targetUsers.length} کاربر ارسال شد`,
    });
  } catch (error: any) {
    console.error('Broadcast POST error:', error);
    return NextResponse.json({ error: 'خطا در ارسال اعلان' }, { status: 500 });
  }
}