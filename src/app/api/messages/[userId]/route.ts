// app/api/messages/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserIdFromToken, unauthorized } from '@/lib/auth';

// -------------------------------------------------
// GET - دریافت پیام‌های یک مکالمه
// -------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // ✅ Promise در Next.js 15+
) {
  try {
    const currentUserId = getUserIdFromToken(request);
    if (!currentUserId) return unauthorized();

    // ✅ await params
    const { userId } = await params;
    const otherUserId = parseInt(userId, 10);

    if (isNaN(otherUserId)) {
      return NextResponse.json(
        { error: 'شناسه کاربر نامعتبر است' },
        { status: 400 }
      );
    }

    if (otherUserId === currentUserId) {
      return NextResponse.json(
        { error: 'نمی‌توانید با خودتان مکالمه داشته باشید' },
        { status: 400 }
      );
    }

    // بررسی وجود کاربر مقابل
    const otherUser = await query(
      'SELECT id, full_name, avatar, online_status FROM users WHERE id = ?',
      [otherUserId]
    );
    if (!(otherUser as any[]).length) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // دریافت پیام‌های مکالمه (بدون JOIN اضافی)
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
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC
       LIMIT 500`,
      [currentUserId, otherUserId, otherUserId, currentUserId]
    );

    // علامت‌گذاری پیام‌های دریافتی به عنوان خوانده‌شده
    await query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE`,
      [otherUserId, currentUserId]
    );

    return NextResponse.json({
      messages,
      other_user: (otherUser as any[])[0],
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت پیام‌ها' },
      { status: 500 }
    );
  }
}