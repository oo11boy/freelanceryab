// app/api/posts/[id]/route.ts
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

    console.log("🔍 [GET /api/posts/:id] postId =", postId, "raw id =", id);

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

    console.log("🔍 [GET /api/posts/:id] found =", (posts as any[]).length);

    if (!posts || (posts as any[]).length === 0) {
      return NextResponse.json(
        { error: "آگهی مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

    const post = (posts as any[])[0];

    console.log("🔍 [GET /api/posts/:id] status =", post.status);

    if (
      post.status !== "active" &&
      post.status !== "locked" &&
      post.status !== "in_progress" &&
      post.status !== "delivered" &&
      post.status !== "completed"
    ) {
      console.log("🔍 [GET /api/posts/:id] BLOCKED: status not allowed →", post.status);
      return NextResponse.json(
        { error: "آگهی مورد نظر یافت نشد" },
        { status: 404 }
      );
    }

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

    delete post.user_name;
    delete post.user_rating;
    delete post.user_avatar;
    delete post.user_completed_projects;
    delete post.user_joined_at;
    delete post.user_bio;
    delete post.user_skills;
    delete post.user_experience;

    await query("UPDATE posts SET views = views + 1 WHERE id = ?", [postId]);

    return NextResponse.json({ post, owner: postOwner });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "خطا در دریافت آگهی" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    const { id } = await params;
    const postId = parseInt(id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
    }

    const posts = await query(
      `SELECT user_id, status FROM posts WHERE id = ?`,
      [postId]
    );
    const post = (posts as any[])[0];
    if (!post) {
      return NextResponse.json({ error: "آگهی یافت نشد" }, { status: 404 });
    }
    if (post.user_id !== userId) {
      return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
    }

    if (post.status === "locked") {
      return NextResponse.json(
        {
          error:
            "این آگهی قفل شده است. ابتدا از چت پروژه را باز کنید سپس حذف کنید",
        },
        { status: 409 }
      );
    }
    if (post.status === "in_progress") {
      return NextResponse.json(
        { error: "این آگهی در حال انجامه و قابل حذف نیست" },
        { status: 409 }
      );
    }
    if (post.status === "delivered") {
      return NextResponse.json(
        { error: "پروژه تحویل داده شده و در انتظار تأیید شماست" },
        { status: 409 }
      );
    }

    if (post.status === "expired") {
      return NextResponse.json({ success: true, already_deleted: true });
    }

    await query(
      `UPDATE posts SET status = 'expired', updated_at = NOW() WHERE id = ?`,
      [postId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "خطا در حذف آگهی" }, { status: 500 });
  }
}