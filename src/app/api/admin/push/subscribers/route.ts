// app/api/admin/push/subscribers/route.ts
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
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const whereParts: string[] = [];
    const params: any[] = [];

    if (search) {
      whereParts.push('(u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    // 🔑 اصلاح: GROUP BY همه ستون‌ها
    const subscribers = (await query(
      `SELECT
        u.id, u.phone, u.full_name, u.email, u.role, u.avatar,
        u.is_active, u.online_status, u.last_seen_at, u.created_at,
        COUNT(ps.id) AS devices_count,
        MIN(ps.created_at) AS first_subscribed_at,
        MAX(ps.updated_at) AS last_updated_at
       FROM users u
       INNER JOIN push_subscriptions ps ON ps.user_id = u.id
       ${whereSQL}
       GROUP BY
         u.id, u.phone, u.full_name, u.email, u.role, u.avatar,
         u.is_active, u.online_status, u.last_seen_at, u.created_at
       ORDER BY MAX(ps.updated_at) DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )) as any[];

    // 🔑 شمارش کل
    const totalRows = (await query(
      `SELECT COUNT(DISTINCT ps.user_id) AS count
       FROM push_subscriptions ps
       INNER JOIN users u ON u.id = ps.user_id
       ${whereSQL}`,
      params
    )) as any[];
    const total = totalRows[0]?.count || 0;

    // 🔑 آمار کلی
    const statsRows = (await query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE is_active = 1) AS total_users,
        (SELECT COUNT(DISTINCT user_id) FROM push_subscriptions) AS total_subscribers,
        (SELECT COUNT(*) FROM push_subscriptions) AS total_devices,
        (SELECT COUNT(DISTINCT user_id) FROM push_subscriptions
         WHERE user_id IN (SELECT id FROM users WHERE online_status = 1)) AS online_subscribers
      `
    )) as any[];
    const stats = statsRows[0] || {};

    const totalUsers = Number(stats.total_users || 0);
    const totalSubscribers = Number(stats.total_subscribers || 0);
    const subscribeRate = totalUsers > 0
      ? Math.round((totalSubscribers / totalUsers) * 100)
      : 0;

    return NextResponse.json({
      subscribers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total_users: totalUsers,
        total_subscribers: totalSubscribers,
        total_devices: Number(stats.total_devices || 0),
        online_subscribers: Number(stats.online_subscribers || 0),
        subscribe_rate: subscribeRate,
        not_subscribed: totalUsers - totalSubscribers,
      },
    });
  } catch (error: any) {
    console.error('Push subscribers error:', error);
    return NextResponse.json({ error: 'خطا در دریافت' }, { status: 500 });
  }
}