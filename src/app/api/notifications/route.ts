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

// GET - دریافت اعلانات
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const notifications = await query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );

    const unreadCount = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    return NextResponse.json({ 
      notifications,
      unreadCount: (unreadCount as any[])[0].count 
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'خطا در دریافت اعلانات' }, { status: 500 });
  }
}

// PUT - علامت‌گذاری به عنوان خوانده شده
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const { notification_id, mark_all } = await request.json();
    
    if (mark_all) {
      await query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
        [userId]
      );
    } else if (notification_id) {
      await query(
        'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
        [notification_id, userId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی' }, { status: 500 });
  }
}