// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/users/[id] - پروفایل عمومی کاربر (بدون احراز هویت لازم)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
    }

    const users = await query(
      `SELECT
        id, full_name, avatar, bio, skills, experience,
        rating, completed_projects, created_at,
        is_active, online_status
      FROM users
      WHERE id = ? AND is_active = 1`,
      [userId]
    );

    const user = (users as any[])[0];
    if (!user) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // تبدیل JSON skills
    if (user.skills) {
      try {
        user.skills =
          typeof user.skills === "string" ? JSON.parse(user.skills) : user.skills;
      } catch {
        user.skills = [];
      }
    } else {
      user.skills = [];
    }

    // آمار آگهی‌های فعال کاربر
    const activePosts = await query(
      `SELECT COUNT(*) AS count FROM posts
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    );
    const activePostsCount = (activePosts as any[])[0]?.count || 0;

    // ۵ آگهی اخیر فعال کاربر
    const recentPosts = await query(
      `SELECT id, title, category, price, price_type, location, created_at
       FROM posts
       WHERE user_id = ? AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    return NextResponse.json({
      user: {
        ...user,
        active_posts_count: activePostsCount,
        // فیلدهای حساس حذف شده: phone, email, role
      },
      recentPosts: recentPosts || [],
    });
  } catch (error) {
    console.error("Get public user error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات کاربر" },
      { status: 500 }
    );
  }
}