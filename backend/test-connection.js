// Quick connection test script
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('Testing connection to remote MySQL server...\n');
  console.log('Connection details:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || '3306'}`);
  console.log(`  User: ${process.env.DB_USER || 'root'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'dashboard'}\n`);

  try {
    // First, connect without specifying database to list available databases
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'mysql',
      connectTimeout: 10000,
    });

    console.log('✓ Connected to MySQL server successfully!\n');

    // List available databases
    console.log('Available databases:');
    const [databases] = await connection.query('SHOW DATABASES');
    databases.forEach((db) => {
      console.log(`  - ${db.Database}`);
    });

    // Try to connect to the specified database
    const dbName = process.env.DB_NAME || 'dashboard';
    console.log(`\nAttempting to use database: ${dbName}`);
    
    try {
      await connection.query(`USE ${dbName}`);
      console.log(`✓ Successfully connected to database: ${dbName}`);
      
      // Test a simple query
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`\n✓ Database contains ${tables.length} tables`);
      if (tables.length > 0) {
        console.log('\nFirst 10 tables:');
        tables.slice(0, 10).forEach((table) => {
          const tableName = Object.values(table)[0];
          console.log(`  - ${tableName}`);
        });
      }
    } catch (dbError) {
      console.log(`✗ Cannot access database '${dbName}': ${dbError.message}`);
      console.log('\nPlease update DB_NAME in .env file to one of the available databases above.');
    }

    await connection.end();
    console.log('\n✓ Connection test completed');
  } catch (error) {
    console.error('\n✗ Connection failed:');
    console.error(`  Error: ${error.message}`);
    console.error(`  Code: ${error.code}`);
    console.error(`  Errno: ${error.errno}`);
  }
}

testConnection();

