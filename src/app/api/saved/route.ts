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

// GET - دریافت لیست علاقه‌مندی‌ها
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const posts = await query(
      `SELECT p.*, u.full_name as user_name, u.rating 
       FROM saved_posts sp
       JOIN posts p ON sp.post_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE sp.user_id = ?
       ORDER BY sp.created_at DESC`,
      [userId]
    );

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Get saved posts error:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست' }, { status: 500 });
  }
}

// POST - افزودن به علاقه‌مندی‌ها
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const { post_id } = await request.json();
    
    if (!post_id) {
      return NextResponse.json({ error: 'شناسه آگهی الزامی است' }, { status: 400 });
    }

    // بررسی وجود آگهی
    const posts = await query('SELECT id FROM posts WHERE id = ?', [post_id]);
    if ((posts as any[]).length === 0) {
      return NextResponse.json({ error: 'آگهی یافت نشد' }, { status: 404 });
    }

    // افزودن به علاقه‌مندی‌ها
    await query(
      'INSERT IGNORE INTO saved_posts (user_id, post_id) VALUES (?, ?)',
      [userId, post_id]
    );

    return NextResponse.json({ success: true, message: 'به علاقه‌مندی‌ها اضافه شد' });
  } catch (error) {
    console.error('Add saved post error:', error);
    return NextResponse.json({ error: 'خطا در افزودن' }, { status: 500 });
  }
}

// DELETE - حذف از علاقه‌مندی‌ها
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const post_id = searchParams.get('post_id');
    
    if (!post_id) {
      return NextResponse.json({ error: 'شناسه آگهی الزامی است' }, { status: 400 });
    }

    await query(
      'DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?',
      [userId, post_id]
    );

    return NextResponse.json({ success: true, message: 'از علاقه‌مندی‌ها حذف شد' });
  } catch (error) {
    console.error('Remove saved post error:', error);
    return NextResponse.json({ error: 'خطا در حذف' }, { status: 500 });
  }
}