import { executeQuery } from './database';

// ============================================
// BUSINESS HEALTH & INTELLIGENCE QUERIES
// ============================================

/**
 * Calculate overall business health score (0-100)
 * Based on: retention rate, revenue growth, product health, customer satisfaction
 */
export const getBusinessHealthScore = async () => {
  try {
    // Get key metrics for scoring
    const [metrics] = await executeQuery<any>(`
      SELECT 
        (SELECT COUNT(*) FROM customer_entity) as total_customers,
        (SELECT COUNT(DISTINCT customer_id) 
         FROM sales_order 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
           AND status NOT IN ('canceled', 'closed')) as active_customers_90d,
        (SELECT SUM(base_grand_total) 
         FROM sales_order 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           AND status NOT IN ('canceled', 'closed')) as revenue_30d,
        (SELECT SUM(base_grand_total) 
         FROM sales_order 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
           AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
           AND status NOT IN ('canceled', 'closed')) as revenue_prev_30d,
        (SELECT COUNT(DISTINCT product_id) 
         FROM sales_order_item soi
         INNER JOIN sales_order so ON soi.order_id = so.entity_id
         WHERE so.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
           AND so.status NOT IN ('canceled', 'closed')) as active_products_90d
    `);

    const totalCustomers = parseInt(metrics?.total_customers || '0');
    const activeCustomers = parseInt(metrics?.active_customers_90d || '0');
    const revenue30d = parseFloat(metrics?.revenue_30d || '0');
    const revenuePrev30d = parseFloat(metrics?.revenue_prev_30d || '0');
    const activeProducts = parseInt(metrics?.active_products_90d || '0');

    // Calculate component scores
    const retentionScore = Math.min((activeCustomers / totalCustomers) * 1000, 25); // Max 25 points
    const growthScore = revenuePrev30d > 0 
      ? Math.min(((revenue30d - revenuePrev30d) / revenuePrev30d) * 100 + 12.5, 25) 
      : 12.5; // Max 25 points
    const productHealthScore = Math.min((activeProducts / 10000) * 25, 25); // Max 25 points
    const revenueScore = Math.min((revenue30d / 5000000) * 25, 25); // Max 25 points

    const totalScore = Math.round(retentionScore + growthScore + productHealthScore + revenueScore);
    
    // Determine grade
    let grade = 'F';
    if (totalScore >= 90) grade = 'A+';
    else if (totalScore >= 85) grade = 'A';
    else if (totalScore >= 80) grade = 'A-';
    else if (totalScore >= 75) grade = 'B+';
    else if (totalScore >= 70) grade = 'B';
    else if (totalScore >= 65) grade = 'B-';
    else if (totalScore >= 60) grade = 'C+';
    else if (totalScore >= 55) grade = 'C';
    else if (totalScore >= 50) grade = 'C-';
    else if (totalScore >= 45) grade = 'D';

    return {
      score: totalScore,
      maxScore: 100,
      grade,
      components: {
        retention: Math.round(retentionScore),
        growth: Math.round(growthScore),
        productHealth: Math.round(productHealthScore),
        revenue: Math.round(revenueScore)
      },
      status: totalScore >= 75 ? 'healthy' : totalScore >= 50 ? 'warning' : 'critical'
    };
  } catch (error) {
    console.error('Error calculating business health score:', error);
    return {
      score: 0,
      maxScore: 100,
      grade: 'N/A',
      components: { retention: 0, growth: 0, productHealth: 0, revenue: 0 },
      status: 'unknown'
    };
  }
};

/**
 * Get critical business alerts
 */
