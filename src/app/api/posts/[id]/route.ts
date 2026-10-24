import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        u.full_name as user_name, 
        u.rating as user_rating,
        u.avatar as user_avatar
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [postId],
    );

    if (!posts || (posts as any[]).length === 0) {
      return NextResponse.json(
        { error: "آگهی مورد نظر یافت نشد" },
        { status: 404 },
      );
    }

    const post = (posts as any[])[0];

    // ✅ تبدیل فیلدهای JSON به آرایه
    if (post.skills) {
      try {
        post.skills =
          typeof post.skills === "string"
            ? JSON.parse(post.skills)
            : post.skills;
      } catch {
        post.skills = [];
      }
    } else {
      post.skills = [];
    }

    if (post.images) {
      try {
        post.images =
          typeof post.images === "string"
            ? JSON.parse(post.images)
            : post.images;
      } catch {
        post.images = [];
      }
    } else {
      post.images = [];
    }

    if (post.status !== "active") {
      return NextResponse.json(
        { error: "آگهی مورد نظر یافت نشد" },
        { status: 404 },
      );
    }

    await query("UPDATE posts SET views = views + 1 WHERE id = ?", [postId]);

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "خطا در دریافت آگهی" }, { status: 500 });
  }
}
