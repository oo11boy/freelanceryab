// app/api/admin/categories/route.ts
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
  return (users as any[])[0]?.role === 'admin';
}

async function logAdminAction(adminId: number, action: string, targetType: string, targetId: number, details?: any) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, action, targetType, targetId, details ? JSON.stringify(details) : null]
    );
  } catch (err) { console.error('Admin log error:', err); }
}

// GET — لیست کامل
export async function GET(request: NextRequest) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const categories = await query(
      `SELECT
        c.id, c.slug, c.name, c.db_name, c.icon, c.color,
        c.description, c.sort_order, c.is_active, c.created_at,
        (SELECT COUNT(*) FROM posts WHERE posts.category = c.db_name) AS posts_count
       FROM categories c
       ORDER BY c.sort_order ASC, c.id ASC`
    );

    const subcategories = await query(
      `SELECT
        s.id, s.category_id, s.name, s.sort_order, s.is_active,
        (SELECT COUNT(*) FROM posts WHERE posts.sub_category = s.name) AS posts_count
       FROM subcategories s
       ORDER BY s.sort_order ASC, s.id ASC`
    );

    const cats = (categories as any[]).map((c) => ({
      ...c,
      sub: (subcategories as any[])
        .filter((s) => s.category_id === c.id)
        .map((s) => s.name),
      subcategories: (subcategories as any[]).filter((s) => s.category_id === c.id),
    }));

    return NextResponse.json({ categories: cats });
  } catch (error: any) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت' }, { status: 500 });
  }
}

// POST — ساخت دسته‌بندی جدید
export async function POST(request: NextRequest) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const body = await request.json();
    const { slug, name, db_name, icon, color, description, sort_order, subcategories } = body;

    if (!slug?.trim() || !name?.trim() || !db_name?.trim()) {
      return NextResponse.json({ error: 'slug، name و db_name الزامی است' }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(slug.trim())) {
      return NextResponse.json({ error: 'slug فقط حروف انگلیسی کوچک، عدد و خط تیره' }, { status: 400 });
    }

    // چک تکراری
    const existing = await query(
      'SELECT id FROM categories WHERE slug = ? OR db_name = ?',
      [slug.trim(), db_name.trim()]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'این slug یا db_name قبلاً ثبت شده' }, { status: 409 });
    }

    const result = await query(
      `INSERT INTO categories (slug, name, db_name, icon, color, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        slug.trim(),
        name.trim(),
        db_name.trim(),
        icon?.trim() || '📁',
        color?.trim() || 'gray',
        description?.trim() || null,
        parseInt(sort_order) || 0,
      ]
    );

    const catId = (result as any).insertId;

    // زیردسته‌ها
    if (Array.isArray(subcategories)) {
      for (let i = 0; i < subcategories.length; i++) {
        const sub = subcategories[i];
        const subName = typeof sub === 'string' ? sub : sub?.name;
        if (!subName?.trim()) continue;
        await query(
          `INSERT INTO subcategories (category_id, name, sort_order) VALUES (?, ?, ?)`,
          [catId, subName.trim(), i + 1]
        );
      }
    }

    await logAdminAction(adminId, 'create_category', 'category', catId, { name, slug });

    return NextResponse.json({ success: true, id: catId }, { status: 201 });
  } catch (error: any) {
    console.error('Admin categories POST error:', error);
    return NextResponse.json({ error: 'خطا در ساخت' }, { status: 500 });
  }
}