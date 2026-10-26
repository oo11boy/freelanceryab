// app/api/posts/[id]/lock/route.ts
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

// POST /api/posts/[id]/lock
export async function POST(
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

    const body = await request.json();
    const { action } = body;

    if (action !== "lock" && action !== "unlock") {
      return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
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

    if (action === "lock") {
      if (post.status !== "active") {
        return NextResponse.json(
          { error: "فقط آگهی فعال قابل قفل کردن است" },
          { status: 400 }
        );
      }

      const activeContracts = await query(
        `SELECT id FROM contracts 
         WHERE post_id = ? AND status IN ('in_progress', 'delivered')`,
        [postId]
      );
      if ((activeContracts as any[]).length === 0) {
        return NextResponse.json(
          {
            error:
              "ابتدا باید پروژه رو با یک فریلنسر شروع کنید، سپس قفل کنید",
          },
          { status: 400 }
        );
      }

      await query(
        `UPDATE posts SET status = 'locked', updated_at = NOW() WHERE id = ?`,
        [postId]
      );

      return NextResponse.json({
        success: true,
        status: "locked",
        message: "آگهی قفل شد و از لیست عمومی حذف شد",
      });
    }

    if (action === "unlock") {
      if (post.status !== "locked") {
        return NextResponse.json(
          { error: "فقط آگهی قفل‌شده قابل باز کردن است" },
          { status: 400 }
        );
      }

      await query(
        `UPDATE posts SET status = 'active', updated_at = NOW() WHERE id = ?`,
        [postId]
      );

      return NextResponse.json({
        success: true,
        status: "active",
        message: "آگهی باز شد و دوباره در لیست نمایش داده می‌شه",
      });
    }

    return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
  } catch (error) {
    console.error("Lock post error:", error);
    return NextResponse.json({ error: "خطا در عملیات" }, { status: 500 });
  }
}