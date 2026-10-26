// app/api/admin/posts/route.ts
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

// GET /api/admin/posts
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
    const filter = sp.get('filter') || 'all';
    const category = sp.get('category') || '';
    const userId = sp.get('user') || '';
    const sort = sp.get('sort') || 'newest';
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const whereParts: string[] = [];
    const params: any[] = [];

    if (search) {
      whereParts.push('(p.title LIKE ? OR p.description LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s);
    }

    if (filter !== 'all') {
      whereParts.push('p.status = ?');
      params.push(filter);
    }

    if (category) {
      whereParts.push('p.category = ?');
      params.push(category);
    }

    if (userId) {
      whereParts.push('p.user_id = ?');
      params.push(parseInt(userId, 10));
    }

    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    let orderSQL = 'ORDER BY p.created_at DESC';
    if (sort === 'oldest') orderSQL = 'ORDER BY p.created_at ASC';
    else if (sort === 'views') orderSQL = 'ORDER BY p.views DESC';

    const posts = await query(
      `SELECT
        p.id, p.title, p.slug, p.category, p.sub_category, p.price,
        p.price_type, p.status, p.views, p.created_at,
        u.id AS user_id, u.full_name AS user_name, u.phone AS user_phone
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       ${whereSQL}
       ${orderSQL}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [totalRows] = await query(
      `SELECT COUNT(*) AS count FROM posts p ${whereSQL}`,
      params
    );
    const total = (totalRows as any).count || 0;

    // آمار کلی
    const [statsRows] = await query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'locked' THEN 1 ELSE 0 END) AS locked,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired
       FROM posts`
    );

    // لیست دسته‌بندی‌ها
    const categories = await query(
      `SELECT DISTINCT category FROM posts WHERE category IS NOT NULL AND category != '' ORDER BY category`
    );

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: Number((statsRows as any).total || 0),
        pending: Number((statsRows as any).pending || 0),
        active: Number((statsRows as any).active || 0),
        locked: Number((statsRows as any).locked || 0),
        completed: Number((statsRows as any).completed || 0),
        rejected: Number((statsRows as any).rejected || 0),
        expired: Number((statsRows as any).expired || 0),
      },
      categories: (categories as any[]).map((c) => c.category),
    });
  } catch (error: any) {
    console.error('Admin posts GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت آگهی‌ها' }, { status: 500 });
  }
}