export const getCriticalAlerts = async () => {
  try {
    const alerts = [];

    // Alert 1: Check retention rate
    const [retentionData] = await executeQuery<any>(`
      SELECT 
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(DISTINCT CASE 
          WHEN order_count > 1 THEN customer_id 
        END) as repeat_customers
      FROM (
        SELECT customer_id, COUNT(*) as order_count
        FROM sales_order
        WHERE status NOT IN ('canceled', 'closed')
        GROUP BY customer_id
      ) as customer_orders
    `);

    const totalCustomers = parseInt(retentionData?.total_customers || '0');
    const repeatCustomers = parseInt(retentionData?.repeat_customers || '0');
    const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    if (retentionRate < 10) {
      const lostRevenue = (totalCustomers - repeatCustomers) * 500; // Estimate
      alerts.push({
        id: 'retention-critical',
        severity: 'critical',
        title: 'Critical Customer Retention Problem',
        description: `${(100 - retentionRate).toFixed(1)}% of customers only buy once`,
        impact: `Potential Revenue Loss: $${(lostRevenue / 1000000).toFixed(1)}M+`,
        action: 'Launch re-engagement campaign',
        metric: retentionRate,
        category: 'customer'
      });
    }

    // Alert 2: Check for VIP customers
    const [vipData] = await executeQuery<any>(`
      SELECT COUNT(*) as vip_count
      FROM (
        SELECT customer_id, COUNT(*) as order_count
        FROM sales_order
        WHERE status NOT IN ('canceled', 'closed')
        GROUP BY customer_id
        HAVING order_count >= 20
      ) as vip_customers
    `);

    const vipCount = parseInt(vipData?.vip_count || '0');
    if (vipCount < 50) {
      alerts.push({
        id: 'vip-low',
        severity: 'warning',
        title: 'Low VIP Customer Count',
        description: `Only ${vipCount} customers with 20+ orders`,
        impact: 'Opportunity: Develop VIP program',
        action: 'Create trade account tiers',
        metric: vipCount,
        category: 'customer'
      });
    }

    // Alert 3: Check dead products
    const [deadProductData] = await executeQuery<any>(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(DISTINCT soi.product_id) as sold_products
      FROM catalog_product_entity cpe
      LEFT JOIN sales_order_item soi ON cpe.entity_id = soi.product_id
    `);

    const totalProducts = parseInt(deadProductData?.total_products || '0');
    const soldProducts = parseInt(deadProductData?.sold_products || '0');
    const deadProducts = totalProducts - soldProducts;
    const deadPercentage = totalProducts > 0 ? (deadProducts / totalProducts) * 100 : 0;

    if (deadPercentage > 50) {
      alerts.push({
        id: 'catalog-bloat',
        severity: 'warning',
        title: 'Massive Catalog Bloat',
        description: `${deadProducts.toLocaleString()} products (${deadPercentage.toFixed(1)}%) never sold`,
        impact: `Cost Impact: $${((deadProducts * 20) / 1000).toFixed(0)}K+ in carrying costs`,
        action: 'Phase out dead inventory',
        metric: deadPercentage,
        category: 'product'
      });
    }

    return alerts;
  } catch (error) {
    console.error('Error getting critical alerts:', error);
    return [];
  }
};

/**
 * Get quick win opportunities
 */
export const getQuickWins = async () => {
  try {
    const opportunities = [];

    // Opportunity 1: Inactive customer email campaign
    const [inactiveCustomers] = await executeQuery<any>(`
      SELECT COUNT(DISTINCT ce.entity_id) as inactive_count
      FROM customer_entity ce
      LEFT JOIN sales_order so ON ce.entity_id = so.customer_id
        AND so.created_at >= DATE_SUB(NOW(), INTERVAL 180 DAY)
      WHERE so.entity_id IS NULL
        AND ce.created_at < DATE_SUB(NOW(), INTERVAL 180 DAY)
    `);

    const inactiveCount = parseInt(inactiveCustomers?.inactive_count || '0');
    if (inactiveCount > 1000) {
      opportunities.push({
        id: 'email-campaign',
        title: `Email ${(inactiveCount / 1000).toFixed(0)}K+ inactive customers`,
        impact: `Est. +$${((inactiveCount * 0.05 * 500) / 1000).toFixed(0)}K in 30 days`,
        effort: 'Low',
        timeframe: 'This week',
        roi: '500%+'
      });
    }

    // Opportunity 2: Catalog cleanup from live counts
    const [catalogStats] = await executeQuery<any>(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(DISTINCT sold.product_id) as sold_products
      FROM catalog_product_entity cpe
      LEFT JOIN sales_order_item sold ON cpe.entity_id = sold.product_id
    `);

    const totalProducts = parseInt(catalogStats?.total_products || '0');
    const soldProducts = parseInt(catalogStats?.sold_products || '0');
    const deadProducts = totalProducts - soldProducts;

    if (deadProducts > 500) {
      const estimatedSavings = deadProducts * 20;
      opportunities.push({
        id: 'catalog-cleanup',
        title: `Hide ${deadProducts.toLocaleString()} dead products`,
        impact: `Save ~$${(estimatedSavings / 1000).toFixed(0)}K in carrying costs`,
        effort: 'Low',
        timeframe: 'This month',
        roi: 'Efficiency + UX',
      });
    }

    // Opportunity 3: Reactivate at-risk VIPs
    const atRiskHighValue = await executeQuery<any>(`
      SELECT COUNT(*) as at_risk
      FROM (
        SELECT 
          customer_id,
          SUM(base_grand_total) as lifetime_value,
          DATEDIFF(NOW(), MAX(created_at)) as days_since_last_order
        FROM sales_order
        WHERE status NOT IN ('canceled', 'closed') AND customer_id IS NOT NULL
        GROUP BY customer_id
        HAVING lifetime_value > 5000 AND days_since_last_order BETWEEN 90 AND 365
      ) as at_risk_customers
    `);

    const atRiskCount = parseInt(atRiskHighValue[0]?.at_risk || '0');
    if (atRiskCount > 0) {
      opportunities.push({
        id: 'vip-outreach',
        title: `Call ${atRiskCount.toLocaleString()} at-risk VIP customers`,
        impact: 'Protect $5K+ lifetime value accounts',
        effort: 'Medium',
        timeframe: 'This week',
        roi: 'High retention',
      });
    }

    return opportunities;
  } catch (error) {
    console.error('Error getting quick wins:', error);
    return [];
  }
};

