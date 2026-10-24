'use client';

let socket: any = null;

export const initializeSocket = (token: string) => {
  if (typeof window === 'undefined') return null;
  if (socket?.connected) return socket;
  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  const { io } = require('socket.io-client');
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  socket.on('connect', () => console.log('✅ Socket connected:', socket?.id));
  socket.on('disconnect', (reason: string) => console.log('❌ Socket disconnected:', reason));
  socket.on('connect_error', (err: Error) => console.error('🔴 Socket error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};