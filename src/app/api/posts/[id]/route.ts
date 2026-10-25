// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
    }

    const posts = await query(
      `SELECT
        p.*,
        u.full_name   AS user_name,
        u.rating      AS user_rating,
        u.avatar      AS user_avatar,
        u.completed_projects AS user_completed_projects,
        u.created_at  AS user_joined_at,
        u.bio         AS user_bio,
        u.skills      AS user_skills,
        u.experience  AS user_experience
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [postId]
    );

    if (!posts || (posts as any[]).length === 0) {
      return NextResponse.json(
        { error: "آگهی مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    const post = (posts as any[])[0];

    if (post.status !== "active") {
      return NextResponse.json(
        { error: "آگهی مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    // ✅ تبدیل skills آگهی
    if (post.skills) {
      try {
        post.skills =
          typeof post.skills === "string" ? JSON.parse(post.skills) : post.skills;
      } catch {
        post.skills = [];
      }
    } else {
      post.skills = [];
    }

    // ✅ تبدیل images آگهی
    if (post.images) {
      try {
        post.images =
          typeof post.images === "string" ? JSON.parse(post.images) : post.images;
      } catch {
        post.images = [];
      }
    } else {
      post.images = [];
    }

    // ✅ تبدیل skills کاربر
    if (post.user_skills) {
      try {
        post.user_skills =
          typeof post.user_skills === "string"
            ? JSON.parse(post.user_skills)
            : post.user_skills;
      } catch {
        post.user_skills = [];
      }
    } else {
      post.user_skills = [];
    }

    // ✅ اطلاعات آگهی‌دهنده به‌صورت یک آبجکت جداگانه (تمیزتر)
    const postOwner = {
      id: post.user_id,
      full_name: post.user_name || "کاربر همیار",
      avatar: post.user_avatar || null,
      rating: Number(post.user_rating || 0),
      completed_projects: Number(post.user_completed_projects || 0),
      joined_at: post.user_joined_at || null,
      bio: post.user_bio || null,
      skills: post.user_skills || [],
      experience: post.user_experience || null,
    };

    // حذف فیلدهای تکراری از post
    delete post.user_name;
    delete post.user_rating;
    delete post.user_avatar;
    delete post.user_completed_projects;
    delete post.user_joined_at;
    delete post.user_bio;
    delete post.user_skills;
    delete post.user_experience;

    // ✅ افزایش بازدید
    await query("UPDATE posts SET views = views + 1 WHERE id = ?", [postId]);

    return NextResponse.json({ post, owner: postOwner });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "خطا در دریافت آگهی" }, { status: 500 });
  }
}