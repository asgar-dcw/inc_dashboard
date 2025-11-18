import { executeQuery } from './database.js';

// ============================================
// PRODUCT CATALOG HEALTH QUERIES
// ============================================

/**
 * Calculate product catalog health score
 */
export const getProductCatalogHealth = async () => {
  try {
    const [catalogStats] = await executeQuery<any>(`
      SELECT 
        COUNT(DISTINCT cpe.entity_id) as total_products,
        COUNT(DISTINCT soi.product_id) as products_with_sales,
        COUNT(DISTINCT CASE 
          WHEN so.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) 
          THEN soi.product_id 
        END) as active_products_90d,
        COUNT(DISTINCT CASE 
          WHEN so.created_at >= DATE_SUB(NOW(), INTERVAL 180 DAY) 
          THEN soi.product_id 
        END) as active_products_180d
      FROM catalog_product_entity cpe
      LEFT JOIN sales_order_item soi ON cpe.entity_id = soi.product_id
      LEFT JOIN sales_order so ON soi.order_id = so.entity_id AND so.state != 'canceled'
    `);

    const totalProducts = parseInt(catalogStats?.total_products || '0');
    const productsWithSales = parseInt(catalogStats?.products_with_sales || '0');
    const active90d = parseInt(catalogStats?.active_products_90d || '0');
    const active180d = parseInt(catalogStats?.active_products_180d || '0');

    const deadProducts = Math.max(totalProducts - productsWithSales, 0);
    const dormantProducts = Math.max(productsWithSales - active180d, 0);

    const soldRatio = totalProducts > 0 ? productsWithSales / totalProducts : 0;
    const midTermRatio = totalProducts > 0 ? active180d / totalProducts : 0;
    const shortTermRatio = totalProducts > 0 ? active90d / totalProducts : 0;

    // Blend long-term sell-through with recent activity for more stable scoring
    const coverageScore = soldRatio * 55;
    const momentumScore = Math.max(midTermRatio, soldRatio * 0.4) * 20;
    const freshnessScore = Math.max(shortTermRatio, midTermRatio * 0.5) * 25;

    const rawScore = coverageScore + momentumScore + freshnessScore;
    const healthScore = Math.round(Math.min(rawScore, 100));

    let grade = 'F';
    if (healthScore >= 90) grade = 'A';
    else if (healthScore >= 80) grade = 'B';
    else if (healthScore >= 70) grade = 'C';
    else if (healthScore >= 60) grade = 'D';
    else if (healthScore >= 50) grade = 'E';

    return {
      healthScore,
      grade,
      totalProducts,
      activeProducts: productsWithSales,
      recentActiveProducts: active90d,
      dormantProducts,
      deadProducts,
      percentages: {
        active: (soldRatio * 100).toFixed(1),
        recent: (shortTermRatio * 100).toFixed(1),
        dormant: (totalProducts > 0 ? (dormantProducts / totalProducts) * 100 : 0).toFixed(1),
        dead: (totalProducts > 0 ? (deadProducts / totalProducts) * 100 : 0).toFixed(1)
      },
      estimatedCarryingCost: deadProducts * 20 // $20 per SKU estimate
    };
  } catch (error) {
    console.error('Error calculating catalog health:', error);
    return {
      healthScore: 0,
      grade: 'F',
      totalProducts: 0,
      activeProducts: 0,
      recentActiveProducts: 0,
      dormantProducts: 0,
      deadProducts: 0,
      percentages: { active: '0', recent: '0', dormant: '0', dead: '0' },
      estimatedCarryingCost: 0
    };
  }
};

/**
 * Get dead products to phase out
 */
export const getDeadProducts = async (limit: number = 100) => {
  try {
    const deadProducts = await executeQuery<any>(`
      SELECT 
        cpe.entity_id as product_id,
        cpe.sku,
        MAX(so.created_at) as last_sale_date,
        DATEDIFF(NOW(), MAX(so.created_at)) as days_since_last_sale
      FROM catalog_product_entity cpe
      LEFT JOIN sales_order_item soi ON cpe.entity_id = soi.product_id
      LEFT JOIN sales_order so ON soi.order_id = so.entity_id AND so.state != 'canceled'
      GROUP BY cpe.entity_id, cpe.sku
      HAVING last_sale_date IS NULL 
        OR days_since_last_sale > 180
      ORDER BY 
        (last_sale_date IS NULL) DESC,
        days_since_last_sale DESC
      LIMIT ?
    `, [limit]);

    return deadProducts.map((row: any) => ({
      productId: row.product_id,
      sku: row.sku,
      lastSaleDate: row.last_sale_date,
      daysSinceLastSale: row.days_since_last_sale ? parseInt(row.days_since_last_sale) : null,
      action: !row.last_sale_date ? 'Remove' : row.days_since_last_sale > 365 ? 'Discount' : 'Hide',
    }));
  } catch (error) {
    console.error('Error getting dead products:', error);
    return [];
  }
};

