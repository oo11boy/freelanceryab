// app/api/profile/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import jwt from "jsonwebtoken";

function getUserIdFromToken(request: NextRequest): number | null {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.id;
  } catch {
    return null;
  }
}

// GET /api/profile/reviews
// لیست نظراتی که به کاربر داده شده + پروژه‌های انجام‌شده
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    // ۱. نظرات دریافتی
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
       LIMIT 50`,
      [userId]
    );

    // ۲. آمار امتیازها
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

    // ۳. پروژه‌های انجام‌شده (قراردادهای completed)
    const completedContracts = await query(
      `SELECT
         c.id AS contract_id,
         c.completed_at,
         c.client_id,
         c.freelancer_id,
         p.id AS post_id,
         p.title AS post_title,
         CASE
           WHEN c.client_id = ? THEN c.freelancer_id
           ELSE c.client_id
         END AS other_user_id,
         CASE
           WHEN c.client_id = ? THEN 'client'
           ELSE 'freelancer'
         END AS my_role,
         u.full_name AS other_user_name,
         u.avatar AS other_user_avatar
       FROM contracts c
       JOIN posts p ON p.id = c.post_id
       JOIN users u ON u.id = CASE
         WHEN c.client_id = ? THEN c.freelancer_id
         ELSE c.client_id
       END
       WHERE (c.client_id = ? OR c.freelancer_id = ?)
         AND c.status = 'completed'
       ORDER BY c.completed_at DESC
       LIMIT 30`,
      [userId, userId, userId, userId, userId]
    );

    return NextResponse.json({
      reviews,
      stats: {
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
      completedContracts,
    });
  } catch (error) {
    console.error("Get profile reviews error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت نظرات" },
      { status: 500 }
    );
  }
}