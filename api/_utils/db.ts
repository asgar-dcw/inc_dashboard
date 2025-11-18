import mysql from 'mysql2/promise';

// Serverless-friendly database connection
// Creates a new connection per request (no pooling for serverless)
export const getConnection = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'dashboard',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mysql',
    connectTimeout: 10000,
  });
  return connection;
};

// Execute query with automatic connection management
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query(query, params);
    return rows as T[];
  } finally {
    await connection.end();
  }
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await getConnection();
    await connection.ping();
    await connection.end();
    return true;
  } catch (error) {
    console.error('[ERROR] Database connection failed:', error);
    return false;
  }
};

