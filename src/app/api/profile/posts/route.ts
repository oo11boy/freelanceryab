// app/api/profile/posts/route.ts
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

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';

    let sql = `
      SELECT
        id, title, slug, category, sub_category, price, price_type,
        description, skills, location, images, deadline,
        status, views, created_at, updated_at
      FROM posts
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    if (status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    // 🔑 مرتب‌سازی هوشمند: pending اول، بعد active، ...، expired آخر
    sql += `
      ORDER BY
        CASE status
          WHEN 'pending' THEN 0
          WHEN 'active' THEN 1
          WHEN 'locked' THEN 2
          WHEN 'in_progress' THEN 3
          WHEN 'delivered' THEN 4
          WHEN 'completed' THEN 5
          WHEN 'rejected' THEN 6
          WHEN 'expired' THEN 7
          ELSE 8
        END,
        created_at DESC
    `;

    const posts = await query(sql, params);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    return NextResponse.json({ error: 'خطا در دریافت آگهی‌ها' }, { status: 500 });
  }
}