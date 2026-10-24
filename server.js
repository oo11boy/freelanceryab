// server.js - فقط Socket.io، بدون Next.js
const { createServer } = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

// -------------------------------------------------
// اتصال به دیتابیس
// -------------------------------------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'freelanceryab',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// -------------------------------------------------
// سرور HTTP ساده (بدون Next.js)
// -------------------------------------------------
const server = createServer((req, res) => {
  // یک endpoint ساده برای health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'socket.io' }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://10.203.104.213:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ذخیره کاربران آنلاین
const onlineUsers = new Map();

// -------------------------------------------------
// Middleware احراز هویت
// -------------------------------------------------
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ No token provided');
      return next(new Error('Authentication error: no token'));
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.log('❌ JWT_SECRET not set');
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id || decoded.userId;
    console.log(`✅ Auth OK for user ${socket.userId}`);
    next();
  } catch (err) {
    console.log('❌ Auth failed:', err.message);
    next(new Error('Authentication error: invalid token'));
  }
});

// -------------------------------------------------
// اتصال‌ها
// -------------------------------------------------
io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`🟢 User ${userId} connected (socket ${socket.id})`);

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
    socket.broadcast.emit('user_online', { user_id: userId });
  }
  onlineUsers.get(userId).add(socket.id);

  socket.emit('online_users', {
    user_ids: Array.from(onlineUsers.keys()),
  });

  // ارسال پیام
  socket.on('send_message', async (data) => {
    const { receiver_id, message, post_id } = data;
    if (!receiver_id || !message?.trim()) {
      socket.emit('message_error', { error: 'پیام نامعتبر است' });
      return;
    }

    try {
      const [result] = await pool.execute(
        'INSERT INTO messages (sender_id, receiver_id, post_id, message) VALUES (?, ?, ?, ?)',
        [userId, receiver_id, post_id || null, message.trim()]
      );

      const newMessage = {
        id: result.insertId,
        text: message.trim(),
        message: message.trim(),
        sender_id: userId,
        receiver_id: receiver_id,
        post_id: post_id || null,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const receiverSockets = onlineUsers.get(receiver_id);
      if (receiverSockets) {
        receiverSockets.forEach((sid) => {
          io.to(sid).emit('new_message', newMessage);
        });
      }

      const senderSockets = onlineUsers.get(userId);
      if (senderSockets) {
        senderSockets.forEach((sid) => {
          io.to(sid).emit('message_sent', newMessage);
        });
      }

      if (!receiverSockets || receiverSockets.size === 0) {
        await pool.execute(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [receiver_id, 'message', 'پیام جدید', 'شما یک پیام جدید دارید', '/messages']
        );
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('message_error', { error: 'خطا در ارسال پیام' });
    }
  });

  // علامت خوانده شدن
  socket.on('mark_read', async (data) => {
    const { message_id, sender_id } = data;
    if (!message_id || !sender_id) return;

    try {
      await pool.execute(
        'UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?',
        [message_id, userId]
      );

      const senderSockets = onlineUsers.get(sender_id);
      if (senderSockets) {
        senderSockets.forEach((sid) => {
          io.to(sid).emit('message_read', {
            message_id,
            conversation_id: userId,
          });
        });
      }
    } catch (error) {
      console.error('❌ Error marking read:', error);
    }
  });

  // علامت خوانده شدن کل مکالمه
  socket.on('mark_conversation_read', async (data) => {
    const { sender_id } = data;
    if (!sender_id) return;

    try {
      await pool.execute(
        'UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE',
        [userId, sender_id]
      );

      const senderSockets = onlineUsers.get(sender_id);
      if (senderSockets) {
        senderSockets.forEach((sid) => {
          io.to(sid).emit('conversation_read', { conversation_id: userId });
        });
      }
    } catch (error) {
      console.error('❌ Error marking conversation read:', error);
    }
  });

  // تایپ کردن
  socket.on('typing', (data) => {
    const { receiver_id, is_typing } = data;
    if (!receiver_id) return;

    const receiverSockets = onlineUsers.get(receiver_id);
    if (receiverSockets) {
      receiverSockets.forEach((sid) => {
        io.to(sid).emit('user_typing', {
          user_id: userId,
          is_typing: !!is_typing,
        });
      });
    }
  });

  // قطع اتصال
  socket.on('disconnect', (reason) => {
    console.log(`🔴 User ${userId} disconnected (socket ${socket.id}): ${reason}`);

    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        socket.broadcast.emit('user_offline', { user_id: userId });
      }
    }
  });
});

// -------------------------------------------------
// راه‌اندازی سرور
// -------------------------------------------------
const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`> 🚀 Socket.io server ready on http://localhost:${PORT}`);
});