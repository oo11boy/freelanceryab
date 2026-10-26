// app/api/admin/settings/route.ts
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

async function logAdminAction(adminId: number, action: string, targetType: string, targetId: number, details?: any) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, action, targetType, targetId, details ? JSON.stringify(details) : null]
    );
  } catch (err) { console.error('Admin log error:', err); }
}

// GET /api/admin/settings
export async function GET(request: NextRequest) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const rows = await query(`SELECT \`key\`, \`value\` FROM settings`);
    const settings: Record<string, string> = {};
    for (const row of rows as any[]) {
      settings[row.key] = row.value || '';
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت تنظیمات' }, { status: 500 });
  }
}

// PUT /api/admin/settings
export async function PUT(request: NextRequest) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    if (!(await checkAdmin(adminId))) return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'داده‌های نامعتبر' }, { status: 400 });
    }

    // اعتبارسنجی
    if (settings.post_approval_mode && !['auto', 'manual'].includes(settings.post_approval_mode)) {
      return NextResponse.json({ error: 'حالت تأیید نامعتبر' }, { status: 400 });
    }

    const maxPosts = parseInt(settings.max_posts_per_user);
    if (settings.max_posts_per_user && (isNaN(maxPosts) || maxPosts < 1 || maxPosts > 1000)) {
      return NextResponse.json({ error: 'حداکثر آگهی باید بین ۱ تا ۱۰۰۰ باشد' }, { status: 400 });
    }

    const tokenDays = parseInt(settings.token_expiry_days);
    if (settings.token_expiry_days && (isNaN(tokenDays) || tokenDays < 1 || tokenDays > 365)) {
      return NextResponse.json({ error: 'مدت توکن باید بین ۱ تا ۳۶۵ روز باشد' }, { status: 400 });
    }

    // ذخیره — 🔑 key و value با بک‌تیک
    const allowedKeys = [
      'site_name', 'site_description',
      'contact_phone', 'contact_email',
      'about_text', 'rules_text',
      'post_approval_mode', 'max_posts_per_user', 'banned_words',
      'token_expiry_days',
    ];

    for (const [key, value] of Object.entries(settings)) {
      if (!allowedKeys.includes(key)) continue;

      const strValue = String(value ?? '');

      await query(
        `INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE \`value\` = ?, updated_at = NOW()`,
        [key, strValue, strValue]
      );
    }

    await logAdminAction(adminId, 'update_settings', 'settings', 0, {
      keys: Object.keys(settings),
    });

    return NextResponse.json({ success: true, message: 'تنظیمات ذخیره شد' });
  } catch (error: any) {
    console.error('Admin settings PUT error:', error);
    return NextResponse.json({ error: 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}