// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/categories — لیست دسته‌بندی‌ها با زیردسته‌ها
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const includeInactive = sp.get('include_inactive') === '1';

    const whereActive = includeInactive ? '' : 'WHERE c.is_active = 1';

    const categories = await query(
      `SELECT
        c.id, c.slug, c.name, c.db_name, c.icon, c.color,
        c.description, c.sort_order, c.is_active
       FROM categories c
       ${whereActive}
       ORDER BY c.sort_order ASC, c.id ASC`
    );

    const subsWhereActive = includeInactive ? '' : 'AND s.is_active = 1';
    const subcategories = await query(
      `SELECT id, category_id, name, sort_order, is_active
       FROM subcategories s
       WHERE 1=1 ${subsWhereActive}
       ORDER BY s.sort_order ASC, s.id ASC`
    );

    // ترکیب
    const cats = (categories as any[]).map((c) => ({
      ...c,
      sub: (subcategories as any[])
        .filter((s) => s.category_id === c.id)
        .map((s) => s.name),
      subcategories: (subcategories as any[]).filter((s) => s.category_id === c.id),
    }));

    return NextResponse.json({ categories: cats });
  } catch (error: any) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت دسته‌بندی‌ها' }, { status: 500 });
  }
}