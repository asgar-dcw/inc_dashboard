import express from 'express';
import {
  getCustomizationMetrics,
  getPopularCustomizations,
  getCustomizationTrends,
  getCustomizationsByCategory
} from '../services/queries';

const router = express.Router();

// GET /api/customizations/metrics
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
    const filters = { country, paymentMethod, startDate, endDate };
    const metrics = await getCustomizationMetrics(days, filters);
    // Get popular options
    try {
      const popular = await getPopularCustomizations(5, days, filters);
      metrics.popularOptions = popular.map(p => `${p.optionName}: ${p.optionValue}`).slice(0, 5);
    } catch (error) {
      console.error('Error getting popular customizations:', error);
      metrics.popularOptions = [];
    }
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching customization metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customization metrics',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/customizations/popular
router.get('/popular', async (req, res) => {
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
    const popular = await getPopularCustomizations(limit, days, { country, paymentMethod, startDate, endDate });
    res.json(popular);
  } catch (error: any) {
    console.error('Error fetching popular customizations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch popular customizations',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/customizations/trends
router.get('/trends', async (req, res) => {
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
    const trends = await getCustomizationTrends(days, { country, paymentMethod, startDate, endDate });
    res.json(trends);
  } catch (error: any) {
    console.error('Error fetching customization trends:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customization trends',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/customizations/by-category
router.get('/by-category', async (req, res) => {
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
    const byCategory = await getCustomizationsByCategory(days, { country, paymentMethod, startDate, endDate });
    res.json(byCategory);
  } catch (error: any) {
    console.error('Error fetching customizations by category:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customizations by category',
      message: error.message || 'Unknown error'
    });
  }
});

export default router;

