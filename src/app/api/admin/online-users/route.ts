// app/api/admin/online-users/route.ts
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

    // 🔑 کاربران آنلاین (online_status = 1)
    const onlineUsers = (await query(
      `SELECT
        id, phone, full_name, email, role, rating, completed_projects,
        avatar, online_status, last_seen_at, created_at
       FROM users
       WHERE online_status = 1 AND is_active = 1
       ORDER BY last_seen_at DESC`
    )) as any[];

    // 🔑 کاربرانی که اخیراً آنلاین بودن (آخرین ۲۴ ساعت)
    const recentUsers = (await query(
      `SELECT
        id, phone, full_name, role, online_status,
        last_seen_at,
        TIMESTAMPDIFF(MINUTE, last_seen_at, NOW()) AS minutes_ago
       FROM users
       WHERE last_seen_at IS NOT NULL
         AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         AND is_active = 1
         AND online_status = 0
       ORDER BY last_seen_at DESC
       LIMIT 20`
    )) as any[];

    // 🔑 آمار
    const statsRows = (await query(
      `SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN online_status = 1 THEN 1 ELSE 0 END) AS online_now,
        SUM(CASE WHEN online_status = 1 AND role = 'admin' THEN 1 ELSE 0 END) AS online_admins,
        SUM(CASE WHEN online_status = 1 AND role = 'user' THEN 1 ELSE 0 END) AS online_regular,
        SUM(CASE WHEN last_seen_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 ELSE 0 END) AS active_last_hour,
        SUM(CASE WHEN last_seen_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) AS active_last_24h
       FROM users
       WHERE is_active = 1`
    )) as any[];
    const stats = statsRows[0] || {};

    return NextResponse.json({
      onlineUsers,
      recentUsers,
      stats: {
        total_users: Number(stats.total_users || 0),
        online_now: Number(stats.online_now || 0),
        online_admins: Number(stats.online_admins || 0),
        online_regular: Number(stats.online_regular || 0),
        active_last_hour: Number(stats.active_last_hour || 0),
        active_last_24h: Number(stats.active_last_24h || 0),
      },
    });
  } catch (error: any) {
    console.error('Online users error:', error);
    return NextResponse.json({ error: 'خطا در دریافت' }, { status: 500 });
  }
}