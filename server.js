
const { createServer } = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'freelanceryab',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const server = createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'socket.io' }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://freelanceryaab.ir',
  'http://freelanceryaab.ir',
  'https://www.freelanceryaab.ir',
  'http://www.freelanceryaab.ir',
];

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'], credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication error: no token'));
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return next(new Error('Server configuration error'));
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id || decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error: invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`🟢 User ${userId} connected`);
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
    socket.broadcast.emit('user_online', { user_id: userId });
  }
  onlineUsers.get(userId).add(socket.id);
  socket.emit('online_users', { user_ids: Array.from(onlineUsers.keys()) });

  socket.on('send_message', async (data) => {
    const { receiver_id, message, post_id } = data;
    if (!receiver_id || !message?.trim()) return socket.emit('message_error', { error: 'پیام نامعتبر' });
    try {
      const [result] = await pool.execute(
        'INSERT INTO messages (sender_id, receiver_id, post_id, message) VALUES (?, ?, ?, ?)',
        [userId, receiver_id, post_id || null, message.trim()]
      );
      const newMessage = {
        id: result.insertId, text: message.trim(), message: message.trim(),
        sender_id: userId, receiver_id, post_id: post_id || null,
        is_read: false, created_at: new Date().toISOString(),
      };
      const r = onlineUsers.get(receiver_id);
      if (r) r.forEach((sid) => io.to(sid).emit('new_message', newMessage));
      const s = onlineUsers.get(userId);
      if (s) s.forEach((sid) => io.to(sid).emit('message_sent', newMessage));
      if (!r || r.size === 0) {
        await pool.execute(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
          [receiver_id, 'message', 'پیام جدید', 'شما یک پیام جدید دارید', '/messages']
        );
      }
    } catch (e) {
      console.error('send_message error:', e);
      socket.emit('message_error', { error: 'خطا در ارسال پیام' });
    }
  });

  socket.on('mark_read', async ({ message_id, sender_id }) => {
    if (!message_id || !sender_id) return;
    try {
      await pool.execute('UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?', [message_id, userId]);
      const s = onlineUsers.get(sender_id);
      if (s) s.forEach((sid) => io.to(sid).emit('message_read', { message_id, conversation_id: userId }));
    } catch (e) { console.error(e); }
  });

  socket.on('mark_conversation_read', async ({ sender_id }) => {
    if (!sender_id) return;
    try {
      await pool.execute('UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE', [userId, sender_id]);
      const s = onlineUsers.get(sender_id);
      if (s) s.forEach((sid) => io.to(sid).emit('conversation_read', { conversation_id: userId }));
    } catch (e) { console.error(e); }
  });

  socket.on('typing', ({ receiver_id, is_typing }) => {
    if (!receiver_id) return;
    const r = onlineUsers.get(receiver_id);
    if (r) r.forEach((sid) => io.to(sid).emit('user_typing', { user_id: userId, is_typing: !!is_typing }));
  });

  socket.on('disconnect', () => {
    const u = onlineUsers.get(userId);
    if (u) {
      u.delete(socket.id);
      if (u.size === 0) {
        onlineUsers.delete(userId);
        socket.broadcast.emit('user_offline', { user_id: userId });
      }
    }
  });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket.io ready on 0.0.0.0:${PORT}`);
  console.log(`DB: ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
});