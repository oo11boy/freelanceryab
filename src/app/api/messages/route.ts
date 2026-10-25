// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserIdFromToken, unauthorized } from "@/lib/auth";

// -------------------------------------------------
// GET - لیست مکالمات (گروه‌بندی بر اساس post_id + other_user)
// -------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) return unauthorized();

    const conversations = await query(
      `SELECT
         conv.post_id,
         p.title AS post_title,
         other_user.id AS user_id,
         other_user.full_name AS user_name,
         other_user.avatar AS user_avatar,
         other_user.online_status,
         last_msg.message AS last_message,
         last_msg.created_at AS last_message_time,
         COALESCE(unread.cnt, 0) AS unread_count
       FROM (
         SELECT
           m.post_id,
           CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
           MAX(m.id) AS last_message_id
         FROM messages m
         WHERE m.sender_id = ? OR m.receiver_id = ?
         GROUP BY m.post_id, other_user_id
       ) AS conv
       JOIN users AS other_user
         ON other_user.id = conv.other_user_id
       JOIN messages AS last_msg
         ON last_msg.id = conv.last_message_id
       LEFT JOIN (
         SELECT
           m2.post_id,
           m2.sender_id,
           COUNT(*) AS cnt
         FROM messages m2
         WHERE m2.receiver_id = ? AND m2.is_read = FALSE
         GROUP BY m2.post_id, m2.sender_id
       ) AS unread
         ON unread.sender_id = other_user.id
         AND (
           (unread.post_id IS NULL AND conv.post_id IS NULL)
           OR unread.post_id = conv.post_id
         )
       LEFT JOIN posts p
         ON p.id = conv.post_id
       ORDER BY last_msg.created_at DESC`,
      [userId, userId, userId, userId]
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت مکالمات" },
      { status: 500 }
    );
  }
}

// -------------------------------------------------
// POST - ارسال پیام
// -------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const senderId = getUserIdFromToken(request);
    if (!senderId) return unauthorized();

    const body = await request.json();
    const { receiver_id, post_id, message } = body;

    if (!receiver_id || !message || !String(message).trim()) {
      return NextResponse.json(
        { error: "گیرنده و متن پیام الزامی است" },
        { status: 400 }
      );
    }

    const receiverId = parseInt(String(receiver_id), 10);
    if (isNaN(receiverId)) {
      return NextResponse.json(
        { error: "شناسه گیرنده نامعتبر است" },
        { status: 400 }
      );
    }

    if (receiverId === senderId) {
      return NextResponse.json(
        { error: "نمی‌توانید به خودتان پیام بفرستید" },
        { status: 400 }
      );
    }

    const receiverExists = await query(
      "SELECT id FROM users WHERE id = ? AND is_active = 1",
      [receiverId]
    );
    if (!(receiverExists as any[]).length) {
      return NextResponse.json(
        { error: "کاربر گیرنده یافت نشد" },
        { status: 404 }
      );
    }

    const result = await query(
      `INSERT INTO messages (sender_id, receiver_id, post_id, message)
       VALUES (?, ?, ?, ?)`,
      [senderId, receiverId, post_id || null, String(message).trim()]
    );

    const messageId = (result as any).insertId;

    // اعلان — لینک به مکالمه با post_id
    let link = `/messages?user=${senderId}`;
    if (post_id) link += `&post=${post_id}`;

    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, ?, ?, ?, ?)`,
      [
        receiverId,
        "message",
        "پیام جدید",
        "شما یک پیام جدید دارید",
        link,
      ]
    );

    return NextResponse.json({
      success: true,
      message_id: messageId,
      message: {
        id: messageId,
        text: String(message).trim(),
        sender_id: senderId,
        receiver_id: receiverId,
        post_id: post_id || null,
        is_read: false,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "خطا در ارسال پیام" }, { status: 500 });
  }
}