// app/api/admin/users/route.ts
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

// GET /api/admin/users
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }
    if (!(await checkAdmin(userId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
    }

    const sp = request.nextUrl.searchParams;
    const search = sp.get('search')?.trim() || '';
    const filter = sp.get('filter') || 'all';
    const sort = sp.get('sort') || 'newest';
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const whereParts: string[] = [];
    const params: any[] = [];

    if (search) {
      whereParts.push('(full_name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (filter === 'active') whereParts.push('is_active = 1');
    else if (filter === 'blocked') whereParts.push('is_active = 0');
    else if (filter === 'admin') whereParts.push("role = 'admin'");

    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    let orderSQL = 'ORDER BY created_at DESC';
    if (sort === 'oldest') orderSQL = 'ORDER BY created_at ASC';
    else if (sort === 'rating') orderSQL = 'ORDER BY rating DESC';
    else if (sort === 'projects') orderSQL = 'ORDER BY completed_projects DESC';

    const users = await query(
      `SELECT
        id, phone, full_name, email, role, rating, completed_projects,
        is_active, online_status, created_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = users.id) AS posts_count
       FROM users
       ${whereSQL}
       ${orderSQL}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // ✅ اصلاح: COUNT به‌درستی خونده بشه
    const totalRows = (await query(
      `SELECT COUNT(*) AS count FROM users ${whereSQL}`,
      params
    )) as any[];
    const total = totalRows[0]?.count || 0;

    // ✅ اصلاح: stats هم به‌درستی خونده بشه
    const statsRows = (await query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS blocked,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins
       FROM users`
    )) as any[];
    const stats = statsRows[0] || {};

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: Number(stats.total || 0),
        active: Number(stats.active || 0),
        blocked: Number(stats.blocked || 0),
        admins: Number(stats.admins || 0),
      },
    });
  } catch (error: any) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت کاربران' }, { status: 500 });
  }
}