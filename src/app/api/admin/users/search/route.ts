// app/api/admin/users/search/route.ts
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

async function checkAdmin(userId: number): Promise<boolean> {
  const users = await query('SELECT role FROM users WHERE id = ?', [userId]);
  const user = (users as any[])[0];
  return user?.role === 'admin';
}

// GET /api/admin/users/search?q=...&limit=10
export async function GET(request: NextRequest) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const sp = request.nextUrl.searchParams;
    const q = sp.get('q')?.trim() || '';
    const limit = Math.min(20, Math.max(1, parseInt(sp.get('limit') || '10', 10)));

    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const users = await query(
      `SELECT id, full_name, phone, role, is_active
       FROM users
       WHERE (full_name LIKE ? OR phone LIKE ?)
       ORDER BY full_name ASC
       LIMIT ?`,
      [`%${q}%`, `%${q}%`, limit]
    );

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Admin user search error:', error);
    return NextResponse.json({ error: 'خطا در جستجوی کاربر' }, { status: 500 });
  }
}