/**
 * Get product lifecycle matrix (Stars, Cash Cows, Question Marks, Dogs)
 */
export const getProductLifecycleMatrix = async () => {
  try {
    const matrixData = await executeQuery<any>(`
      SELECT 
        CASE 
          WHEN order_count >= 50 AND revenue >= 50000 THEN 'Stars'
          WHEN order_count >= 100 AND revenue >= 20000 THEN 'Cash Cows'
          WHEN order_count < 50 AND revenue >= 10000 THEN 'Question Marks'
          ELSE 'Dogs'
        END as category,
        COUNT(*) as product_count,
        SUM(revenue) as total_revenue
      FROM (
        SELECT 
          soi.product_id,
          COUNT(DISTINCT soi.order_id) as order_count,
          SUM(soi.row_total) as revenue
        FROM sales_order_item soi
        INNER JOIN sales_order so ON soi.order_id = so.entity_id
        WHERE so.state != 'canceled'
        GROUP BY soi.product_id
      ) as product_stats
      GROUP BY category
      ORDER BY 
        CASE category
          WHEN 'Stars' THEN 1
          WHEN 'Cash Cows' THEN 2
          WHEN 'Question Marks' THEN 3
          ELSE 4
        END
    `);

    return matrixData.map((row: any) => ({
      stage: row.category,
      category: row.category,
      productCount: parseInt(row.product_count || '0'),
      totalRevenue: parseFloat(row.total_revenue || '0')
    }));
  } catch (error) {
    console.error('Error getting product lifecycle matrix:', error);
    return [];
  }
};

// ============================================
// REVENUE INTELLIGENCE QUERIES
// ============================================

/**
 * Get new vs repeat customer revenue breakdown
 */
export const getNewVsRepeatRevenue = async (days: number = 30) => {
  try {
    // Using all available data (no date filter for static dump)
    const [revenueData] = await executeQuery<any>(`
      SELECT 
        SUM(CASE WHEN customer_orders.order_count = 1 THEN so.base_grand_total ELSE 0 END) as new_customer_revenue,
        SUM(CASE WHEN customer_orders.order_count > 1 THEN so.base_grand_total ELSE 0 END) as repeat_customer_revenue,
        COUNT(DISTINCT CASE WHEN customer_orders.order_count = 1 THEN so.entity_id END) as new_customer_orders,
        COUNT(DISTINCT CASE WHEN customer_orders.order_count > 1 THEN so.entity_id END) as repeat_customer_orders
      FROM sales_order so
      INNER JOIN (
        SELECT 
          customer_id,
          COUNT(*) as order_count
        FROM sales_order
        WHERE status NOT IN ('canceled', 'closed') AND customer_id IS NOT NULL
        GROUP BY customer_id
      ) as customer_orders ON so.customer_id = customer_orders.customer_id
      WHERE so.status NOT IN ('canceled', 'closed')
    `);

    const newRevenue = parseFloat(revenueData?.new_customer_revenue || '0');
    const repeatRevenue = parseFloat(revenueData?.repeat_customer_revenue || '0');
    const totalRevenue = newRevenue + repeatRevenue;

    return {
      newCustomerRevenue: newRevenue,
      repeatCustomerRevenue: repeatRevenue,
      totalRevenue,
      newCustomerOrders: parseInt(revenueData?.new_customer_orders || '0'),
      repeatCustomerOrders: parseInt(revenueData?.repeat_customer_orders || '0'),
      percentages: {
        newCustomer: totalRevenue > 0 ? (newRevenue / totalRevenue * 100).toFixed(1) : '0',
        repeatCustomer: totalRevenue > 0 ? (repeatRevenue / totalRevenue * 100).toFixed(1) : '0'
      }
    };
  } catch (error) {
    console.error('Error getting new vs repeat revenue:', error);
    return {
      newCustomerRevenue: 0,
      repeatCustomerRevenue: 0,
      totalRevenue: 0,
      newCustomerOrders: 0,
      repeatCustomerOrders: 0,
      percentages: { newCustomer: '0', repeatCustomer: '0' }
    };
  }
};

/**
 * Calculate Monthly Recurring Revenue potential
 */
