// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

function getUserIdFromToken(request: NextRequest): number | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.id;
  } catch {
    return null;
  }
}

// POST — ثبت subscription جدید
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'داده‌های نامعتبر' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent')?.substring(0, 255) || null;

    // چک تکراری
    const existing = (await query(
      'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint]
    )) as any[];

    if (existing.length > 0) {
      await query(
        `UPDATE push_subscriptions
         SET p256dh = ?, auth = ?, user_agent = ?, updated_at = NOW()
         WHERE id = ?`,
        [keys.p256dh, keys.auth, userAgent, existing[0].id]
      );
    } else {
      await query(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, endpoint, keys.p256dh, keys.auth, userAgent]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'خطا در ثبت subscription' }, { status: 500 });
  }
}

// DELETE — حذف subscription
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint الزامی است' }, { status: 400 });
    }

    await query(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'خطا در حذف' }, { status: 500 });
  }
}