// ============================================
// CUSTOMER RETENTION & LIFETIME VALUE QUERIES
// ============================================

/**
 * Calculate detailed customer retention metrics
 */
export const getCustomerRetentionMetrics = async () => {
  try {
    // Get retention breakdown
    // Note: 'repeat' is a reserved keyword in MySQL, so we use backticks
    const [retentionData] = await executeQuery<any>(`
      SELECT 
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN order_count = 1 THEN customer_id END) as one_time,
        COUNT(DISTINCT CASE WHEN order_count BETWEEN 2 AND 4 THEN customer_id END) as \`repeat\`,
        COUNT(DISTINCT CASE WHEN order_count BETWEEN 5 AND 9 THEN customer_id END) as regular,
        COUNT(DISTINCT CASE WHEN order_count BETWEEN 10 AND 19 THEN customer_id END) as loyal,
        COUNT(DISTINCT CASE WHEN order_count >= 20 THEN customer_id END) as vip
      FROM (
        SELECT customer_id, COUNT(*) as order_count
        FROM sales_order
        WHERE status NOT IN ('canceled', 'closed') AND customer_id IS NOT NULL
        GROUP BY customer_id
      ) as customer_orders
    `);

    const totalCustomers = parseInt(retentionData?.total_customers || '0');
    const oneTime = parseInt(retentionData?.one_time || '0');
    const repeat = parseInt(retentionData?.['repeat'] || retentionData?.repeat || '0');
    const regular = parseInt(retentionData?.regular || '0');
    const loyal = parseInt(retentionData?.loyal || '0');
    const vip = parseInt(retentionData?.vip || '0');

    const retentionRate = totalCustomers > 0 
      ? ((totalCustomers - oneTime) / totalCustomers) * 100 
      : 0;

    return {
      retentionRate: parseFloat(retentionRate.toFixed(2)),
      churnRate: parseFloat((100 - retentionRate).toFixed(2)),
      totalCustomers,
      segments: {
        oneTime: { count: oneTime, percentage: (oneTime / totalCustomers * 100).toFixed(2) },
        repeat: { count: repeat, percentage: (repeat / totalCustomers * 100).toFixed(2) },
        regular: { count: regular, percentage: (regular / totalCustomers * 100).toFixed(2) },
        loyal: { count: loyal, percentage: (loyal / totalCustomers * 100).toFixed(2) },
        vip: { count: vip, percentage: (vip / totalCustomers * 100).toFixed(2) }
      }
    };
  } catch (error) {
    console.error('Error getting retention metrics:', error);
    return {
      retentionRate: 0,
      churnRate: 100,
      totalCustomers: 0,
      segments: {
        oneTime: { count: 0, percentage: '0' },
        repeat: { count: 0, percentage: '0' },
        regular: { count: 0, percentage: '0' },
        loyal: { count: 0, percentage: '0' },
        vip: { count: 0, percentage: '0' }
      }
    };
  }
};

/**
 * Get customer lifetime value by segment
 */