export const getMonthlyRecurringRevenue = async () => {
  try {
    // Calculate average monthly revenue from repeat customers
    // Using all available data (no date filter for static dump)
    const [mrrData] = await executeQuery<any>(`
      SELECT 
        COUNT(DISTINCT customer_id) as repeat_customers,
        AVG(monthly_revenue) as avg_monthly_revenue_per_customer
      FROM (
        SELECT 
          customer_id,
          SUM(base_grand_total) / NULLIF(TIMESTAMPDIFF(MONTH, MIN(created_at), MAX(created_at)), 0) as monthly_revenue
        FROM sales_order
        WHERE status NOT IN ('canceled', 'closed') 
          AND customer_id IS NOT NULL
        GROUP BY customer_id
        HAVING COUNT(*) > 1
      ) as repeat_customer_revenue
    `);

    const repeatCustomers = parseInt(mrrData?.repeat_customers || '0');
    const avgMonthlyPerCustomer = parseFloat(mrrData?.avg_monthly_revenue_per_customer || '0');
    const currentMRR = repeatCustomers * avgMonthlyPerCustomer;

    // Calculate potential MRR if 20% retention
    const [totalCustomers] = await executeQuery<any>(`
      SELECT COUNT(DISTINCT customer_id) as total
      FROM sales_order
      WHERE status NOT IN ('canceled', 'closed') AND customer_id IS NOT NULL
    `);

    const total = parseInt(totalCustomers?.total || '0');
    const potentialRepeatCustomers = total * 0.20;
    const potentialMRR = potentialRepeatCustomers * avgMonthlyPerCustomer;

    return {
      currentMRR,
      potentialMRR,
      gap: potentialMRR - currentMRR,
      repeatCustomers,
      avgMonthlyPerCustomer
    };
  } catch (error) {
    console.error('Error calculating MRR:', error);
    return {
      currentMRR: 0,
      potentialMRR: 0,
      gap: 0,
      repeatCustomers: 0,
      avgMonthlyPerCustomer: 0
    };
  }
};

/**
 * Get revenue by customer segment
 */
