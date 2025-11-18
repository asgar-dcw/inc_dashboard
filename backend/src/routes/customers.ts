import express from 'express';
import {
  getCustomerOverview,
  getCustomerSegments,
  getCustomerGrowth,
  getTopCustomers
} from '../services/queries.js';

const router = express.Router();

// GET /api/customers/overview
router.get('/overview', async (req, res) => {
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
    const overview = await getCustomerOverview(days, { country, paymentMethod, startDate, endDate });
    res.json(overview);
  } catch (error: any) {
    console.error('Error fetching customer overview:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer overview',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/customers/segments
router.get('/segments', async (req, res) => {
  try {
    const segments = await getCustomerSegments();
    res.json(segments);
  } catch (error: any) {
    console.error('Error fetching customer segments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer segments',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/customers/growth
router.get('/growth', async (req, res) => {
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
    const growth = await getCustomerGrowth(days, { country, paymentMethod, startDate, endDate });
    res.json(growth);
  } catch (error: any) {
    console.error('Error fetching customer growth:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer growth',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/customers/top
router.get('/top', async (req, res) => {
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
    const customers = await getTopCustomers(limit, days, { country, paymentMethod, startDate, endDate });
    res.json(customers);
  } catch (error: any) {
    console.error('Error fetching top customers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top customers',
      message: error.message || 'Unknown error'
    });
  }
});

export default router;

