import express from 'express';
import {
  getProductPerformance,
  getProductViews,
  getSearchAnalytics,
  getProductMetrics,
  getTopViewedNotPurchased
} from '../services/queries';

const router = express.Router();

// GET /api/products/performance
router.get('/performance', async (req, res) => {
  try {
    const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const limit = limitRaw !== undefined && !Number.isNaN(limitRaw) ? limitRaw : 20;
    const daysRaw = typeof req.query.days === 'string' ? parseInt(req.query.days, 10) : undefined;
    const days = daysRaw !== undefined && !Number.isNaN(daysRaw) ? daysRaw : undefined;
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
    const performance = await getProductPerformance(limit, days, { country, paymentMethod, startDate, endDate });
    res.json(performance);
  } catch (error: any) {
    console.error('Error fetching product performance:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product performance',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/products/metrics
router.get('/metrics', async (req, res) => {
  try {
    const daysRaw = typeof req.query.days === 'string' ? parseInt(req.query.days, 10) : undefined;
    const days = daysRaw !== undefined && !Number.isNaN(daysRaw) ? daysRaw : undefined;
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

    const metrics = await getProductMetrics(days, { country, paymentMethod, startDate, endDate });
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching product metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch product metrics',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/products/top-unpurchased
router.get('/top-unpurchased', async (req, res) => {
  try {
    const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const limit = limitRaw !== undefined && !Number.isNaN(limitRaw) ? limitRaw : 10;
    const daysRaw = typeof req.query.days === 'string' ? parseInt(req.query.days, 10) : undefined;
    const days = daysRaw !== undefined && !Number.isNaN(daysRaw) ? daysRaw : undefined;
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

    const products = await getTopViewedNotPurchased(limit, days, {
      country,
      paymentMethod,
      startDate,
      endDate
    });
    res.json(products);
  } catch (error: any) {
    console.error('Error fetching top unpurchased products:', error);
    res.status(500).json({
      error: 'Failed to fetch top unpurchased products',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/products/views
router.get('/views', async (req, res) => {
  try {
    const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const limit = limitRaw !== undefined && !Number.isNaN(limitRaw) ? limitRaw : 20;
    const daysRaw = typeof req.query.days === 'string' ? parseInt(req.query.days, 10) : undefined;
    const days = daysRaw !== undefined && !Number.isNaN(daysRaw) ? daysRaw : undefined;
    const views = await getProductViews(limit, days);
    res.json(views);
  } catch (error: any) {
    console.error('Error fetching product views:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product views',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/products/search-analytics
router.get('/search-analytics', async (req, res) => {
  try {
    const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const limit = limitRaw !== undefined && !Number.isNaN(limitRaw) ? limitRaw : 20;
    const daysRaw = typeof req.query.days === 'string' ? parseInt(req.query.days, 10) : undefined;
    const days = daysRaw !== undefined && !Number.isNaN(daysRaw) ? daysRaw : undefined;
    const analytics = await getSearchAnalytics(limit, days);
    res.json(analytics);
  } catch (error: any) {
    console.error('Error fetching search analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch search analytics',
      message: error.message || 'Unknown error'
    });
  }
});

export default router;

