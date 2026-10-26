// app/services/socket.ts
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

  if (process.env.NODE_ENV === 'development') {
    socket.on('connect', () =>
      console.log('✅ Socket connected:', socket?.id)
    );
    socket.on('disconnect', (reason: string) =>
      console.log('❌ Socket disconnected:', reason)
    );
    socket.on('connect_error', (err: Error) =>
      console.error('🔴 Socket error:', err.message)
    );
  }

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

// ================================================
// Contract event helpers
// ================================================
export interface ContractEventData {
  event: 'contract_updated' | 'post_locked' | 'post_unlocked';
  contractId?: number;
  postId: number;
  clientId: number;
  freelancerId: number;
  status?: 'in_progress' | 'delivered' | 'completed' | 'cancelled';
}

export const emitContractEvent = (data: ContractEventData) => {
  if (!socket?.connected) return;
  socket.emit('contract_event', {
    ...data,
    targetUsers: [data.clientId, data.freelancerId],
  });
};

export const joinUserRoom = (userId: number) => {
  if (socket?.connected) {
    socket.emit('join_user_room', { user_id: userId });
  }
};