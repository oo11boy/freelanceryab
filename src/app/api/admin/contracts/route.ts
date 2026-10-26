// app/api/admin/contracts/route.ts
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

// GET /api/admin/contracts
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
    const search = sp.get('search')?.trim() || '';
    const filter = sp.get('filter') || 'all'; // all | in_progress | delivered | completed | cancelled | needs_review
    const sort = sp.get('sort') || 'newest'; // newest | oldest | oldest_active
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const whereParts: string[] = [];
    const params: any[] = [];

    if (search) {
      whereParts.push(`(
        p.title LIKE ? OR
        cl.full_name LIKE ? OR cl.phone LIKE ? OR
        fr.full_name LIKE ? OR fr.phone LIKE ?
      )`);
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (filter === 'needs_review') {
      whereParts.push('c.needs_review = 1');
    } else if (filter !== 'all') {
      whereParts.push('c.status = ?');
      params.push(filter);
    }

    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    let orderSQL = 'ORDER BY c.started_at DESC';
    if (sort === 'oldest') orderSQL = 'ORDER BY c.started_at ASC';
    else if (sort === 'oldest_active') {
      orderSQL = `ORDER BY
        CASE WHEN c.status = 'in_progress' THEN 0 ELSE 1 END,
        c.started_at ASC`;
    }

    const contracts = await query(
      `SELECT
        c.id, c.post_id, c.client_id, c.freelancer_id, c.status,
        c.needs_review, c.started_at, c.delivered_at, c.completed_at,
        p.title AS post_title,
        cl.full_name AS client_name, cl.phone AS client_phone,
        fr.full_name AS freelancer_name, fr.phone AS freelancer_phone,
        DATEDIFF(NOW(), c.started_at) AS days_active
       FROM contracts c
       LEFT JOIN posts p ON c.post_id = p.id
       LEFT JOIN users cl ON c.client_id = cl.id
       LEFT JOIN users fr ON c.freelancer_id = fr.id
       ${whereSQL}
       ${orderSQL}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [totalRows] = await query(
      `SELECT COUNT(*) AS count
       FROM contracts c
       LEFT JOIN posts p ON c.post_id = p.id
       LEFT JOIN users cl ON c.client_id = cl.id
       LEFT JOIN users fr ON c.freelancer_id = fr.id
       ${whereSQL}`,
      params
    );
    const total = (totalRows as any).count || 0;

    // آمار کلی
    const [statsRows] = await query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
        SUM(CASE WHEN needs_review = 1 THEN 1 ELSE 0 END) AS needs_review,
        SUM(CASE WHEN status = 'in_progress' AND DATEDIFF(NOW(), started_at) > 14 THEN 1 ELSE 0 END) AS old_in_progress
       FROM contracts`
    );

    const stats = statsRows as any;
    const completionRate = stats.total > 0
      ? Math.round((Number(stats.completed) / Number(stats.total)) * 100)
      : 0;

    return NextResponse.json({
      contracts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: Number(stats.total || 0),
        in_progress: Number(stats.in_progress || 0),
        delivered: Number(stats.delivered || 0),
        completed: Number(stats.completed || 0),
        cancelled: Number(stats.cancelled || 0),
        needs_review: Number(stats.needs_review || 0),
        old_in_progress: Number(stats.old_in_progress || 0),
        completion_rate: completionRate,
      },
    });
  } catch (error: any) {
    console.error('Admin contracts GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت قراردادها' }, { status: 500 });
  }
}