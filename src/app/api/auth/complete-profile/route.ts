// app/api/auth/complete-profile/route.ts
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

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const { first_name, last_name } = await request.json();

    // اعتبارسنجی
    if (!first_name || !String(first_name).trim()) {
      return NextResponse.json({ error: 'نام الزامی است' }, { status: 400 });
    }

    if (!last_name || !String(last_name).trim()) {
      return NextResponse.json(
        { error: 'نام خانوادگی الزامی است' },
        { status: 400 }
      );
    }

    const firstName = String(first_name).trim();
    const lastName = String(last_name).trim();

    if (firstName.length < 2 || firstName.length > 50) {
      return NextResponse.json(
        { error: 'نام باید بین ۲ تا ۵۰ کاراکتر باشد' },
        { status: 400 }
      );
    }

    if (lastName.length < 2 || lastName.length > 50) {
      return NextResponse.json(
        { error: 'نام خانوادگی باید بین ۲ تا ۵۰ کاراکتر باشد' },
        { status: 400 }
      );
    }

    // به‌روزرسانی full_name
    const fullName = `${firstName} ${lastName}`;

    await query('UPDATE users SET full_name = ? WHERE id = ?', [
      fullName,
      userId,
    ]);

    // دریافت اطلاعات به‌روز شده
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

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json(
      { error: 'خطا در تکمیل پروفایل' },
      { status: 500 }
    );
  }
}