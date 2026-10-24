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
    
    let sql = 'SELECT * FROM posts WHERE user_id = ?';
    const params: any[] = [userId];
    
    if (status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const posts = await query(sql, params);
    
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    return NextResponse.json({ error: 'خطا در دریافت آگهی‌ها' }, { status: 500 });
  }
}