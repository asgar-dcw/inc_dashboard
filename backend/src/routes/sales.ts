import express from 'express';
import {
  getSalesOverview,
  getSalesTrends,
  getTopProducts,
  getCategoryPerformance,
  getHourlySales,
  getSalesFilterOptions
} from '../services/queries';
import { executeQuery } from '../services/database';
import pool from '../services/database';

const router = express.Router();

// Version check endpoint
router.get('/version-check', (req, res) => {
  res.json({ 
    version: '2.0-INTERVAL-FIX',
    timestamp: new Date().toISOString(),
    message: 'New code is loaded!'
  });
});

// Test with pool.query instead of pool.execute
router.get('/top-products-test2', async (req, res) => {
  try {
    const days = 30;
    const limit = 10;
    
    const query = `
      SELECT 
        soi.product_id,
        soi.sku,
        MAX(soi.name) as product_name,
        COUNT(DISTINCT soi.order_id) as sales,
        SUM(soi.row_total) as revenue
      FROM sales_order_item soi
      INNER JOIN sales_order so ON soi.order_id = so.entity_id
      WHERE so.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
        AND so.status NOT IN ('canceled', 'closed')
      GROUP BY soi.product_id, soi.sku
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;
    
    const [results] = await pool.query(query);
    res.json({ 
      success: true, 
      count: results.length,
      method: 'pool.query (no prepared statement)',
      data: results.slice(0, 3)
    });
  } catch (error: any) {
    res.json({ 
      success: false, 
      error: error.message,
      sqlMessage: error.sqlMessage
    });
  }
});

// GET /api/sales/overview
router.get('/overview', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const country =
      typeof req.query.country === 'string' && req.query.country !== 'All'
        ? req.query.country
        : undefined;
    const paymentMethod =
      typeof req.query.paymentMethod === 'string' && req.query.paymentMethod !== 'All'
        ? req.query.paymentMethod
        : undefined;
    const startDate =
      typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate =
      typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const overview = await getSalesOverview(days, { country, paymentMethod, startDate, endDate });
    res.json(overview);
  } catch (error: any) {
    console.error('Error fetching sales overview:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sales overview',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/sales/trends
router.get('/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const country =
      typeof req.query.country === 'string' && req.query.country !== 'All'
        ? req.query.country
        : undefined;
    const paymentMethod =
      typeof req.query.paymentMethod === 'string' && req.query.paymentMethod !== 'All'
        ? req.query.paymentMethod
        : undefined;
    const startDate =
      typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate =
      typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const trends = await getSalesTrends(days, { country, paymentMethod, startDate, endDate });
    res.json(trends);
  } catch (error: any) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sales trends',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/sales/top-products-test (Direct SQL test)
router.get('/top-products-test', async (req, res) => {
  try {
    const days = 30;
    const limit = 10;
    
    // Direct query test - using template literal for INTERVAL to avoid mysql2 prepared statement issues
    const query = `
      SELECT 
        soi.product_id,
        soi.sku,
        MAX(soi.name) as product_name,
        COUNT(DISTINCT soi.order_id) as sales,
        SUM(soi.row_total) as revenue
      FROM sales_order_item soi
      INNER JOIN sales_order so ON soi.order_id = so.entity_id
      WHERE so.created_at >= DATE_SUB(NOW(), INTERVAL ${parseInt(String(days))} DAY)
        AND so.status NOT IN ('canceled', 'closed')
      GROUP BY soi.product_id, soi.sku
      ORDER BY revenue DESC
      LIMIT ?
    `;
    
    const results = await executeQuery(query, [limit]);
    res.json({ 
      success: true, 
      count: results.length,
      params: { days, limit },
      data: results.slice(0, 3) // Return first 3 for brevity
    });
  } catch (error: any) {
    res.json({ 
      success: false, 
      error: error.message,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage
    });
  }
});

// GET /api/sales/top-products
router.get('/top-products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const days = parseInt(req.query.days as string) || 30;
    const country =
      typeof req.query.country === 'string' && req.query.country !== 'All'
        ? req.query.country
        : undefined;
    const paymentMethod =
      typeof req.query.paymentMethod === 'string' && req.query.paymentMethod !== 'All'
        ? req.query.paymentMethod
        : undefined;
    const startDate =
      typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate =
      typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    console.log(`[TOP PRODUCTS] Requesting limit=${limit}, days=${days}`);
    const products = await getTopProducts(limit, days, { country, paymentMethod, startDate, endDate });
    console.log(`[TOP PRODUCTS] Returned ${products.length} products`);
    res.json(products);
  } catch (error: any) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top products',
      message: error.message || 'Unknown error',
      details: error.toString()
    });
  }
});

// GET /api/sales/categories
router.get('/categories', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const country =
      typeof req.query.country === 'string' && req.query.country !== 'All'
        ? req.query.country
        : undefined;
    const paymentMethod =
      typeof req.query.paymentMethod === 'string' && req.query.paymentMethod !== 'All'
        ? req.query.paymentMethod
        : undefined;
    const startDate =
      typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate =
      typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const categories = await getCategoryPerformance(days, { country, paymentMethod, startDate, endDate });
    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching category performance:', error);
    res.status(500).json({ 
      error: 'Failed to fetch category performance',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/sales/hourly
router.get('/hourly', async (req, res) => {
  try {
    const date = (req.query.date as string) || 'today';
    const hourly = await getHourlySales(date);
    res.json(hourly);
  } catch (error: any) {
    console.error('Error fetching hourly sales:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hourly sales',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/sales/filters
router.get('/filters', async (_req, res) => {
  try {
    const filters = await getSalesFilterOptions();
    res.json(filters);
  } catch (error: any) {
    console.error('Error fetching sales filters:', error);
    res.status(500).json({
      error: 'Failed to fetch sales filters',
      message: error.message || 'Unknown error',
    });
  }
});

export default router;

