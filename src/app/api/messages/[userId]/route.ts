// app/api/messages/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserIdFromToken, unauthorized } from "@/lib/auth";

// -------------------------------------------------
// GET - پیام‌های یک مکالمه (بر اساس userId + postId)
// -------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUserId = getUserIdFromToken(request);
    if (!currentUserId) return unauthorized();

    const { userId } = await params;
    const otherUserId = parseInt(userId, 10);

    if (isNaN(otherUserId)) {
      return NextResponse.json(
        { error: "شناسه کاربر نامعتبر است" },
        { status: 400 }
      );
    }

    if (otherUserId === currentUserId) {
      return NextResponse.json(
        { error: "نمی‌توانید با خودتان مکالمه داشته باشید" },
        { status: 400 }
      );
    }

    // 🔑 postId از query param
    const sp = request.nextUrl.searchParams;
    const postIdParam = sp.get("postId");
    const postId =
      postIdParam && postIdParam !== "null" && postIdParam !== ""
        ? parseInt(postIdParam, 10)
        : null;

    const postCondition =
      postId === null ? "m.post_id IS NULL" : "m.post_id = ?";
    const sqlParams: any[] = [currentUserId, otherUserId, otherUserId, currentUserId];
    if (postId !== null) sqlParams.push(postId);

    const messages = await query(
      `SELECT
        m.id,
        m.sender_id,
        m.receiver_id,
        m.post_id,
        m.message,
        m.is_read,
        m.created_at
       FROM messages m
       WHERE ((m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?))
         AND ${postCondition}
       ORDER BY m.created_at ASC
       LIMIT 500`,
      sqlParams
    );

    // علامت‌گذاری خوانده‌شده (فقط برای همین مکالمه)
    const readParams: any[] = [otherUserId, currentUserId];
    let readSql = `UPDATE messages
       SET is_read = TRUE
       WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE`;
    if (postId === null) {
      readSql += ` AND post_id IS NULL`;
    } else {
      readSql += ` AND post_id = ?`;
      readParams.push(postId);
    }
    await query(readSql, readParams);

    // اطلاعات کاربر مقابل
    const otherUser = await query(
      "SELECT id, full_name, avatar, online_status FROM users WHERE id = ?",
      [otherUserId]
    );

    return NextResponse.json({
      messages,
      other_user: (otherUser as any[])[0] || null,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت پیام‌ها" },
      { status: 500 }
    );
  }
}