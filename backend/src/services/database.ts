import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mysql',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000, // 10 seconds timeout for remote connections
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('[OK] Database connection successful');
    return true;
  } catch (error) {
    console.error('[ERROR] Database connection failed:', error);
    return false;
  }
};

// Execute query with error handling
// NOTE: Using pool.query() instead of pool.execute() because mysql2 has issues
// with prepared statements when using INTERVAL ? DAY syntax
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  try {
    const [rows] = await pool.query(query, params);
    return rows as T[];
  } catch (error: any) {
    console.error('[ERROR] Query execution failed:', error.message);
    console.error('[ERROR] SQL Error Code:', error.code);
    console.error('[ERROR] SQL Error Number:', error.errno);
    console.error('[ERROR] Query:', query.substring(0, 200) + '...');
    console.error('[ERROR] Params:', params);
    throw error;
  }
};

export default pool;

