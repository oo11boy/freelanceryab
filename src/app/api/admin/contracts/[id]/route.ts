// app/api/admin/contracts/[id]/route.ts
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

async function logAdminAction(
  adminId: number,
  action: string,
  targetType: string,
  targetId: number,
  details?: any
) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [adminId, action, targetType, targetId, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('Admin log error:', err);
  }
}

// GET /api/admin/contracts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }
    if (!(await checkAdmin(adminId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
    }

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const contracts = await query(
      `SELECT
        c.*,
        p.title AS post_title, p.id AS post_id,
        p.price AS post_price, p.status AS post_status,
        cl.id AS client_id, cl.full_name AS client_name, cl.phone AS client_phone,
        cl.rating AS client_rating, cl.completed_projects AS client_projects,
        fr.id AS freelancer_id, fr.full_name AS freelancer_name, fr.phone AS freelancer_phone,
        fr.rating AS freelancer_rating, fr.completed_projects AS freelancer_projects,
        DATEDIFF(NOW(), c.started_at) AS days_active
       FROM contracts c
       LEFT JOIN posts p ON c.post_id = p.id
       LEFT JOIN users cl ON c.client_id = cl.id
       LEFT JOIN users fr ON c.freelancer_id = fr.id
       WHERE c.id = ?`,
      [contractId]
    );

    const contract = (contracts as any[])[0];
    if (!contract) {
      return NextResponse.json({ error: 'قرارداد یافت نشد' }, { status: 404 });
    }

    // پیام‌های بین طرفین (برای بررسی اختلاف)
    const messages = await query(
      `SELECT
        m.id, m.sender_id, m.receiver_id, m.message, m.is_read, m.created_at,
        u.full_name AS sender_name
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE (
         (m.sender_id = ? AND m.receiver_id = ?) OR
         (m.sender_id = ? AND m.receiver_id = ?)
       )
       AND (m.post_id = ? OR m.post_id IS NULL)
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [
        contract.client_id, contract.freelancer_id,
        contract.freelancer_id, contract.client_id,
        contract.post_id,
      ]
    );

    // نظرات این قرارداد
    const reviews = await query(
      `SELECT
        r.id, r.rating, r.comment, r.created_at,
        r.reviewer_id, u.full_name AS reviewer_name,
        r.reviewee_id, uu.full_name AS reviewee_name
       FROM reviews r
       LEFT JOIN users u ON r.reviewer_id = u.id
       LEFT JOIN users uu ON r.reviewee_id = uu.id
       WHERE r.contract_id = ?
       ORDER BY r.created_at DESC`,
      [contractId]
    );

    return NextResponse.json({
      contract,
      messages,
      reviews,
    });
  } catch (error: any) {
    console.error('Admin contract GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت قرارداد' }, { status: 500 });
  }
}

// PUT /api/admin/contracts/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }
    if (!(await checkAdmin(adminId))) {
      return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
    }

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) {
      return NextResponse.json({ error: 'شناسه نامعتبر' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    const contracts = await query(
      'SELECT id, status, client_id, freelancer_id, post_id FROM contracts WHERE id = ?',
      [contractId]
    );
    const contract = (contracts as any[])[0];
    if (!contract) {
      return NextResponse.json({ error: 'قرارداد یافت نشد' }, { status: 404 });
    }

    // 🔑 تغییر وضعیت دستی (مداخله)
    if (action === 'change-status') {
      const { status, note } = body;
      const validStatuses = ['in_progress', 'delivered', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'وضعیت نامعتبر' }, { status: 400 });
      }

      // تعیین timestamp مناسب
      let updateSQL = 'UPDATE contracts SET status = ?';
      const updateParams: any[] = [status];

      if (status === 'delivered') {
        updateSQL += ', delivered_at = NOW()';
      } else if (status === 'completed') {
        updateSQL += ', completed_at = NOW()';
      }

      updateSQL += ' WHERE id = ?';
      updateParams.push(contractId);

      await query(updateSQL, updateParams);

      await logAdminAction(adminId, 'change_contract_status', 'contract', contractId, {
        from: contract.status,
        to: status,
        note: note || null,
      });

      // 🔔 اعلان به هر دو طرف
      try {
        const notifMsg = `وضعیت قرارداد توسط ادمین به «${statusLabel(status)}» تغییر کرد.${note ? ` دلیل: ${note}` : ''}`;
        for (const uid of [contract.client_id, contract.freelancer_id]) {
          await query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES (?, 'system', '🔔 تغییر وضعیت قرارداد', ?, ?)`,
            [uid, notifMsg, `/post/${contract.post_id}`]
          );
        }
      } catch (notifErr) {
        console.error('Notification error:', notifErr);
      }

      return NextResponse.json({ success: true, message: 'وضعیت قرارداد تغییر کرد' });
    }

    // 🔑 علامت‌گذاری «نیاز به بررسی»
    if (action === 'toggle-review') {
      const { note } = body;
      const newValue = contract.status === 'x' ? 0 : (body.needs_review ? 1 : 0);

      await query(
        `UPDATE contracts
         SET needs_review = ?,
             admin_note = ?,
             reviewed_by = CASE WHEN ? = 1 THEN ? ELSE NULL END,
             reviewed_at = CASE WHEN ? = 1 THEN NOW() ELSE NULL END
         WHERE id = ?`,
        [newValue, note || null, newValue, adminId, newValue, contractId]
      );

      await logAdminAction(adminId, 'toggle_contract_review', 'contract', contractId, {
        needs_review: newValue,
        note: note || null,
      });

      return NextResponse.json({
        success: true,
        needs_review: !!newValue,
        message: newValue ? 'علامت‌گذاری شد' : 'علامت برداشته شد',
      });
    }

    // 🔑 ذخیره یادداشت ادمین
    if (action === 'save-note') {
      const { note } = body;
      await query(
        'UPDATE contracts SET admin_note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
        [note || null, adminId, contractId]
      );

      await logAdminAction(adminId, 'save_contract_note', 'contract', contractId, {
        note: note || null,
      });

      return NextResponse.json({ success: true, message: 'یادداشت ذخیره شد' });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin contract PUT error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی' }, { status: 500 });
  }
}

function statusLabel(s: string): string {
  return s === 'in_progress' ? 'در جریان'
    : s === 'delivered' ? 'تحویل'
    : s === 'completed' ? 'تکمیل'
    : s === 'cancelled' ? 'لغو'
    : s;
}