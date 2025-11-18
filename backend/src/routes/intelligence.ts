import express from 'express';
import advancedQueries from '../services/advanced-queries.js';
import advancedQueries2 from '../services/advanced-queries-part2.js';
import pipelineForecast from '../services/pipeline-forecast.js';

const router = express.Router();

// ============================================
// BUSINESS HEALTH & INTELLIGENCE ENDPOINTS
// ============================================

// GET /api/intelligence/business-health
router.get('/business-health', async (req, res) => {
  try {
    const healthScore = await advancedQueries.getBusinessHealthScore();
    res.json(healthScore);
  } catch (error: any) {
    console.error('Error fetching business health:', error);
    res.status(500).json({ 
      error: 'Failed to fetch business health',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/critical-alerts
router.get('/critical-alerts', async (req, res) => {
  try {
    const alerts = await advancedQueries.getCriticalAlerts();
    res.json(alerts);
  } catch (error: any) {
    console.error('Error fetching critical alerts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch critical alerts',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/quick-wins
router.get('/quick-wins', async (req, res) => {
  try {
    const opportunities = await advancedQueries.getQuickWins();
    res.json(opportunities);
  } catch (error: any) {
    console.error('Error fetching quick wins:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quick wins',
      message: error.message || 'Unknown error'
    });
  }
});

// ============================================
// CUSTOMER RETENTION ENDPOINTS
// ============================================

// GET /api/intelligence/retention-metrics
router.get('/retention-metrics', async (req, res) => {
  try {
    const metrics = await advancedQueries.getCustomerRetentionMetrics();
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching retention metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch retention metrics',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/customer-ltv
router.get('/customer-ltv', async (req, res) => {
  try {
    const ltvData = await advancedQueries.getCustomerLTV();
    res.json(ltvData);
  } catch (error: any) {
    console.error('Error fetching customer LTV:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer LTV',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/at-risk-customers
router.get('/at-risk-customers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const atRiskCustomers = await advancedQueries.getAtRiskCustomers(limit);
    res.json(atRiskCustomers);
  } catch (error: any) {
    console.error('Error fetching at-risk customers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch at-risk customers',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/time-to-second-purchase
router.get('/time-to-second-purchase', async (req, res) => {
  try {
    const timeData = await advancedQueries.getTimeToSecondPurchase();
    res.json(timeData);
  } catch (error: any) {
    console.error('Error fetching time to second purchase:', error);
    res.status(500).json({ 
      error: 'Failed to fetch time to second purchase',
      message: error.message || 'Unknown error'
    });
  }
});

// ============================================
// B2B INTELLIGENCE ENDPOINTS
// ============================================

// GET /api/intelligence/b2b-analysis
router.get('/b2b-analysis', async (req, res) => {
  try {
    const b2bData = await advancedQueries.identifyB2BCustomers();
    res.json(b2bData);
  } catch (error: any) {
    console.error('Error fetching B2B analysis:', error);
    res.status(500).json({ 
      error: 'Failed to fetch B2B analysis',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/top-b2b-customers
router.get('/top-b2b-customers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const topB2B = await advancedQueries.getTopB2BCustomers(limit);
    res.json(topB2B);
  } catch (error: any) {
    console.error('Error fetching top B2B customers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top B2B customers',
      message: error.message || 'Unknown error'
    });
  }
});

// ============================================
// PRODUCT CATALOG HEALTH ENDPOINTS
// ============================================

// GET /api/intelligence/catalog-health
router.get('/catalog-health', async (req, res) => {
  try {
    const catalogHealth = await advancedQueries2.getProductCatalogHealth();
    res.json(catalogHealth);
  } catch (error: any) {
    console.error('Error fetching catalog health:', error);
    res.status(500).json({ 
      error: 'Failed to fetch catalog health',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/dead-products
router.get('/dead-products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const deadProducts = await advancedQueries2.getDeadProducts(limit);
    res.json(deadProducts);
  } catch (error: any) {
    console.error('Error fetching dead products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dead products',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/product-lifecycle
router.get('/product-lifecycle', async (req, res) => {
  try {
    const lifecycleMatrix = await advancedQueries2.getProductLifecycleMatrix();
    res.json(lifecycleMatrix);
  } catch (error: any) {
    console.error('Error fetching product lifecycle:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product lifecycle',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/pipeline-forecast
router.get('/pipeline-forecast', async (req, res) => {
  try {
    const forecast = await pipelineForecast.getPipelineForecast();
    res.json(forecast);
  } catch (error: any) {
    console.error('Error fetching pipeline forecast:', error);
    res.status(500).json({
      error: 'Failed to fetch pipeline forecast',
      message: error.message || 'Unknown error',
    });
  }
});

// ============================================
// REVENUE INTELLIGENCE ENDPOINTS
// ============================================

// GET /api/intelligence/new-vs-repeat-revenue
router.get('/new-vs-repeat-revenue', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const revenueData = await advancedQueries2.getNewVsRepeatRevenue(days);
    res.json(revenueData);
  } catch (error: any) {
    console.error('Error fetching new vs repeat revenue:', error);
    res.status(500).json({ 
      error: 'Failed to fetch new vs repeat revenue',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/monthly-revenue (formerly monthly-recurring-revenue)
// Note: Changed from "recurring" to reflect e-commerce business model (not subscription-based)
router.get('/monthly-revenue', async (req, res) => {
  try {
    const monthlyRevenueData = await advancedQueries2.getMonthlyRecurringRevenue(); // Query function name unchanged for compatibility
    res.json(monthlyRevenueData);
  } catch (error: any) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({ 
      error: 'Failed to fetch monthly revenue',
      message: error.message || 'Unknown error'
    });
  }
});

// Legacy endpoint for backward compatibility (deprecated)
router.get('/monthly-recurring-revenue', async (req, res) => {
  try {
    const monthlyRevenueData = await advancedQueries2.getMonthlyRecurringRevenue();
    res.json(monthlyRevenueData);
  } catch (error: any) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({ 
      error: 'Failed to fetch monthly revenue',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/revenue-by-segment
router.get('/revenue-by-segment', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const segmentRevenue = await advancedQueries2.getRevenueBySegment(days);
    res.json(segmentRevenue);
  } catch (error: any) {
    console.error('Error fetching revenue by segment:', error);
    res.status(500).json({ 
      error: 'Failed to fetch revenue by segment',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/order-value-distribution
router.get('/order-value-distribution', async (req, res) => {
  try {
    const distribution = await advancedQueries2.getOrderValueDistribution();
    res.json(distribution);
  } catch (error: any) {
    console.error('Error fetching order value distribution:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order value distribution',
      message: error.message || 'Unknown error'
    });
  }
});

// GET /api/intelligence/monthly-revenue-trend
router.get('/monthly-revenue-trend', async (req, res) => {
  try {
    const trend = await advancedQueries2.getMonthlyRevenueTrend();
    res.json(trend);
  } catch (error: any) {
    console.error('Error fetching monthly revenue trend:', error);
    res.status(500).json({
      error: 'Failed to fetch monthly revenue trend',
      message: error.message || 'Unknown error'
    });
  }
});

// ============================================
// STRATEGIC RECOMMENDATIONS ENDPOINT
// ============================================

// GET /api/intelligence/recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await advancedQueries2.getStrategicRecommendations();
    res.json(recommendations);
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recommendations',
      message: error.message || 'Unknown error'
    });
  }
});

// ============================================
// COMBINED EXECUTIVE DASHBOARD ENDPOINT
// ============================================

// GET /api/intelligence/executive-dashboard
router.get('/executive-dashboard', async (req, res) => {
  try {
    const [
      healthScore,
      alerts,
      quickWins,
      retentionMetrics,
      catalogHealth,
      recommendations
    ] = await Promise.all([
      advancedQueries.getBusinessHealthScore(),
      advancedQueries.getCriticalAlerts(),
      advancedQueries.getQuickWins(),
      advancedQueries.getCustomerRetentionMetrics(),
      advancedQueries2.getProductCatalogHealth(),
      advancedQueries2.getStrategicRecommendations()
    ]);

    res.json({
      healthScore,
      alerts,
      quickWins,
      retentionMetrics,
      catalogHealth,
      recommendations
    });
  } catch (error: any) {
    console.error('Error fetching executive dashboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch executive dashboard',
      message: error.message || 'Unknown error'
    });
  }
});

export default router;

