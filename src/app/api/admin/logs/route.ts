// app/api/admin/logs/route.ts
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

// GET /api/admin/logs
export async function GET(request: NextRequest) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '30', 10)));
    const offset = (page - 1) * limit;
    const action = sp.get('action') || '';

    const whereParts: string[] = [];
    const params: any[] = [];

    if (action) {
      whereParts.push('l.action LIKE ?');
      params.push(`%${action}%`);
    }

    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const logs = await query(
      `SELECT
        l.id, l.admin_id, l.action, l.target_type, l.target_id,
        l.details, l.ip_address, l.created_at,
        u.full_name AS admin_name
       FROM admin_logs l
       LEFT JOIN users u ON l.admin_id = u.id
       ${whereSQL}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [totalRows] = await query(
      `SELECT COUNT(*) AS count FROM admin_logs l ${whereSQL}`,
      params
    );

    return NextResponse.json({
      logs,
      pagination: {
        page, limit,
        total: Number((totalRows as any).count || 0),
        pages: Math.ceil(Number((totalRows as any).count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin logs GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت لاگ‌ها' }, { status: 500 });
  }
}