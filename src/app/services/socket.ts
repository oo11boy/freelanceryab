// app/services/socket.ts
'use client';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
  // اگر سوکت وجود دارد و متصل است، همان را برگردان
  if (socket?.connected) {
    return socket;
  }

  // اگر سوکت وجود دارد ولی قطع شده، دوباره وصل شو
  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  // ساخت سوکت جدید
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
    auth: {
      token, // ✅ روش استاندارد Socket.io
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('🔴 Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected manually');
  }
};