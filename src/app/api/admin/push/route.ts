// app/api/admin/push/route.ts
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

// GET — لیست ارسال‌ها + آمار
export async function GET(request: NextRequest) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }
    if (!(await checkAdmin(adminId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
    }

    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const notifications = (await query(
      `SELECT
        pn.*,
        u.full_name AS admin_name
       FROM push_notifications pn
       LEFT JOIN users u ON pn.admin_id = u.id
       ORDER BY pn.sent_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )) as any[];

    const totalRows = (await query(
      'SELECT COUNT(*) AS count FROM push_notifications'
    )) as any[];
    const total = totalRows[0]?.count || 0;

    // آمار کلی
    const statsRows = (await query(
      `SELECT
        COUNT(*) AS total,
        SUM(sent_count) AS total_sent,
        SUM(delivered_count) AS total_delivered,
        SUM(clicked_count) AS total_clicked,
        SUM(failed_count) AS total_failed
       FROM push_notifications`
    )) as any[];
    const stats = statsRows[0] || {};

    return NextResponse.json({
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        total: Number(stats.total || 0),
        total_sent: Number(stats.total_sent || 0),
        total_delivered: Number(stats.total_delivered || 0),
        total_clicked: Number(stats.total_clicked || 0),
        total_failed: Number(stats.total_failed || 0),
      },
    });
  } catch (error: any) {
    console.error('Push list error:', error);
    return NextResponse.json({ error: 'خطا در دریافت' }, { status: 500 });
  }
}