export const getCustomerLTV = async () => {
  try {
    const ltvData = await executeQuery<any>(`
      SELECT 
        CASE 
          WHEN order_count >= 20 THEN 'VIP'
          WHEN order_count >= 10 THEN 'Loyal'
          WHEN order_count >= 5 THEN 'Regular'
          WHEN order_count >= 2 THEN 'Repeat'
          ELSE 'One-time'
        END as segment,
        AVG(total_spent) as avg_ltv,
        SUM(total_spent) as total_revenue,
        COUNT(*) as customer_count
      FROM (
        SELECT 
          customer_id,
          COUNT(*) as order_count,
          SUM(base_grand_total) as total_spent
        FROM sales_order
        WHERE status NOT IN ('canceled', 'closed') AND customer_id IS NOT NULL
        GROUP BY customer_id
      ) as customer_stats
      GROUP BY segment
      ORDER BY 
        CASE segment
          WHEN 'VIP' THEN 1
          WHEN 'Loyal' THEN 2
          WHEN 'Regular' THEN 3
          WHEN 'Repeat' THEN 4
          ELSE 5
        END
    `);

    return ltvData.map((row: any) => ({
      segment: row.segment,
      avgLTV: parseFloat(row.avg_ltv || '0'),
      totalRevenue: parseFloat(row.total_revenue || '0'),
      customerCount: parseInt(row.customer_count || '0')
    }));
  } catch (error) {
    console.error('Error getting customer LTV:', error);
    return [];
  }
};

/**
 * Identify at-risk high-value customers
 */
export const getAtRiskCustomers = async (limit: number = 20) => {
  try {
    const atRiskCustomers = await executeQuery<any>(`
      SELECT 
        ce.entity_id as customer_id,
        ce.email,
        COUNT(so.entity_id) as total_orders,
        SUM(so.base_grand_total) as lifetime_value,
        MAX(so.created_at) as last_order_date,
        DATEDIFF(NOW(), MAX(so.created_at)) as days_since_last_order
      FROM customer_entity ce
      INNER JOIN sales_order so ON ce.entity_id = so.customer_id
      WHERE so.status NOT IN ('canceled', 'closed')
      GROUP BY ce.entity_id, ce.email
      HAVING lifetime_value > 5000
        AND days_since_last_order BETWEEN 90 AND 365
      ORDER BY lifetime_value DESC
      LIMIT ?
    `, [limit]);

    return atRiskCustomers.map((row: any) => ({
      customerId: row.customer_id,
      email: row.email,
      totalOrders: parseInt(row.total_orders || '0'),
      lifetimeValue: parseFloat(row.lifetime_value || '0'),
      lastOrderDate: row.last_order_date,
      daysSinceLastOrder: parseInt(row.days_since_last_order || '0'),
      riskLevel: parseInt(row.days_since_last_order || '0') > 180 ? 'high' : 'medium'
    }));
  } catch (error) {
    console.error('Error getting at-risk customers:', error);
    return [];
  }
};

/**
 * Calculate time to second purchase distribution
 */
export const getTimeToSecondPurchase = async () => {
  try {
    const timeData = await executeQuery<any>(`
      SELECT 
        CASE 
          WHEN days_to_second <= 30 THEN '0-30 days'
          WHEN days_to_second <= 60 THEN '31-60 days'
          WHEN days_to_second <= 90 THEN '61-90 days'
          WHEN days_to_second <= 180 THEN '91-180 days'
          ELSE '180+ days'
        END as time_range,
        COUNT(*) as customer_count
      FROM (
        SELECT 
          customer_id,
          DATEDIFF(
            MIN(CASE WHEN rn = 2 THEN created_at END),
            MIN(CASE WHEN rn = 1 THEN created_at END)
          ) as days_to_second
        FROM (
          SELECT 
            customer_id,
            created_at,
            ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at) as rn
          FROM sales_order
          WHERE status NOT IN ('canceled', 'closed') AND customer_id IS NOT NULL
        ) as ranked_orders
        WHERE rn <= 2
        GROUP BY customer_id
        HAVING COUNT(*) = 2
      ) as second_purchase_times
      WHERE days_to_second IS NOT NULL
      GROUP BY time_range
      ORDER BY 
        CASE time_range
          WHEN '0-30 days' THEN 1
          WHEN '31-60 days' THEN 2
          WHEN '61-90 days' THEN 3
          WHEN '91-180 days' THEN 4
          ELSE 5
        END
    `);

    return timeData.map((row: any) => ({
      timeRange: row.time_range,
      customerCount: parseInt(row.customer_count || '0')
    }));
  } catch (error) {
    console.error('Error getting time to second purchase:', error);
    return [];
  }
};

// ============================================
// B2B CUSTOMER INTELLIGENCE QUERIES
// ============================================

/**
 * Identify and analyze B2B customers
 */
