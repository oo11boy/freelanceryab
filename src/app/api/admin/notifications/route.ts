// app/api/admin/notifications/route.ts
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

// GET /api/admin/notifications — تاریخچه
export async function GET(request: NextRequest) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const notifications = await query(
      `SELECT
        b.*,
        u.full_name AS admin_name
       FROM broadcast_notifications b
       LEFT JOIN users u ON b.admin_id = u.id
       ORDER BY b.sent_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [totalRows] = await query('SELECT COUNT(*) AS count FROM broadcast_notifications');
    const total = (totalRows as any).count || 0;

    // آمار
    const [statsRows] = await query(
      `SELECT
        COUNT(*) AS total,
        SUM(recipient_count) AS total_recipients,
        SUM(CASE WHEN recipients = 'all' THEN 1 ELSE 0 END) AS all_count,
        SUM(CASE WHEN recipients = 'specific' THEN 1 ELSE 0 END) AS specific_count
       FROM broadcast_notifications`
    );

    return NextResponse.json({
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        total: Number((statsRows as any).total || 0),
        total_recipients: Number((statsRows as any).total_recipients || 0),
        all_count: Number((statsRows as any).all_count || 0),
        specific_count: Number((statsRows as any).specific_count || 0),
      },
    });
  } catch (error: any) {
    console.error('Admin notifications GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت اعلانات' }, { status: 500 });
  }
}