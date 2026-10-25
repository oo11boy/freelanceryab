// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

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

    // کاربر
    const users = await query(
      `SELECT
         id, full_name, avatar, bio, skills, experience,
         rating, completed_projects, created_at,
         is_active, online_status
       FROM users WHERE id = ? AND is_active = 1`,
      [userId]
    );
    const user = (users as any[])[0];
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    if (user.skills && typeof user.skills === "string") {
      try {
        user.skills = JSON.parse(user.skills);
      } catch {
        user.skills = [];
      }
    } else if (!user.skills) {
      user.skills = [];
    }

    // آمار آگهی‌های فعال
    const activePosts = await query(
      `SELECT COUNT(*) AS count FROM posts
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    );
    const activePostsCount = (activePosts as any[])[0]?.count || 0;

    // آگهی‌های اخیر
    const recentPosts = await query(
      `SELECT id, title, category, price, price_type, location, created_at
       FROM posts
       WHERE user_id = ? AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    // 🔑 نظرات دریافتی
    const reviews = await query(
      `SELECT
         r.id,
         r.rating,
         r.comment,
         r.created_at,
         r.reviewer_id,
         u.full_name AS reviewer_name,
         u.avatar AS reviewer_avatar,
         c.post_id,
         p.title AS post_title
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       JOIN contracts c ON c.id = r.contract_id
       LEFT JOIN posts p ON p.id = c.post_id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC
       LIMIT 30`,
      [userId]
    );

    // 🔑 آمار امتیازها
    const statsRows = await query(
      `SELECT
         COUNT(*) AS total_reviews,
         AVG(rating) AS avg_rating,
         SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS count_5,
         SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS count_4,
         SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS count_3,
         SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS count_2,
         SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS count_1
       FROM reviews WHERE reviewee_id = ?`,
      [userId]
    );
    const stats = (statsRows as any[])[0] || {
      total_reviews: 0,
      avg_rating: 0,
      count_5: 0,
      count_4: 0,
      count_3: 0,
      count_2: 0,
      count_1: 0,
    };

    return NextResponse.json({
      user: {
        ...user,
        active_posts_count: activePostsCount,
      },
      recentPosts: recentPosts || [],
      reviews: reviews || [],
      ratingStats: {
        total: Number(stats.total_reviews) || 0,
        average: stats.avg_rating ? Number(stats.avg_rating) : 0,
        distribution: {
          5: Number(stats.count_5) || 0,
          4: Number(stats.count_4) || 0,
          3: Number(stats.count_3) || 0,
          2: Number(stats.count_2) || 0,
          1: Number(stats.count_1) || 0,
        },
      },
    });
  } catch (error) {
    console.error("Get public user error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات کاربر" },
      { status: 500 }
    );
  }
}