// app/api/admin/push/[id]/route.ts
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

// GET — جزئیات یه ارسال + لیست کاربران
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }
    if (!(await checkAdmin(adminId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
    }

    const { id } = await params;
    const notifId = parseInt(id);
    if (isNaN(notifId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const notifs = (await query(
      `SELECT
        pn.*,
        u.full_name AS admin_name
       FROM push_notifications pn
       LEFT JOIN users u ON pn.admin_id = u.id
       WHERE pn.id = ?`,
      [notifId]
    )) as any[];

    const notification = notifs[0];
    if (!notification) {
      return NextResponse.json({ error: 'ارسال یافت نشد' }, { status: 404 });
    }

    // لیست کاربران
    const logs = (await query(
      `SELECT
        pnl.id, pnl.user_id, pnl.status, pnl.error,
        pnl.sent_at, pnl.clicked_at,
        u.full_name AS user_name, u.phone AS user_phone
       FROM push_notification_logs pnl
       LEFT JOIN users u ON pnl.user_id = u.id
       WHERE pnl.notification_id = ?
       ORDER BY pnl.sent_at DESC`,
      [notifId]
    )) as any[];

    // آمار تفکیکی
    const statsRows = (await query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS clicked
       FROM push_notification_logs
       WHERE notification_id = ?`,
      [notifId]
    )) as any[];
    const stats = statsRows[0] || {};

    return NextResponse.json({
      notification,
      logs,
      stats: {
        total: Number(stats.total || 0),
        sent: Number(stats.sent || 0),
        failed: Number(stats.failed || 0),
        clicked: Number(stats.clicked || 0),
      },
    });
  } catch (error: any) {
    console.error('Push detail error:', error);
    return NextResponse.json({ error: 'خطا' }, { status: 500 });
  }
}