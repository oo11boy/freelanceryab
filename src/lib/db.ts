// lib/db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'freelanceryab',
  waitForConnections: true,
  connectionLimit: 15,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000,
  timezone: '+00:00',
  charset: 'utf8mb4',
  dateStrings: false,
});

// 🔑 جلوگیری از کرش روی خطای connection
(pool as any).on('connection', (connection: any) => {
  connection.on('error', (err: any) => {
    console.error('MySQL connection error:', err.message);
  });
});

// 🔑 جلوگیری از کرش روی خطای pool
(pool as any).on('error', (err: any) => {
  console.error('MySQL pool error:', err.message);
});

export async function query(sql: string, params?: any[]) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error: any) {
    console.error('Database error:', error.message);
    throw error;
  }
}

export async function transaction(
  callback: (connection: mysql.PoolConnection) => Promise<any>
) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;