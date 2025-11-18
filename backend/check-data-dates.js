// Check actual date ranges in the database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDataDates() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectTimeout: 10000,
    });

    console.log('=== CHECKING DATA DATE RANGES ===\n');

    // Check sales_order dates
    const [salesDates] = await connection.query(`
      SELECT 
        MIN(created_at) as earliest_order,
        MAX(created_at) as latest_order,
        COUNT(*) as total_orders,
        COUNT(DISTINCT customer_id) as unique_customers,
        SUM(base_grand_total) as total_revenue
      FROM sales_order
      WHERE status NOT IN ('canceled', 'closed')
    `);

    console.log('📊 SALES ORDER DATA:');
    console.log(`  Total Orders: ${salesDates[0].total_orders.toLocaleString()}`);
    console.log(`  Unique Customers: ${salesDates[0].unique_customers.toLocaleString()}`);
    console.log(`  Total Revenue: $${parseFloat(salesDates[0].total_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`  Earliest Order: ${salesDates[0].earliest_order}`);
    console.log(`  Latest Order: ${salesDates[0].latest_order}`);

    // Check orders in last 30 days
    const [recent30] = await connection.query(`
      SELECT COUNT(*) as count_30d
      FROM sales_order
      WHERE status NOT IN ('canceled', 'closed')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    console.log(`  Orders in last 30 days: ${recent30[0].count_30d}`);

    // Check orders in last 365 days
    const [recent365] = await connection.query(`
      SELECT COUNT(*) as count_365d
      FROM sales_order
      WHERE status NOT IN ('canceled', 'closed')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)
    `);
    console.log(`  Orders in last 365 days: ${recent365[0].count_365d}\n`);

    // Check product views dates
    const [viewDates] = await connection.query(`
      SELECT 
        MIN(added_at) as earliest_view,
        MAX(added_at) as latest_view,
        COUNT(*) as total_views
      FROM report_viewed_product_index
    `);

    console.log('👁️ PRODUCT VIEWS DATA:');
    console.log(`  Total Views: ${viewDates[0].total_views.toLocaleString()}`);
    console.log(`  Earliest View: ${viewDates[0].earliest_view}`);
    console.log(`  Latest View: ${viewDates[0].latest_view}\n`);

    // Check recent orders by month
    const [monthlyOrders] = await connection.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as orders,
        SUM(base_grand_total) as revenue
      FROM sales_order
      WHERE status NOT IN ('canceled', 'closed')
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `);

    console.log('📅 RECENT MONTHLY ORDERS (Last 12 months):');
    monthlyOrders.forEach(row => {
      console.log(`  ${row.month}: ${row.orders} orders, $${parseFloat(row.revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    });

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDataDates();

