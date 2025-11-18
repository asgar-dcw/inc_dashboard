import express from 'express';
import {
  getRecentActivity,
  getDashboardMetrics,
  getSalesOverview,
  getCustomerOverview,
  getCustomizationMetrics,
  getSalesFilterOptions,
} from '../services/queries';

const router = express.Router();

// GET /api/dashboard/activity
router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activity = await getRecentActivity(limit);
    res.json(activity);
  } catch (error: any) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent activity',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/dashboard/metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getDashboardMetrics();
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard metrics',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/dashboard/filters
router.get('/filters', async (_req, res) => {
  try {
    const filters = await getSalesFilterOptions();
    res.json(filters);
  } catch (error: any) {
    console.error('Error fetching dashboard filters:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard filters',
      message: error.message || 'Unknown error',
    });
  }
});

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const [sales, customers, customizations] = await Promise.all([
      getSalesOverview(days),
      getCustomerOverview(days),
      getCustomizationMetrics(days)
    ]);
    
    res.json({
      sales,
      customers,
      customizations
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;

