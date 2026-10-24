// app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromToken, unauthorized } from '@/lib/auth';

// -------------------------------------------------
// GET - دریافت لیست مکالمات
// -------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) return unauthorized();

    // 🔑 کوئری اصلاح‌شده با subqueryهای امن
    const conversations = await query(
      `SELECT
        other_user.id           AS user_id,
        other_user.full_name    AS user_name,
        other_user.avatar       AS user_avatar,
        other_user.online_status,
        last_msg.message        AS last_message,
        last_msg.created_at     AS last_message_time,
        COALESCE(unread.cnt, 0) AS unread_count
      FROM (
        SELECT
          CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user_id,
          MAX(id) AS last_message_id
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY other_user_id
      ) AS conv
      JOIN users AS other_user
        ON other_user.id = conv.other_user_id
      JOIN messages AS last_msg
        ON last_msg.id = conv.last_message_id
      LEFT JOIN (
        SELECT sender_id, COUNT(*) AS cnt
        FROM messages
        WHERE receiver_id = ? AND is_read = FALSE
        GROUP BY sender_id
      ) AS unread
        ON unread.sender_id = other_user.id
      ORDER BY last_msg.created_at DESC`,
      [userId, userId, userId, userId]
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت مکالمات' },
      { status: 500 }
    );
  }
}

// -------------------------------------------------
// POST - ارسال پیام جدید (fallback REST)
// -------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const senderId = getUserIdFromToken(request);
    if (!senderId) return unauthorized();

    const body = await request.json();
    const { receiver_id, post_id, message } = body;

    // اعتبارسنجی
    if (!receiver_id || !message || !String(message).trim()) {
      return NextResponse.json(
        { error: 'گیرنده و متن پیام الزامی است' },
        { status: 400 }
      );
    }

    const receiverId = parseInt(String(receiver_id), 10);
    if (isNaN(receiverId)) {
      return NextResponse.json(
        { error: 'شناسه گیرنده نامعتبر است' },
        { status: 400 }
      );
    }

    if (receiverId === senderId) {
      return NextResponse.json(
        { error: 'نمی‌توانید به خودتان پیام بفرستید' },
        { status: 400 }
      );
    }

    // بررسی وجود گیرنده
    const receiverExists = await query(
      'SELECT id FROM users WHERE id = ? AND is_active = 1',
      [receiverId]
    );
    if (!(receiverExists as any[]).length) {
      return NextResponse.json(
        { error: 'کاربر گیرنده یافت نشد' },
        { status: 404 }
      );
    }

    // درج پیام
    const result = await query(
      `INSERT INTO messages (sender_id, receiver_id, post_id, message)
       VALUES (?, ?, ?, ?)`,
      [senderId, receiverId, post_id || null, String(message).trim()]
    );

    const messageId = (result as any).insertId;

    // اعلان برای گیرنده (لینک به مکالمه، نه /messages)
    await query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, ?, ?, ?, ?)`,
      [
        receiverId,
        'message',
        'پیام جدید',
        'شما یک پیام جدید دارید',
        `/messages?user=${senderId}`,
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
        is_read: false,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'خطا در ارسال پیام' },
      { status: 500 }
    );
  }
}