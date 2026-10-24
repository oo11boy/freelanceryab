// lib/auth.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id: number;
  phone?: string;
  role?: string;
}

export function getUserIdFromToken(request: NextRequest): number | null {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set');
      return null;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded.id || null;
  } catch (error) {
    console.error('JWT verify error:', error);
    return null;
  }
}

export function unauthorized() {
  return Response.json({ error: 'احراز هویت نشده' }, { status: 401 });
}