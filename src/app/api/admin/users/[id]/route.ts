// app/api/admin/users/[id]/route.ts
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

async function logAdminAction(
  adminId: number,
  action: string,
  targetType: string,
  targetId: number,
  details?: any
) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, action, targetType, targetId, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('Admin log error:', err);
  }
}

// GET /api/admin/users/[id]
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
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const users = (await query(
      `SELECT
        id, phone, full_name, email, role, experience, bio, skills, avatar,
        rating, completed_projects, is_active, online_status,
        created_at, updated_at, last_seen_at
       FROM users WHERE id = ?`,
      [userId]
    )) as any[];

    const user = users[0];
    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // skills رو parse کن
    if (user.skills && typeof user.skills === 'string') {
      try {
        user.skills = JSON.parse(user.skills);
      } catch {
        user.skills = [];
      }
    } else if (!user.skills) {
      user.skills = [];
    }

    // ✅ اصلاح: آمار
    const statsRowsArr = (await query(
      `SELECT
        (SELECT COUNT(*) FROM posts WHERE user_id = ?) AS posts_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'active') AS active_posts,
        (SELECT COUNT(*) FROM messages WHERE sender_id = ? OR receiver_id = ?) AS messages_count,
        (SELECT COUNT(*) FROM contracts WHERE client_id = ? OR freelancer_id = ?) AS contracts_count,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id = ?) AS reviews_count
      `,
      [userId, userId, userId, userId, userId, userId, userId]
    )) as any[];
    const statsRows = statsRowsArr[0] || {};

    // آگهی‌های اخیر
    const recentPosts = (await query(
      `SELECT id, title, status, views, created_at
       FROM posts WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    )) as any[];

    return NextResponse.json({
      user,
      stats: statsRows,
      recentPosts,
    });
  } catch (error: any) {
    console.error('Admin user GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت کاربر' }, { status: 500 });
  }
}

// PUT /api/admin/users/[id]
export async function PUT(
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
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    if (userId === adminId) {
      return NextResponse.json(
        { error: 'نمی‌توانید خودتان را مسدود کنید' },
        { status: 400 }
      );
    }

    if (action === 'toggle-block') {
      const users = (await query('SELECT is_active FROM users WHERE id = ?', [userId])) as any[];
      const user = users[0];
      if (!user) {
        return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
      }

      const newStatus = user.is_active ? 0 : 1;
      await query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, userId]);

      await logAdminAction(adminId, newStatus ? 'unblock_user' : 'block_user', 'user', userId);

      return NextResponse.json({
        success: true,
        is_active: !!newStatus,
        message: newStatus ? 'کاربر فعال شد' : 'کاربر مسدود شد',
      });
    }

    if (action === 'update') {
      const { full_name, email, role } = body;

      if (full_name !== undefined && !String(full_name).trim()) {
        return NextResponse.json({ error: 'نام نمی‌تواند خالی باشد' }, { status: 400 });
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'ایمیل معتبر نیست' }, { status: 400 });
      }
      if (role && !['user', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'نقش نامعتبر' }, { status: 400 });
      }

      await query(
        `UPDATE users
         SET full_name = COALESCE(?, full_name),
             email = ?,
             role = COALESCE(?, role),
             updated_at = NOW()
         WHERE id = ?`,
        [
          full_name ? String(full_name).trim() : null,
          email ? String(email).trim() : null,
          role || null,
          userId,
        ]
      );

      await logAdminAction(adminId, 'update_user', 'user', userId, { full_name, email, role });

      return NextResponse.json({ success: true, message: 'اطلاعات به‌روزرسانی شد' });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin user PUT error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(
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
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    if (userId === adminId) {
      return NextResponse.json(
        { error: 'نمی‌توانید خودتان را حذف کنید' },
        { status: 400 }
      );
    }

    const users = (await query('SELECT id FROM users WHERE id = ?', [userId])) as any[];
    if (users.length === 0) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    await query('DELETE FROM users WHERE id = ?', [userId]);

    await logAdminAction(adminId, 'delete_user', 'user', userId);

    return NextResponse.json({ success: true, message: 'کاربر حذف شد' });
  } catch (error: any) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json({ error: 'خطا در حذف' }, { status: 500 });
  }
}