// app/api/admin/reports/route.ts
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

export async function GET(request: NextRequest) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const sp = request.nextUrl.searchParams;
    const status = sp.get('status') || 'all'; // all | pending | reviewed | resolved | dismissed
    const type = sp.get('type') || 'all';     // all | post | user | message
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const whereParts: string[] = [];
    const params: any[] = [];

    if (status !== 'all') {
      whereParts.push('r.status = ?');
      params.push(status);
    }
    if (type !== 'all') {
      whereParts.push('r.target_type = ?');
      params.push(type);
    }

    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const reports = await query(
      `SELECT
        r.id, r.reporter_id, r.target_type, r.target_id, r.reason,
        r.description, r.status, r.admin_id, r.admin_note,
        r.created_at, r.reviewed_at, r.resolved_at,
        u.full_name AS reporter_name, u.phone AS reporter_phone,
        a.full_name AS admin_name,
        CASE
          WHEN r.target_type = 'post' THEN (SELECT title FROM posts WHERE id = r.target_id)
          WHEN r.target_type = 'user' THEN (SELECT full_name FROM users WHERE id = r.target_id)
          WHEN r.target_type = 'message' THEN (SELECT message FROM messages WHERE id = r.target_id)
          ELSE NULL
        END AS target_title
       FROM reports r
       LEFT JOIN users u ON r.reporter_id = u.id
       LEFT JOIN users a ON r.admin_id = a.id
       ${whereSQL}
       ORDER BY
         CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
         r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [totalRows] = await query(
      `SELECT COUNT(*) AS count FROM reports r ${whereSQL}`,
      params
    );
    const total = (totalRows as any).count || 0;

    const [statsRows] = await query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) AS reviewed,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) AS dismissed
       FROM reports`
    );

    return NextResponse.json({
      reports,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        total: Number((statsRows as any).total || 0),
        pending: Number((statsRows as any).pending || 0),
        reviewed: Number((statsRows as any).reviewed || 0),
        resolved: Number((statsRows as any).resolved || 0),
        dismissed: Number((statsRows as any).dismissed || 0),
      },
    });
  } catch (error: any) {
    console.error('Admin reports GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت گزارش‌ها' }, { status: 500 });
  }
}