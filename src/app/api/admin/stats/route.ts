// app/api/admin/stats/route.ts
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
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    if (!(await checkAdmin(userId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
    }

    // =====================================================
    // ✅ همه queryها با as any[]
    // =====================================================

    // آمار کاربران
    const usersRows = (await query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS new_week,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active
       FROM users`
    )) as any[];
    const usersCount = usersRows[0] || {};

    // آمار آگهی‌ها
    const postsRows = (await query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS new_week
       FROM posts`
    )) as any[];
    const postsCount = postsRows[0] || {};

    // آمار قراردادها
    const contractsRows = (await query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress
       FROM contracts`
    )) as any[];
    const contractsCount = contractsRows[0] || {};

    // نمودار ۷ روز اخیر — کاربران
    const userGrowth = (await query(
      `SELECT
        DATE(created_at) AS date,
        COUNT(*) AS count
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    )) as any[];

    // نمودار ۷ روز اخیر — آگهی‌ها
    const postGrowth = (await query(
      `SELECT
        DATE(created_at) AS date,
        COUNT(*) AS count
       FROM posts
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    )) as any[];

    // جدیدترین کاربران
    const recentUsers = (await query(
      `SELECT id, full_name, phone, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 5`
    )) as any[];

    // جدیدترین آگهی‌ها
    const recentPosts = (await query(
      `SELECT p.id, p.title, p.status, p.created_at, u.full_name AS user_name
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC
       LIMIT 5`
    )) as any[];

    return NextResponse.json({
      users: {
        total: Number(usersCount.total || 0),
        new_week: Number(usersCount.new_week || 0),
        active: Number(usersCount.active || 0),
      },
      posts: {
        total: Number(postsCount.total || 0),
        active: Number(postsCount.active || 0),
        new_week: Number(postsCount.new_week || 0),
      },
      contracts: {
        total: Number(contractsCount.total || 0),
        completed: Number(contractsCount.completed || 0),
        in_progress: Number(contractsCount.in_progress || 0),
      },
      growth: {
        users: userGrowth,
        posts: postGrowth,
      },
      recent: {
        users: recentUsers,
        posts: recentPosts,
      },
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت آمار' },
      { status: 500 }
    );
  }
}