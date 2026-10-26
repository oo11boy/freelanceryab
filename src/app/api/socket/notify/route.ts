// app/api/socket/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SOCKET_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
const SOCKET_SECRET = process.env.SOCKET_SECRET || 'dev-secret-change-me';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json(
        { error: 'event and data required' },
        { status: 400 }
      );
    }

    // فوروارد به socket server
    const response = await fetch(`${SOCKET_URL}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        data,
        secret: SOCKET_SECRET,
      }),
    });

    if (!response.ok) {
      console.error('Socket notify failed:', await response.text());
      return NextResponse.json({ error: 'notify failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Socket notify error:', error);
    return NextResponse.json(
      { error: error.message || 'notify failed' },
      { status: 500 }
    );
  }
}