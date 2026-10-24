// app/api/profile/route.ts
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

// GET - دریافت اطلاعات پروفایل
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const users = await query(
      `SELECT id, phone, full_name, email, experience, bio, skills, avatar,
              rating, completed_projects, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    const user = (users as any[])[0];
    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // تبدیل JSON skills
    if (user.skills && typeof user.skills === 'string') {
      try {
        user.skills = JSON.parse(user.skills);
      } catch {
        user.skills = [];
      }
    } else if (!user.skills) {
      user.skills = [];
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات' }, { status: 500 });
  }
}

// PUT - ویرایش پروفایل
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, email, experience, bio, skills } = body;

    // ✅ اعتبارسنجی نام
    if (full_name !== undefined && (!full_name || !String(full_name).trim())) {
      return NextResponse.json(
        { error: 'نام کامل نمی‌تواند خالی باشد' },
        { status: 400 }
      );
    }

    // ✅ اعتبارسنجی ایمیل (اختیاری)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'ایمیل معتبر نیست' },
        { status: 400 }
      );
    }

    // به‌روزرسانی
    await query(
      `UPDATE users
       SET full_name = COALESCE(?, full_name),
           email = ?,
           experience = ?,
           bio = ?,
           skills = ?
       WHERE id = ?`,
      [
        full_name ? String(full_name).trim() : null,
        email ? String(email).trim() : null,
        experience || null,
        bio ? String(bio).trim() : null,
        skills ? JSON.stringify(skills) : null,
        userId,
      ]
    );

    // دریافت اطلاعات به‌روز شده
    const users = await query(
      `SELECT id, phone, full_name, email, experience, bio, skills, avatar,
              rating, completed_projects, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    const user = (users as any[])[0];

    if (user.skills && typeof user.skills === 'string') {
      try {
        user.skills = JSON.parse(user.skills);
      } catch {
        user.skills = [];
      }
    } else if (!user.skills) {
      user.skills = [];
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی' }, { status: 500 });
  }
}