// app/api/users/top/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/users/top?limit=5&minRating=0
// بهترین کاربران بر اساس امتیاز و پروژه‌های موفق
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const limit = Math.min(
      50,
      Math.max(1, parseInt(sp.get("limit") || "10", 10))
    );
    const minRating = Math.max(0, parseFloat(sp.get("minRating") || "0"));
    const minProjects = Math.max(
      0,
      parseInt(sp.get("minProjects") || "0", 10)
    );
    const sortBy = sp.get("sort") || "rating"; // rating | projects | reviews

    let orderSQL = "u.rating DESC, u.completed_projects DESC";
    if (sortBy === "projects") {
      orderSQL = "u.completed_projects DESC, u.rating DESC";
    }

    const users = await query(
      `SELECT
         u.id,
         u.full_name,
         u.avatar,
         u.bio,
         u.skills,
         u.experience,
         u.rating,
         u.completed_projects,
         u.online_status,
         u.created_at,
         (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = u.id) AS reviews_count
       FROM users u
       WHERE u.is_active = 1
         AND u.rating >= ?
         AND u.completed_projects >= ?
       ORDER BY ${orderSQL}
       LIMIT ?`,
      [minRating, minProjects, limit]
    );

    // پردازش skills
    const processedUsers = (users as any[]).map((u) => {
      let skills: string[] = [];
      if (u.skills) {
        try {
          skills =
            typeof u.skills === "string" ? JSON.parse(u.skills) : u.skills;
        } catch {
          skills = [];
        }
      }
      return { ...u, skills };
    });

    return NextResponse.json({ users: processedUsers });
  } catch (error) {
    console.error("Get top users error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت کاربران" },
      { status: 500 }
    );
  }
}