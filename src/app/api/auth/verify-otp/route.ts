// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'شماره موبایل و کد تأیید الزامی است' },
        { status: 400 }
      );
    }

    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: 'شماره موبایل معتبر نیست' },
        { status: 400 }
      );
    }

    const otpRecords = await query(
      `SELECT * FROM otp_codes
       WHERE phone = ? AND code = ? AND is_used = FALSE
       AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );

    const otp = (otpRecords as any[])[0];

    if (!otp) {
      return NextResponse.json(
        { error: 'کد تأیید نامعتبر یا منقضی شده است' },
        { status: 400 }
      );
    }

    await query('UPDATE otp_codes SET is_used = TRUE WHERE id = ?', [otp.id]);

    let users = await query('SELECT * FROM users WHERE phone = ?', [phone]);
    let user = (users as any[])[0];
    let isNewUser = false;

    if (!user) {
      const result = await query('INSERT INTO users (phone) VALUES (?)', [
        phone,
      ]);
      const insertId = (result as any).insertId;
      users = await query('SELECT * FROM users WHERE id = ?', [insertId]);
      user = (users as any[])[0];
      isNewUser = true;
    }

    const needsProfileCompletion =
      !user.full_name || !String(user.full_name).trim();

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    delete user.password;
    delete user.password_hash;

    return NextResponse.json({
      success: true,
      token,
      user,
      isNewUser,
      needsProfileCompletion,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'خطا در تأیید کد' }, { status: 500 });
  }
}