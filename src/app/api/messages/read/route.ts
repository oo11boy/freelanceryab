// app/api/messages/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserIdFromToken, unauthorized } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) return unauthorized();

    const { sender_id, post_id } = await request.json();
    const senderId = parseInt(String(sender_id), 10);

    if (isNaN(senderId)) {
      return NextResponse.json(
        { error: "شناسه فرستنده نامعتبر است" },
        { status: 400 }
      );
    }

    const postId =
      post_id !== undefined && post_id !== null && post_id !== ""
        ? parseInt(String(post_id), 10)
        : null;

    let sql = `UPDATE messages
       SET is_read = TRUE
       WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE`;
    const params: any[] = [senderId, userId];

    if (postId === null) {
      sql += ` AND post_id IS NULL`;
    } else {
      sql += ` AND post_id = ?`;
      params.push(postId);
    }

    await query(sql, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { error: "خطا در علامت‌گذاری" },
      { status: 500 }
    );
  }
}