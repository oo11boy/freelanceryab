// app/api/admin/categories/[id]/route.ts
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

// GET — یک دسته
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const { id } = await params;
    const catId = parseInt(id);
    if (isNaN(catId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

    const cats = await query('SELECT * FROM categories WHERE id = ?', [catId]);
    const category = (cats as any[])[0];
    if (!category) return NextResponse.json({ error: 'دسته یافت نشد' }, { status: 404 });

    const subs = await query(
      'SELECT * FROM subcategories WHERE category_id = ? ORDER BY sort_order ASC',
      [catId]
    );

    return NextResponse.json({ category, subcategories: subs });
  } catch (error: any) {
    return NextResponse.json({ error: 'خطا' }, { status: 500 });
  }
}

// PUT — ویرایش
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const { id } = await params;
    const catId = parseInt(id);
    if (isNaN(catId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

    const body = await request.json();
    const { slug, name, db_name, icon, color, description, sort_order, is_active, subcategories } = body;

    const cats = await query('SELECT * FROM categories WHERE id = ?', [catId]);
    const existing = (cats as any[])[0];
    if (!existing) return NextResponse.json({ error: 'دسته یافت نشد' }, { status: 404 });

    // چک تکراری (به‌جز خودش)
    if (slug || db_name) {
      const dup = await query(
        'SELECT id FROM categories WHERE (slug = ? OR db_name = ?) AND id != ?',
        [slug || existing.slug, db_name || existing.db_name, catId]
      );
      if ((dup as any[]).length > 0) {
        return NextResponse.json({ error: 'slug یا db_name تکراری' }, { status: 409 });
      }
    }

    // آپدیت
    await query(
      `UPDATE categories SET
        slug = COALESCE(?, slug),
        name = COALESCE(?, name),
        db_name = COALESCE(?, db_name),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        description = COALESCE(?, description),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        slug?.trim() || null,
        name?.trim() || null,
        db_name?.trim() || null,
        icon?.trim() || null,
        color?.trim() || null,
        description?.trim() ?? null,
        sort_order !== undefined ? parseInt(sort_order) : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        catId,
      ]
    );

    // آپدیت زیردسته‌ها (اگه فرستاده شده)
    if (Array.isArray(subcategories)) {
      // حذف قبلی‌ها و درج جدید
      await query('DELETE FROM subcategories WHERE category_id = ?', [catId]);
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

    await logAdminAction(adminId, 'update_category', 'category', catId, { name, slug });
    return NextResponse.json({ success: true, message: 'دسته به‌روزرسانی شد' });
  } catch (error: any) {
    console.error('Admin category PUT error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی' }, { status: 500 });
  }
}

// DELETE — حذف
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const { id } = await params;
    const catId = parseInt(id);
    if (isNaN(catId)) return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });

    const cats = await query('SELECT * FROM categories WHERE id = ?', [catId]);
    const existing = (cats as any[])[0];
    if (!existing) return NextResponse.json({ error: 'دسته یافت نشد' }, { status: 404 });

    // چک آگهی‌های وابسته
    const [postsCount] = await query(
      'SELECT COUNT(*) AS count FROM posts WHERE category = ?',
      [existing.db_name]
    );
    const count = Number((postsCount as any).count || 0);

    if (count > 0) {
      return NextResponse.json(
        { error: `این دسته ${count} آگهی دارد. ابتدا آگهی‌ها را منتقل یا حذف کنید، یا دسته را غیرفعال کنید.` },
        { status: 409 }
      );
    }

    await query('DELETE FROM categories WHERE id = ?', [catId]);
    await logAdminAction(adminId, 'delete_category', 'category', catId, { name: existing.name });

    return NextResponse.json({ success: true, message: 'دسته حذف شد' });
  } catch (error: any) {
    console.error('Admin category DELETE error:', error);
    return NextResponse.json({ error: 'خطا در حذف' }, { status: 500 });
  }
}