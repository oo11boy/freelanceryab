// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');
require('dotenv').config();

const PORT = parseInt(process.env.SOCKET_PORT || '3001', 10);
const SOCKET_SECRET = process.env.SOCKET_SECRET || 'dev-secret-change-me';

// ===================================================
// MySQL Pool
// ===================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'freelanceryab',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// ===================================================
// 🔔 Web Push setup
// ===================================================
try {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@freelanceryaab.ir',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('🔔 Web Push ready');
} catch (err) {
  console.error('❌ Web Push setup failed:', err.message);
  console.error('   Check VAPID keys in .env');
}

// 🔑 تابع ارسال Web Push به یک کاربر (همه دستگاه‌هاش)
async function sendWebPush(userId, payload) {
  try {
    const [subs] = await pool.execute(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    if (subs.length === 0) {
      console.log(`   📭 No push subscriptions for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    const notificationPayload = JSON.stringify(payload);
    let sent = 0;
    let failed = 0;

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notificationPayload
        );
        sent++;
      } catch (err) {
        failed++;
        console.error(`   ❌ Push failed (sub ${sub.id}):`, err.statusCode || err.message);

        // اگه subscription منقضی شده، از DB حذف کن
        if (err.statusCode === 410 || err.statusCode === 404) {
          try {
            await pool.execute('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
            console.log(`   🗑️ Removed invalid subscription ${sub.id}`);
          } catch (delErr) {
            console.error('   Delete sub error:', delErr.message);
          }
        }
      }
    }

    console.log(`   📤 Push: ${sent}/${subs.length} devices for user ${userId}`);
    return { sent, failed };
  } catch (err) {
    console.error('sendWebPush error:', err.message);
    return { sent: 0, failed: 0 };
  }
}

// 🔑 تابع ارسال Web Push به چند کاربر
async function sendWebPushToUsers(userIds, payload) {
  const results = [];
  for (const uid of userIds) {
    const res = await sendWebPush(uid, payload);
    results.push({ userId: uid, ...res });
  }
  return results;
}

// ===================================================
// Express app
// ===================================================
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ===================================================
// Endpoint برای Next.js API که رویداد می‌فرسته
// ===================================================
app.post('/api/notify', async (req, res) => {
  const { event, data, secret } = req.body || {};

  if (secret !== SOCKET_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  console.log(`📢 Broadcasting: ${event} → users:`, data?.targetUsers);

  // ارسال به اتاق‌های کاربران هدف
  if (data?.targetUsers && Array.isArray(data.targetUsers)) {
    data.targetUsers.forEach((userId) => {
      io.to(`user_${userId}`).emit(event, data);
    });

    // 🔔 اگه event پیام یا اعلان بود، Web Push هم بفرست
    if (event === 'new_message' || event === 'new_notification') {
      const pushPayload = {
        title: data.title || (event === 'new_message' ? '💬 پیام جدید' : '🔔 اعلان جدید'),
        message: data.message || data.text || 'اعلان جدید',
        link: data.link || '/',
        tag: data.tag || `${event}-${Date.now()}`,
      };

      await sendWebPushToUsers(data.targetUsers, pushPayload);
    }
  } else {
    io.emit(event, data);
  }

  res.json({ success: true });
});

// ===================================================
// Health check
// ===================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'freelanceryab-socket',
    connections: io?.engine?.clientsCount || 0,
    uptime: Math.floor(process.uptime()),
    onlineUsers: onlineUsers.size,
    webPush: !!process.env.VAPID_PRIVATE_KEY,
  });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'socket.io' });
});

// ===================================================
// HTTP server + Socket.io
// ===================================================
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://freelanceryaab.ir',
  'http://freelanceryaab.ir',
  'https://www.freelanceryaab.ir',
  'http://www.freelanceryaab.ir',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// ===================================================
// Map کاربران آنلاین
// ===================================================
const onlineUsers = new Map();

// ===================================================
// Authentication
// ===================================================
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: no token'));
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return next(new Error('Server configuration error: JWT_SECRET missing'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id || decoded.userId;

    if (!socket.userId) {
      return next(new Error('Authentication error: invalid payload'));
    }

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    next(new Error('Authentication error: invalid token'));
  }
});

// ===================================================
// Connection handler
// ===================================================
io.on('connection', async (socket) => {
  const userId = socket.userId;

  console.log(`🟢 User ${userId} connected (socket: ${socket.id})`);

  socket.join(`user_${userId}`);

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
    socket.broadcast.emit('user_online', { user_id: userId });

    try {
      await pool.execute(
        `UPDATE users SET online_status = 1, last_seen_at = NOW() WHERE id = ?`,
        [userId]
      );
    } catch (err) {
      console.error('DB online update error:', err.message);
    }
  }
  onlineUsers.get(userId).add(socket.id);

  socket.emit('online_users', {
    user_ids: Array.from(onlineUsers.keys()),
  });

  // ===================================================
  // 💬 ارسال پیام
  // ===================================================
  socket.on('send_message', async (data) => {
    const { receiver_id, message, post_id } = data || {};

    if (!receiver_id || !message?.trim()) {
      return socket.emit('message_error', { error: 'پیام نامعتبر' });
    }

    try {
      const [result] = await pool.execute(
        `INSERT INTO messages (sender_id, receiver_id, post_id, message)
         VALUES (?, ?, ?, ?)`,
        [userId, receiver_id, post_id || null, message.trim()]
      );

      // 🔑 اسم فرستنده
      let senderName = 'کاربر';
      try {
        const [senderRows] = await pool.execute(
          'SELECT full_name FROM users WHERE id = ?',
          [userId]
        );
        senderName = senderRows[0]?.full_name || 'کاربر';
      } catch {}

      const newMessage = {
        id: result.insertId,
        text: message.trim(),
        message: message.trim(),
        sender_id: userId,
        receiver_id,
        post_id: post_id || null,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      // ارسال به گیرنده (اگه آنلاین باشه)
      io.to(`user_${receiver_id}`).emit('new_message', newMessage);

      // ارسال به خود فرستنده
      socket.emit('message_sent', newMessage);

      // 🔔 اگه گیرنده آنلاین نیست → اعلان + Web Push
      const receiverOnline =
        onlineUsers.has(receiver_id) && onlineUsers.get(receiver_id).size > 0;

      console.log(
        `   💬 Message from ${userId} → ${receiver_id} | online: ${receiverOnline}`
      );

      if (!receiverOnline) {
        let link = `/messages?user=${userId}`;
        if (post_id) link += `&post=${post_id}`;

        // ۱. ذخیره اعلان در DB
        try {
          await pool.execute(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES (?, 'message', 'پیام جدید', ?, ?)`,
            [receiver_id, `پیام جدید از ${senderName}`, link]
          );
        } catch (notifErr) {
          console.error('Notification error:', notifErr.message);
        }

        // ۲. Web Push
        await sendWebPush(receiver_id, {
          title: '💬 پیام جدید',
          message: `${senderName}: ${message.trim().substring(0, 80)}${message.trim().length > 80 ? '...' : ''}`,
          link,
          tag: `message-${userId}-${post_id || 'general'}`,
          icon: '/icons/icon-192.png',
        });
      }
    } catch (err) {
      console.error('send_message error:', err.message);
      socket.emit('message_error', { error: 'خطا در ارسال پیام' });
    }
  });

  // ===================================================
  // ✓ علامت خوانده شدن پیام
  // ===================================================
  socket.on('mark_read', async ({ message_id, sender_id }) => {
    if (!message_id || !sender_id) return;

    try {
      await pool.execute(
        `UPDATE messages SET is_read = TRUE
         WHERE id = ? AND receiver_id = ?`,
        [message_id, userId]
      );

      io.to(`user_${sender_id}`).emit('message_read', {
        message_id,
        conversation_id: userId,
      });
    } catch (err) {
      console.error('mark_read error:', err.message);
    }
  });

  // ===================================================
  // ✓✓ خوانده شدن کل مکالمه
  // ===================================================
  socket.on('mark_conversation_read', async ({ sender_id }) => {
    if (!sender_id) return;

    try {
      await pool.execute(
        `UPDATE messages SET is_read = TRUE
         WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE`,
        [userId, sender_id]
      );

      io.to(`user_${sender_id}`).emit('conversation_read', {
        conversation_id: userId,
      });
    } catch (err) {
      console.error('mark_conversation_read error:', err.message);
    }
  });

  // ===================================================
  // ⌨️ در حال تایپ
  // ===================================================
  socket.on('typing', ({ receiver_id, is_typing }) => {
    if (!receiver_id) return;

    io.to(`user_${receiver_id}`).emit('user_typing', {
      user_id: userId,
      is_typing: !!is_typing,
    });
  });

  // ===================================================
  // 🔔 رویداد قرارداد
  // ===================================================
  socket.on('contract_event', (data) => {
    console.log(`📢 contract_event from user ${userId}: ${data?.event}`);

    if (data?.targetUsers && Array.isArray(data.targetUsers)) {
      data.targetUsers.forEach((targetId) => {
        io.to(`user_${targetId}`).emit('contract_event', data);
      });
    }
  });

  // ===================================================
  // 🔌 قطع اتصال
  // ===================================================
  socket.on('disconnect', async (reason) => {
    console.log(`🔴 User ${userId} disconnected (${reason})`);

    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);

      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit('user_offline', { user_id: userId });

        try {
          await pool.execute(
            `UPDATE users SET online_status = 0, last_seen_at = NOW() WHERE id = ?`,
            [userId]
          );
        } catch (err) {
          console.error('DB offline update error:', err.message);
        }
      }
    }
  });
});

// ===================================================
// Start
// ===================================================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket.io ready on 0.0.0.0:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(
    `   DB: ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`
  );
  console.log(
    `   Web Push: ${process.env.VAPID_PRIVATE_KEY ? '✅ enabled' : '❌ disabled (VAPID_PRIVATE_KEY missing)'}`
  );
});

// ===================================================
// Graceful shutdown
// ===================================================
const shutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received, shutting down...`);

  io.close(() => {
    server.close(async () => {
      try {
        await pool.end();
      } catch (err) {
        console.error('Pool close error:', err.message);
      }
      console.log('✅ Shutdown complete');
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ===================================================
// Error handling
// ===================================================
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled rejection:', reason);
});