export const getRevenueBySegment = async (days: number = 30) => {
  try {
    // Using all available data (no date filter for static dump)
    const segmentRevenue = await executeQuery<any>(`
      SELECT 
        CASE 
          WHEN order_count >= 20 THEN 'VIP'
          WHEN order_count >= 10 THEN 'Loyal'
          WHEN order_count >= 5 THEN 'Regular'
          WHEN order_count >= 2 THEN 'Repeat'
          ELSE 'One-time'
        END as segment,
        SUM(total_revenue) as segment_revenue,
        COUNT(DISTINCT customer_id) as customers_in_segment,
        AVG(total_revenue) as avg_revenue_per_customer
      FROM (
        SELECT 
          so.customer_id,
          COUNT(DISTINCT so.entity_id) as order_count,
          SUM(so.base_grand_total) as total_revenue
        FROM sales_order so
        WHERE so.status NOT IN ('canceled', 'closed') AND so.customer_id IS NOT NULL
        GROUP BY so.customer_id
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

    return segmentRevenue.map((row: any) => ({
      segment: row.segment,
      revenue: parseFloat(row.segment_revenue || '0'),
      customerCount: parseInt(row.customers_in_segment || '0'),
      avgRevenuePerCustomer: parseFloat(row.avg_revenue_per_customer || '0')
    }));
  } catch (error) {
    console.error('Error getting revenue by segment:', error);
    return [];
  }
};

/**
 * Get order value distribution
 */
export const getOrderValueDistribution = async () => {
  try {
    // Using all available data (no date filter for static dump)
    const distribution = await executeQuery<any>(`
      SELECT 
        CASE 
          WHEN base_grand_total < 100 THEN '$0-$100'
          WHEN base_grand_total < 250 THEN '$100-$250'
          WHEN base_grand_total < 500 THEN '$250-$500'
          WHEN base_grand_total < 1000 THEN '$500-$1,000'
          WHEN base_grand_total < 2500 THEN '$1,000-$2,500'
          WHEN base_grand_total < 5000 THEN '$2,500-$5,000'
          ELSE '$5,000+'
        END as value_range,
        COUNT(*) as order_count,
        SUM(base_grand_total) as total_revenue,
        AVG(base_grand_total) as avg_order_value
      FROM sales_order
      WHERE status NOT IN ('canceled', 'closed')
      GROUP BY value_range
      ORDER BY MIN(base_grand_total)
    `);

    return distribution.map((row: any) => ({
      valueRange: row.value_range,
      orderCount: parseInt(row.order_count || '0'),
      totalRevenue: parseFloat(row.total_revenue || '0'),
      avgOrderValue: parseFloat(row.avg_order_value || '0')
    }));
  } catch (error) {
    console.error('Error getting order value distribution:', error);
    return [];
  }
};

/**
 * Get monthly revenue trend (last 12 months)
 */
export const getMonthlyRevenueTrend = async () => {
  try {
    const results = await executeQuery<any>(`
      SELECT 
        DATE_FORMAT(so.created_at, '%Y-%m') as month,
        SUM(so.base_grand_total) as revenue,
        COUNT(*) as orders
      FROM sales_order so
      WHERE so.status NOT IN ('canceled', 'closed')
      GROUP BY DATE_FORMAT(so.created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `);

    return results
      .map((row: any) => ({
        month: row.month,
        revenue: parseFloat(row.revenue || '0'),
        orders: parseInt(row.orders || '0')
      }))
      .reverse();
  } catch (error) {
    console.error('Error getting monthly revenue trend:', error);
    return [];
  }
};

// ============================================
// STRATEGIC RECOMMENDATIONS DATA
// ============================================

/**
 * Generate data-driven recommendations with ROI estimates
 */
export const getStrategicRecommendations = async () => {
  try {
    const recommendations = [];

    // Get retention rate
    const [retentionData] = await executeQuery<any>(`
      SELECT 
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_id END) as repeat_customers
      FROM (
        SELECT customer_id, COUNT(*) as order_count
        FROM sales_order
        WHERE state != 'canceled' AND customer_id IS NOT NULL
        GROUP BY customer_id
      ) as customer_orders
    `);

    const totalCustomers = parseInt(retentionData?.total_customers || '0');
    const repeatCustomers = parseInt(retentionData?.repeat_customers || '0');
    const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Recommendation 1: Email Marketing (if retention is low)
    if (retentionRate < 10) {
      const inactiveCustomers = totalCustomers - repeatCustomers;
      const estimatedImpact = inactiveCustomers * 0.05 * 500; // 5% response rate, $500 AOV
      
      recommendations.push({
        id: 'email-campaign',
        priority: 'critical',
        title: 'Launch Email Re-engagement Campaign',
        description: `Target ${inactiveCustomers.toLocaleString()} inactive customers`,
        impact: `+$${(estimatedImpact / 1000).toFixed(0)}K in 30 days`,
        effort: 'Low',
        timeframe: 'This week',
        roi: '500%+',
        steps: [
          'Choose email platform (Klaviyo recommended)',
          'Write 3 welcome-back emails with 10% discount',
          'Segment by last purchase category',
          'Schedule sends over 2 weeks',
          'Track response rate (target: 5%)'
        ],
        estimatedCost: 5000,
        estimatedRevenue: estimatedImpact
      });
    }

    // Recommendation 2: B2B Program
    const [b2bPotential] = await executeQuery<any>(`
      SELECT COUNT(DISTINCT customer_id) as b2b_customers
      FROM sales_order
      WHERE state != 'canceled' 
        AND grand_total > 1500
      GROUP BY customer_id
      HAVING COUNT(*) >= 2
    `);

    const b2bCustomers = parseInt(b2bPotential?.b2b_customers || '0');
    if (b2bCustomers > 100) {
      recommendations.push({
        id: 'b2b-program',
        priority: 'high',
        title: 'Launch B2B Trade Account Program',
        description: `Target ${b2bCustomers} high-value customers`,
        impact: '+$3-8M annually',
        effort: 'Medium',
        timeframe: 'This month',
        roi: '300-800%',
        steps: [
          'Create trade account application form',
          'Design 3 pricing tiers (Bronze/Silver/Gold)',
          'Set up credit approval process',
          'Email all business customers',
          'Call top 100 customers to invite'
        ],
        estimatedCost: 10000,
        estimatedRevenue: 5000000
      });
    }

    // Recommendation 3: Catalog Cleanup
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

    if (deadProducts > 1000) {
      recommendations.push({
        id: 'catalog-cleanup',
        priority: 'high',
        title: 'Clean Up Product Catalog',
        description: `Remove ${deadProducts.toLocaleString()} dead products`,
        impact: `$${(deadProducts * 20 / 1000).toFixed(0)}K+ savings annually`,
        effort: 'Low',
        timeframe: 'This month',
        roi: 'High cost savings',
        steps: [
          'Export list of products with 0 sales',
          'Bulk hide products from website',
          'Create clearance section for remaining inventory',
          'Stop reordering dead SKUs',
          'Monitor impact on site performance'
        ],
        estimatedCost: 0,
        estimatedRevenue: deadProducts * 20
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
};

export default {
  getProductCatalogHealth,
  getDeadProducts,
  getProductLifecycleMatrix,
  getNewVsRepeatRevenue,
  getMonthlyRecurringRevenue,
  getMonthlyRevenueTrend,
  getRevenueBySegment,
  getOrderValueDistribution,
  getStrategicRecommendations
};