export const identifyB2BCustomers = async () => {
  try {
    // Identify B2B customers by email domain and order patterns
    const [b2bStats] = await executeQuery<any>(`
      SELECT 
        COUNT(DISTINCT ce.entity_id) as b2b_customers,
        SUM(order_stats.order_count) as b2b_orders,
        SUM(order_stats.total_spent) as b2b_revenue,
        AVG(order_stats.avg_order_value) as b2b_avg_order_value
      FROM customer_entity ce
      INNER JOIN (
        SELECT 
          customer_id,
          COUNT(*) as order_count,
          SUM(base_grand_total) as total_spent,
          AVG(base_grand_total) as avg_order_value
        FROM sales_order
        WHERE status NOT IN ('canceled', 'closed')
        GROUP BY customer_id
      ) as order_stats ON ce.entity_id = order_stats.customer_id
      WHERE (
        ce.email LIKE '%.com' 
        OR ce.email LIKE '%.org'
        OR ce.email LIKE '%.edu'
        OR ce.email LIKE '%.gov'
        OR ce.email LIKE '%.net'
      )
      AND order_stats.avg_order_value > 1000
    `);

    const b2bCustomers = parseInt(b2bStats?.b2b_customers || '0');
    const b2bRevenue = parseFloat(b2bStats?.b2b_revenue || '0');
    const b2bAvgOrderValue = parseFloat(b2bStats?.b2b_avg_order_value || '0');

    // Get all customer stats for comparison
    const [allStats] = await executeQuery<any>(`
      SELECT 
        COUNT(DISTINCT customer_id) as total_customers,
        SUM(base_grand_total) as total_revenue,
        AVG(base_grand_total) as avg_order_value
      FROM sales_order
      WHERE status NOT IN ('canceled', 'closed') AND customer_id IS NOT NULL
    `);

    const totalCustomers = parseInt(allStats?.total_customers || '0');
    const totalRevenue = parseFloat(allStats?.total_revenue || '0');
    
    return {
      b2bCustomers,
      b2bRevenue,
      b2bAvgOrderValue,
      b2bPercentOfCustomers: totalCustomers > 0 ? (b2bCustomers / totalCustomers * 100).toFixed(2) : '0',
      b2bPercentOfRevenue: totalRevenue > 0 ? (b2bRevenue / totalRevenue * 100).toFixed(2) : '0',
      totalCustomers,
      totalRevenue
    };
  } catch (error) {
    console.error('Error identifying B2B customers:', error);
    return {
      b2bCustomers: 0,
      b2bRevenue: 0,
      b2bAvgOrderValue: 0,
      b2bPercentOfCustomers: '0',
      b2bPercentOfRevenue: '0',
      totalCustomers: 0,
      totalRevenue: 0
    };
  }
};

/**
 * Get top B2B customers
 */
export const getTopB2BCustomers = async (limit: number = 20) => {
  try {
    const topB2B = await executeQuery<any>(`
      SELECT 
        ce.entity_id as customer_id,
        ce.email,
        COUNT(so.entity_id) as total_orders,
        SUM(so.base_grand_total) as lifetime_value,
        AVG(so.base_grand_total) as avg_order_value,
        MAX(so.created_at) as last_order_date,
        CASE 
          WHEN ce.email LIKE '%.edu' THEN 'Education'
          WHEN ce.email LIKE '%.gov' THEN 'Government'
          WHEN ce.email LIKE '%.org' THEN 'Non-Profit'
          ELSE 'Commercial'
        END as industry_type
      FROM customer_entity ce
      INNER JOIN sales_order so ON ce.entity_id = so.customer_id
      WHERE so.status NOT IN ('canceled', 'closed')
        AND (
          ce.email LIKE '%.com' 
          OR ce.email LIKE '%.org'
          OR ce.email LIKE '%.edu'
          OR ce.email LIKE '%.gov'
          OR ce.email LIKE '%.net'
        )
      GROUP BY ce.entity_id, ce.email
      HAVING avg_order_value > 1000
      ORDER BY lifetime_value DESC
      LIMIT ?
    `, [limit]);

    return topB2B.map((row: any) => ({
      customerId: row.customer_id,
      email: row.email,
      totalOrders: parseInt(row.total_orders || '0'),
      lifetimeValue: parseFloat(row.lifetime_value || '0'),
      avgOrderValue: parseFloat(row.avg_order_value || '0'),
      lastOrderDate: row.last_order_date,
      industryType: row.industry_type,
      recommendedAction: parseInt(row.total_orders || '0') >= 5 ? 'VIP Program' : 'Trade Account'
    }));
  } catch (error) {
    console.error('Error getting top B2B customers:', error);
    return [];
  }
};

// Continue in next file due to length...
export default {
  getBusinessHealthScore,
  getCriticalAlerts,
  getQuickWins,
  getCustomerRetentionMetrics,
  getCustomerLTV,
  getAtRiskCustomers,
  getTimeToSecondPurchase,
  identifyB2BCustomers,
  getTopB2BCustomers
};

