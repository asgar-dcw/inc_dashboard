import { executeQuery } from './database.js';

interface SalesFilters {
  country?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

const buildSalesFilterClauses = (days: number, filters: SalesFilters = {}) => {
  const joins: string[] = [];
  const where: string[] = ["so.status NOT IN ('canceled', 'closed')"];
  const params: any[] = [];

  // Use date range if provided, otherwise use days
  if (filters.startDate && filters.endDate) {
    where.push('so.created_at >= ? AND so.created_at <= ?');
    params.push(filters.startDate, filters.endDate);
  } else if (days && Number.isFinite(days)) {
    where.push('so.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)');
    params.push(days);
  }

  if (filters.country) {
    joins.push(
      "INNER JOIN sales_order_address soa ON soa.parent_id = so.entity_id AND soa.address_type = 'shipping'"
    );
    where.push('soa.country_id = ?');
    params.push(filters.country);
  }

  if (filters.paymentMethod) {
    joins.push('INNER JOIN sales_order_payment sop ON sop.parent_id = so.entity_id');
    where.push('sop.method = ?');
    params.push(filters.paymentMethod);
  }

  return {
    joins,
    where,
    params,
    hasFilters: Boolean(filters.country || filters.paymentMethod),
  };
};

const buildCustomizationFilterClauses = (days: number, filters: SalesFilters = {}) => {
  const joins: string[] = [];
  const where: string[] = [];
  const params: any[] = [];

  // Base join: quote_item -> quote -> sales_order (for converted quotes)
  // When filters are applied, only show customizations from quotes that were converted to orders
  if (filters.country || filters.paymentMethod) {
    joins.push('INNER JOIN quote q ON qi.quote_id = q.entity_id');
    joins.push('INNER JOIN sales_order so ON so.quote_id = q.entity_id AND so.status NOT IN (\'canceled\', \'closed\')');
  }

  // Use date range if provided, otherwise use days
  if (filters.startDate && filters.endDate) {
    where.push('qi.created_at >= ? AND qi.created_at <= ?');
    params.push(filters.startDate, filters.endDate);
  } else if (days && Number.isFinite(days)) {
    where.push('qi.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)');
    params.push(days);
  }

  if (filters.country) {
    joins.push(
      "INNER JOIN sales_order_address soa ON soa.parent_id = so.entity_id AND soa.address_type = 'shipping'"
    );
    where.push('soa.country_id = ?');
    params.push(filters.country);
  }

  if (filters.paymentMethod) {
    if (!joins.some(j => j.includes('sales_order_payment'))) {
      joins.push('INNER JOIN sales_order_payment sop ON sop.parent_id = so.entity_id');
    }
    where.push('sop.method = ?');
    params.push(filters.paymentMethod);
  }

  return {
    joins,
    where,
    params,
    hasFilters: Boolean(filters.country || filters.paymentMethod),
  };
};

// ============================================
// SALES QUERIES
// ============================================

export const getSalesOverview = async (days: number = 30, filters: SalesFilters = {}) => {
  try {
    const intervalDays = Math.max(1, Math.min(days, 3650));
    const { joins, where, params, hasFilters } = buildSalesFilterClauses(intervalDays, filters);

    const query = `
      SELECT 
        COALESCE(SUM(so.base_grand_total), 0) as totalRevenue,
        COUNT(*) as totalOrders,
        COALESCE(AVG(so.base_grand_total), 0) as averageOrderValue,
        COUNT(DISTINCT so.customer_id) as uniqueCustomers
      FROM sales_order so
      ${joins.join('\n')}
      WHERE ${where.join(' AND ')}
    `;
    
    const results = await executeQuery<any>(query, params);
    const result = results[0] || {};
    const currentRevenue = parseFloat(result?.totalRevenue || '0');
  
    // For static dump, calculate growth by comparing first half vs second half of data
    let growth = 0;
    if (!hasFilters) {
      try {
        const previousQuery = `
          SELECT 
            COALESCE(SUM(so.base_grand_total), 0) as previousRevenue
          FROM sales_order so
          WHERE so.status NOT IN ('canceled', 'closed')
            AND so.created_at < (
              SELECT DATE_ADD(MIN(created_at), INTERVAL DATEDIFF(MAX(created_at), MIN(created_at)) / 2 DAY)
              FROM sales_order
              WHERE status NOT IN ('canceled', 'closed')
            )
        `;
        
        const previousResults = await executeQuery<any>(previousQuery);
        const previousResult = previousResults[0] || {};
        const previousRevenue = parseFloat(previousResult?.previousRevenue || '0');
        growth = previousRevenue > 0 
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
          : 0;
      } catch (error) {
        console.error('Error calculating growth:', error);
        growth = 0;
      }
    }
    
    return {
      totalRevenue: currentRevenue,
      totalOrders: parseInt(result?.totalOrders || '0'),
      averageOrderValue: parseFloat(result?.averageOrderValue || '0'),
      uniqueCustomers: parseInt(result?.uniqueCustomers || '0'),
      growth: parseFloat(growth.toFixed(2))
    };
  } catch (error) {
    console.error('Error in getSalesOverview:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      uniqueCustomers: 0,
      growth: 0
    };
  }
};

export const getSalesTrends = async (days: number = 30, filters: SalesFilters = {}) => {
  try {
    const intervalDays = Math.max(1, Math.min(days, 3650));
    const { joins, where, params } = buildSalesFilterClauses(intervalDays, filters);

    const query = `
      SELECT 
        DATE(so.created_at) as date,
        COALESCE(SUM(so.base_grand_total), 0) as revenue,
        COUNT(*) as orders,
        COUNT(DISTINCT so.customer_id) as customers
      FROM sales_order so
      ${joins.join('\n')}
      WHERE ${where.join(' AND ')}
      GROUP BY DATE(so.created_at)
      ORDER BY date ASC
    `;
    
    const results = await executeQuery<any>(query, params);
    
    return results.map((row: any) => ({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
      revenue: parseFloat(row.revenue || '0'),
      orders: parseInt(row.orders || '0'),
      customers: parseInt(row.customers || '0')
    }));
  } catch (error) {
    console.error('Error in getSalesTrends:', error);
    return [];
  }
};

export const getTopProducts = async (
  limit: number = 10,
  days: number = 30,
  filters: SalesFilters = {}
) => {
  try {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const intervalDays = Math.max(1, Math.min(days, 3650));

    console.log(`[getTopProducts] Starting query with limit=${safeLimit}, days=${intervalDays}`);
    
    const { joins, where, params } = buildSalesFilterClauses(intervalDays, filters);

    // Ensure the base query references the configured joins/filters
    const query = `
      SELECT 
        soi.product_id,
        soi.sku,
        MAX(soi.name) as product_name,
        COUNT(DISTINCT soi.order_id) as sales,
        COALESCE(SUM(soi.row_total), 0) as revenue,
        COALESCE(SUM(soi.qty_ordered), 0) as quantity
      FROM sales_order_item soi
      INNER JOIN sales_order so ON soi.order_id = so.entity_id
      ${joins.join('\n')}
      WHERE ${where.join(' AND ')}
      GROUP BY soi.product_id, soi.sku
      ORDER BY revenue DESC
      LIMIT ?
    `;
    
    console.log(`[getTopProducts] Executing query...`);
    const results = await executeQuery<any>(query, [...params, safeLimit]);
    
    console.log(`[getTopProducts] Query returned ${results.length} rows`);
    
    if (results.length > 0) {
      console.log(`[getTopProducts] First product:`, results[0]);
    }
    
    // Return products with actual names
    return results.map((product: any) => ({
      id: product.product_id,
      name: product.product_name || product.sku || `Product #${product.product_id}`,
      sales: parseInt(product.sales || '0'),
      revenue: parseFloat(product.revenue || '0'),
      quantity: parseInt(product.quantity || '0'),
      growth: 0 // Can be calculated later if needed
    }));
  } catch (error) {
    console.error('[getTopProducts] ERROR:', error);
    console.error('[getTopProducts] Error details:', JSON.stringify(error, null, 2));
    return [];
  }
};

export const getSalesFilterOptions = async () => {
  try {
    const countryQuery = `
      SELECT DISTINCT country_id
      FROM sales_order_address
      WHERE address_type = 'shipping'
        AND country_id IS NOT NULL
        AND country_id <> ''
      ORDER BY country_id
    `;

    const paymentMethodQuery = `
      SELECT DISTINCT method
      FROM sales_order_payment
      WHERE method IS NOT NULL
        AND method <> ''
      ORDER BY method
    `;

    const countriesResult = await executeQuery<any>(countryQuery);
    const paymentMethodsResult = await executeQuery<any>(paymentMethodQuery);

    return {
      countries: countriesResult.map((row: any) => row.country_id),
      paymentMethods: paymentMethodsResult.map((row: any) => row.method),
    };
  } catch (error) {
    console.error('Error in getSalesFilterOptions:', error);
    return {
      countries: [],
      paymentMethods: [],
    };
  }
};

export const getCategoryPerformance = async (days: number = 30, filters: SalesFilters = {}) => {
  try {
    const intervalDays = Math.max(1, Math.min(days, 3650));
    const { joins, where, params } = buildSalesFilterClauses(intervalDays, filters);

    // Get revenue by product name (grouped by product_id and name)
    const query = `
      SELECT 
        soi.product_id,
        MAX(soi.name) as category,
        COALESCE(SUM(soi.row_total), 0) as revenue,
        COUNT(DISTINCT soi.product_id) as products,
        COUNT(DISTINCT soi.order_id) as orders
      FROM sales_order_item soi
      INNER JOIN sales_order so ON soi.order_id = so.entity_id
      ${joins.join('\n')}
      WHERE ${where.join(' AND ')}
      GROUP BY soi.product_id
      ORDER BY revenue DESC
      LIMIT 20
    `;
    
    const results = await executeQuery<any>(query, params);
    
    return results.map((row: any) => ({
      category: row.category || row.sku || 'Uncategorized',
      revenue: parseFloat(row.revenue || '0'),
      products: parseInt(row.products || '0'),
      orders: parseInt(row.orders || '0'),
      growth: 0
    }));
  } catch (error) {
    console.error('Error in getCategoryPerformance:', error);
    return [];
  }
};

export const getHourlySales = async (date: string = 'today') => {
  try {
    // Using all available data - aggregate hourly sales across all days
    const query = `
      SELECT 
        HOUR(created_at) as hour,
        COALESCE(SUM(base_grand_total), 0) as revenue,
        COUNT(*) as orders
      FROM sales_order
      WHERE status NOT IN ('canceled', 'closed')
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `;
    
    const results = await executeQuery<any>(query);
    
    // Fill in missing hours with 0
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hourData = results.find((r: any) => r.hour === i);
      return {
        hour: i,
        revenue: hourData ? parseFloat(hourData.revenue || '0') : 0,
        orders: hourData ? parseInt(hourData.orders || '0') : 0
      };
    });
    
    return hourlyData;
  } catch (error) {
    console.error('Error in getHourlySales:', error);
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      revenue: 0,
      orders: 0
    }));
  }
};

// ============================================
// PRODUCT QUERIES
// ============================================

export const getProductPerformance = async (limit: number = 20, days?: number, filters: SalesFilters = {}) => {
  try {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const normalizedDays =
      typeof days === 'number' && Number.isFinite(days) ? Math.max(1, Math.min(days, 3650)) : 0;
    const { joins, where, params } = buildSalesFilterClauses(normalizedDays, filters);

    // Build views subquery with optional date filters
    const viewsWhere: string[] = [];
    const viewsParams: any[] = [];

    if (filters.startDate && filters.endDate) {
      viewsWhere.push('added_at >= ? AND added_at <= ?');
      viewsParams.push(filters.startDate, filters.endDate);
    } else if (normalizedDays > 0) {
      viewsWhere.push('added_at >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      viewsParams.push(normalizedDays);
    }

    const viewsSubquery = `
      SELECT 
        product_id,
        COUNT(*) as views
      FROM report_viewed_product_index
      ${viewsWhere.length > 0 ? `WHERE ${viewsWhere.join(' AND ')}` : ''}
      GROUP BY product_id
    `;

    // Get product performance with actual product names from sales_order_item and real view counts
    const query = `
      SELECT 
        soi.product_id,
        soi.sku,
        MAX(soi.name) as product_name,
        COUNT(DISTINCT soi.order_id) as sales,
        COALESCE(SUM(soi.row_total), 0) as revenue,
        COALESCE(views_stats.views, 0) as views
      FROM sales_order_item soi
      INNER JOIN sales_order so ON soi.order_id = so.entity_id
      ${joins.join('\n')}
      LEFT JOIN (
        ${viewsSubquery}
      ) views_stats ON views_stats.product_id = soi.product_id
      WHERE ${where.join(' AND ')}
      GROUP BY soi.product_id, soi.sku, views_stats.views
      ORDER BY revenue DESC
      LIMIT ?
    `;
    
    const results = await executeQuery<any>(query, [...viewsParams, ...params, safeLimit]);
    
    return results.map((row: any) => {
      const sales = parseInt(row.sales || '0');
      const views = parseInt(row.views || '0');
      const conversionRate = views > 0 ? (sales / views) * 100 : 0;
      
      return {
        id: row.product_id,
        name: row.product_name || row.sku || `Product #${row.product_id}`,
        views: views,
        sales: sales,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        revenue: parseFloat(row.revenue || '0')
      };
    });
  } catch (error) {
    console.error('Error in getProductPerformance:', error);
    return [];
  }
};

export const getProductMetrics = async (days?: number, filters: SalesFilters = {}) => {
  try {
    const normalizedDays =
      typeof days === 'number' && Number.isFinite(days) ? Math.max(1, Math.min(days, 3650)) : 0;
    const { joins, where, params } = buildSalesFilterClauses(normalizedDays, filters);

    // Total catalog products
    const totalProductsResults = await executeQuery<any>(`
      SELECT COUNT(*) as totalProducts
      FROM catalog_product_entity
    `);
    const totalProducts = parseInt(totalProductsResults[0]?.totalProducts || '0');

    // Total views (optionally filtered by date)
    const viewsWhere: string[] = [];
    const viewsParams: any[] = [];

    if (filters.startDate && filters.endDate) {
      viewsWhere.push('added_at >= ? AND added_at <= ?');
      viewsParams.push(filters.startDate, filters.endDate);
    } else if (normalizedDays > 0) {
      viewsWhere.push('added_at >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      viewsParams.push(normalizedDays);
    }

    const viewsQuery = `
      SELECT COUNT(*) as totalViews
      FROM report_viewed_product_index
      ${viewsWhere.length > 0 ? `WHERE ${viewsWhere.join(' AND ')}` : ''}
    `;
    const totalViewsResults = await executeQuery<any>(viewsQuery, viewsParams);
    const totalViews = parseInt(totalViewsResults[0]?.totalViews || '0');

    // Total orders (respect filters)
    const ordersQuery = `
      SELECT COUNT(*) as totalOrders
      FROM sales_order so
      ${joins.join('\n')}
      WHERE ${where.join(' AND ')}
    `;
    const totalOrdersResults = await executeQuery<any>(ordersQuery, params);
    const totalOrders = parseInt(totalOrdersResults[0]?.totalOrders || '0');

    const avgConversion = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

    return {
      totalProducts,
      totalViews,
      totalOrders,
      avgConversion: parseFloat(avgConversion.toFixed(2))
    };
  } catch (error) {
    console.error('Error in getProductMetrics:', error);
    return {
      totalProducts: 0,
      totalViews: 0,
      totalOrders: 0,
      avgConversion: 0
    };
  }
};

export const getTopViewedNotPurchased = async (
  limit: number = 10,
  days?: number,
  filters: SalesFilters = {}
) => {
  try {
    const safeLimit = Math.max(1, Math.min(limit, 50));
    // Default to last 90 days if no date filter specified to avoid processing all-time data
    const normalizedDays =
      typeof days === 'number' && Number.isFinite(days) ? Math.max(1, Math.min(days, 365)) : 
      (filters.startDate && filters.endDate) ? 0 : 90;

    const viewConditions: string[] = [];
    const viewParams: any[] = [];

    if (filters.startDate && filters.endDate) {
      viewConditions.push('v.added_at >= ? AND v.added_at <= ?');
      viewParams.push(filters.startDate, filters.endDate);
    } else if (normalizedDays > 0) {
      viewConditions.push('v.added_at >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      viewParams.push(normalizedDays);
    }

    const {
      joins: orderJoins,
      where: orderWhere,
      params: orderParams
    } = buildSalesFilterClauses(normalizedDays, filters);

    // Simplified query: Get top viewed products, then check if they have orders
    // Use NOT EXISTS for better performance than LEFT JOIN
    const whereClauses: string[] = [];
    if (viewConditions.length > 0) {
      whereClauses.push(...viewConditions);
    }
    
    // Build NOT EXISTS clause for orders
    const notExistsClause = `
      NOT EXISTS (
        SELECT 1
        FROM sales_order_item soi
        INNER JOIN sales_order so ON soi.order_id = so.entity_id
        ${orderJoins.join('\n')}
        WHERE soi.product_id = v.product_id
        AND ${orderWhere.join(' AND ')}
      )
    `;
    whereClauses.push(notExistsClause);

    // First try: Get products with zero orders
    const zeroOrderQuery = `
      SELECT 
        v.product_id,
        MAX(cpe.sku) as sku,
        COUNT(*) as views
      FROM report_viewed_product_index v
      LEFT JOIN catalog_product_entity cpe ON cpe.entity_id = v.product_id
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY v.product_id
      ORDER BY views DESC
      LIMIT ?
    `;

    let results = await executeQuery<any>(zeroOrderQuery, [
      ...viewParams,
      ...orderParams,
      safeLimit
    ]);

    // If no zero-order products, get lowest-order products
    if (results.length === 0) {
      // Get order counts for viewed products
      const orderCountQuery = `
        SELECT 
          soi.product_id,
          COUNT(*) as order_count
        FROM sales_order_item soi
        INNER JOIN sales_order so ON soi.order_id = so.entity_id
        ${orderJoins.join('\n')}
        WHERE ${orderWhere.join(' AND ')}
        GROUP BY soi.product_id
      `;

      const orderCounts = await executeQuery<any>(orderCountQuery, orderParams);
      const orderCountMap = new Map(orderCounts.map((oc: any) => [oc.product_id, parseInt(oc.order_count || '0')]));

      const fallbackQuery = `
        SELECT 
          v.product_id,
          MAX(cpe.sku) as sku,
          COUNT(*) as views
        FROM report_viewed_product_index v
        LEFT JOIN catalog_product_entity cpe ON cpe.entity_id = v.product_id
        ${viewConditions.length > 0 ? `WHERE ${viewConditions.join(' AND ')}` : ''}
        GROUP BY v.product_id
        ORDER BY views DESC
        LIMIT ${safeLimit * 3}
      `;

      const allViewed = await executeQuery<any>(fallbackQuery, viewParams);
      
      // Sort by order count (ascending) then views (descending)
      results = allViewed
        .map((row: any) => ({
          product_id: row.product_id,
          sku: row.sku,
          views: parseInt(row.views || '0'),
          orders: orderCountMap.get(row.product_id) || 0
        }))
        .sort((a: any, b: any) => {
          if (a.orders !== b.orders) return a.orders - b.orders;
          return b.views - a.views;
        })
        .slice(0, safeLimit);
    } else {
      // Add orders = 0 for zero-order results
      results = results.map((row: any) => ({
        ...row,
        orders: 0
      }));
    }

    // Get product names from sales_order_item if available (much faster than EAV)
    if (results.length > 0) {
      const productIds = results.map((r: any) => parseInt(r.product_id || '0')).filter(id => id > 0);
      
      if (productIds.length > 0) {
        const placeholders = productIds.map(() => '?').join(',');
        const nameQuery = `
          SELECT 
            product_id,
            MAX(name) as product_name
          FROM sales_order_item
          WHERE product_id IN (${placeholders})
          GROUP BY product_id
        `;
        
        const productNames = await executeQuery<any>(nameQuery, productIds);
        const nameMap = new Map(productNames.map((pn: any) => [pn.product_id, pn.product_name]));
        
        results = results.map((row: any) => ({
          productId: parseInt(row.product_id || '0'),
          sku: row.sku || `Product #${row.product_id}`,
          name: nameMap.get(parseInt(row.product_id || '0')) || row.sku || `Product #${row.product_id}`,
          views: parseInt(row.views || '0'),
          orders: parseInt(row.orders || '0')
        }));
      } else {
        // Fallback if no valid product IDs
        results = results.map((row: any) => ({
          productId: parseInt(row.product_id || '0'),
          sku: row.sku || `Product #${row.product_id}`,
          name: row.sku || `Product #${row.product_id}`,
          views: parseInt(row.views || '0'),
          orders: parseInt(row.orders || '0')
        }));
      }
    }

    return results;
  } catch (error) {
    console.error('Error in getTopViewedNotPurchased:', error);
    return [];
  }
};

export const getProductViews = async (limit: number = 20, days?: number) => {
  try {
    const query = `
      SELECT 
        product_id,
        COUNT(*) as views,
        COUNT(DISTINCT customer_id) as unique_views
      FROM report_viewed_product_index
      GROUP BY product_id
      ORDER BY views DESC
      LIMIT ?
    `;
    
    const results = await executeQuery<any>(query, [limit]);
    
    return results.map((row: any) => ({
      productId: row.product_id,
      views: parseInt(row.views || '0'),
      uniqueViews: parseInt(row.unique_views || '0')
    }));
  } catch (error) {
    console.error('Error in getProductViews:', error);
    return [];
  }
};

export const getSearchAnalytics = async (limit: number = 20, days?: number) => {
  try {
    // Fixed: Use correct column names - 'query' not 'query_text', 'results' not 'num_results'
    const query = `
      SELECT 
        COALESCE(query, 'Unknown') as query,
        COUNT(*) as searches,
        COUNT(DISTINCT customer_id) as unique_searches,
        COALESCE(AVG(results), 0) as avg_results
      FROM mst_search_report_log
      GROUP BY query
      ORDER BY searches DESC
      LIMIT ?
    `;
    
    const results = await executeQuery<any>(query, [limit]);
    
    return results.map((row: any) => ({
      query: row.query || '',
      searches: parseInt(row.searches || '0'),
      uniqueSearches: parseInt(row.unique_searches || '0'),
      avgResults: parseInt(row.avg_results || '0')
    }));
  } catch (error) {
    console.error('Error in getSearchAnalytics:', error);
    return [];
  }
};

// ============================================
// CUSTOMER QUERIES
// ============================================

export const getCustomerOverview = async (days?: number, filters: SalesFilters = {}) => {
  try {
    const normalizedDays =
      typeof days === 'number' && Number.isFinite(days) ? Math.max(1, Math.min(days, 3650)) : 0;
    const { joins, where, params } = buildSalesFilterClauses(normalizedDays, filters);
    
    // Get total customers (customers who have orders matching the filters)
    const totalQuery = `
      SELECT COUNT(DISTINCT so.customer_id) as totalCustomers
      FROM sales_order so
      ${joins.join('\n')}
      WHERE ${where.join(' AND ')}
        AND so.customer_id IS NOT NULL
    `;
    const totalResults = await executeQuery<any>(totalQuery, params);
    const totalCustomers = parseInt(totalResults[0]?.totalCustomers || '0');
    
    // Get new customers (customers with exactly 1 order matching filters)
    const newCustomersQuery = `
      SELECT COUNT(DISTINCT customer_id) as newCustomers
      FROM (
        SELECT so.customer_id, COUNT(*) as order_count
        FROM sales_order so
        ${joins.join('\n')}
        WHERE ${where.join(' AND ')}
          AND so.customer_id IS NOT NULL
        GROUP BY so.customer_id
        HAVING order_count = 1
      ) as first_time_customers
    `;
    const newCustomersResults = await executeQuery<any>(newCustomersQuery, params);
    const newCustomers = parseInt(newCustomersResults[0]?.newCustomers || '0');
    
    // Get returning customers (customers with 2+ orders matching filters)
    const returningCustomersQuery = `
      SELECT COUNT(DISTINCT customer_id) as returningCustomers
      FROM (
        SELECT so.customer_id, COUNT(*) as order_count
        FROM sales_order so
        ${joins.join('\n')}
        WHERE ${where.join(' AND ')}
          AND so.customer_id IS NOT NULL
        GROUP BY so.customer_id
        HAVING order_count > 1
      ) as repeat_customers
    `;
    const returningCustomersResults = await executeQuery<any>(returningCustomersQuery, params);
    const returningCustomers = parseInt(returningCustomersResults[0]?.returningCustomers || '0');
    
    // Calculate churn rate (for filtered customers, calculate based on those who haven't ordered recently)
    let churnRate = 0;
    try {
      // For filtered view, churn rate is less meaningful, so we'll use a simplified calculation
      // Customers who haven't ordered in the filtered period
      const churnQuery = `
        SELECT COUNT(DISTINCT so.customer_id) as activeCustomers
        FROM sales_order so
        ${joins.join('\n')}
        WHERE ${where.join(' AND ')}
          AND so.customer_id IS NOT NULL
      `;
      
      const churnResults = await executeQuery<any>(churnQuery, params);
      const activeCustomers = parseInt(churnResults[0]?.activeCustomers || '0');
      // Simplified churn: assume some percentage haven't ordered recently
      churnRate = totalCustomers > 0 ? ((totalCustomers - activeCustomers) / totalCustomers) * 100 : 0;
    } catch (error) {
      console.error('Error calculating churn rate:', error);
    }
    
    return {
      totalCustomers: totalCustomers,
      newCustomers: newCustomers, // Customers with exactly 1 order
      returningCustomers: returningCustomers, // Customers with 2+ orders
      churnRate: parseFloat(churnRate.toFixed(2))
    };
  } catch (error) {
    console.error('Error in getCustomerOverview:', error);
    return {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      churnRate: 0
    };
  }
};

export const getCustomerSegments = async () => {
  try {
    const query = `
      SELECT 
        CASE 
          WHEN orderCount >= 10 THEN 'VIP Customers'
          WHEN orderCount >= 5 THEN 'Frequent Buyers'
          WHEN orderCount >= 2 THEN 'Regular Customers'
          WHEN orderCount = 1 THEN 'One-time Buyers'
          ELSE 'No Orders'
        END as segment,
        COUNT(*) as count,
        COALESCE(SUM(totalSpent), 0) as revenue,
        COALESCE(AVG(totalSpent), 0) as avgValue
      FROM (
        SELECT 
          ce.entity_id,
          COUNT(so.entity_id) as orderCount,
          COALESCE(SUM(so.base_grand_total), 0) as totalSpent
        FROM customer_entity ce
        LEFT JOIN sales_order so ON ce.entity_id = so.customer_id
          AND so.status NOT IN ('canceled', 'closed')
        GROUP BY ce.entity_id
      ) as customerStats
      GROUP BY segment
      ORDER BY 
        CASE segment
          WHEN 'VIP Customers' THEN 1
          WHEN 'Frequent Buyers' THEN 2
          WHEN 'Regular Customers' THEN 3
          WHEN 'One-time Buyers' THEN 4
          ELSE 5
        END
    `;
    
    const results = await executeQuery<any>(query);
    
    // Get total for percentage calculation
    const totalQuery = `SELECT COUNT(*) as total FROM customer_entity`;
    const totalResults = await executeQuery<any>(totalQuery);
    const total = parseInt(totalResults[0]?.total || '0');
    
    return results.map((row: any) => ({
      segment: row.segment,
      count: parseInt(row.count || '0'),
      percentage: total > 0 ? parseFloat(((parseInt(row.count || '0') / total) * 100).toFixed(2)) : 0,
      revenue: parseFloat(row.revenue || '0'),
      avgValue: parseFloat(row.avgValue || '0')
    }));
  } catch (error) {
    console.error('Error in getCustomerSegments:', error);
    return [];
  }
};

export const getCustomerGrowth = async (days?: number, filters: SalesFilters = {}) => {
  try {
    const normalizedDays =
      typeof days === 'number' && Number.isFinite(days) ? Math.max(1, Math.min(days, 3650)) : 0;
    const { joins, where, params } = buildSalesFilterClauses(normalizedDays, filters);
    
    // Get customer growth based on orders matching filters (grouped by order date)
    const query = `
      SELECT 
        DATE(so.created_at) as date,
        COUNT(DISTINCT so.customer_id) as newCustomers
      FROM sales_order so
      ${joins.join('\n')}
      WHERE ${where.join(' AND ')}
        AND so.customer_id IS NOT NULL
      GROUP BY DATE(so.created_at)
      ORDER BY date ASC
    `;
    
    const results = await executeQuery<any>(query, params);
    
    return results.map((row: any) => ({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
      newCustomers: parseInt(row.newCustomers || '0'),
      activeCustomers: parseInt(row.newCustomers || '0')
    }));
  } catch (error) {
    console.error('Error in getCustomerGrowth:', error);
    return [];
  }
};

export const getTopCustomers = async (limit: number = 10, days?: number, filters: SalesFilters = {}) => {
  try {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const normalizedDays =
      typeof days === 'number' && Number.isFinite(days) ? Math.max(1, Math.min(days, 3650)) : 0;
    const { joins, where, params } = buildSalesFilterClauses(normalizedDays, filters);
    
    const query = `
      SELECT 
        ce.entity_id as customerId,
        ce.email,
        COUNT(so.entity_id) as orderCount,
        COALESCE(SUM(so.base_grand_total), 0) as totalSpent,
        MAX(so.created_at) as lastOrderDate
      FROM customer_entity ce
      INNER JOIN sales_order so ON ce.entity_id = so.customer_id
      ${joins.join('\n')}
      WHERE ${where.join(' AND ')}
      GROUP BY ce.entity_id, ce.email
      HAVING orderCount > 0
      ORDER BY totalSpent DESC
      LIMIT ?
    `;
    
    const results = await executeQuery<any>(query, [...params, safeLimit]);
    
    return results.map((row: any) => ({
      id: row.customerId,
      name: row.email || 'Unknown',
      email: row.email || '',
      orders: parseInt(row.orderCount || '0'),
      totalSpent: parseFloat(row.totalSpent || '0'),
      lastOrderDate: row.lastOrderDate || null
    }));
  } catch (error) {
    console.error('Error in getTopCustomers:', error);
    return [];
  }
};

// ============================================
// CUSTOMIZATION QUERIES
// ============================================

export const getCustomizationMetrics = async (days?: number, filters: SalesFilters = {}) => {
  try {
    const normalizedDays =
      typeof days === 'number' && Number.isFinite(days) ? Math.max(1, Math.min(days, 3650)) : 0;
    const { joins, where, params } = buildCustomizationFilterClauses(normalizedDays, filters);

    const joinsWithSalesOrder = [...joins];
    const hasSalesOrderJoin = joins.some((join) => join.includes(' sales_order so '));
    if (!hasSalesOrderJoin) {
      joinsWithSalesOrder.push(
        "LEFT JOIN sales_order so ON so.quote_id = qi.quote_id AND so.status NOT IN ('canceled', 'closed')"
      );
    }

    // Count rows where additional_options contains customization data
    const jsonConditions = '(JSON_EXTRACT(qio.value, \'$.*\') IS NOT NULL AND (JSON_CONTAINS_PATH(qio.value, \'one\', \'$.custom_length\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.room_width\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.room_length\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.sample_color\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.configurable_product_name\')))';
    const baseWhere = [
      "qio.code = 'additional_options'",
      'qio.value IS NOT NULL',
      jsonConditions
    ].join(' AND ');
    
    const allWhere = where.length > 0 
      ? `${baseWhere} AND ${where.join(' AND ')}`
      : baseWhere;
    
    const query = `
      SELECT 
        COUNT(*) as totalCustomizations,
        COUNT(DISTINCT qi.quote_id) as uniqueQuotes,
        COUNT(DISTINCT CASE WHEN so.entity_id IS NOT NULL THEN qi.quote_id END) as completedQuotes,
        COUNT(DISTINCT qio.product_id) as uniqueProducts
      FROM quote_item_option qio
      INNER JOIN quote_item qi ON qio.item_id = qi.item_id
      ${joinsWithSalesOrder.join('\n')}
      WHERE ${allWhere}
    `;
    
    const results = await executeQuery<any>(query, params);
    const result = results[0] || {};

    // Completed orders (converted carts)
    let completedOrders = 0;
    try {
      const { joins: salesJoins, where: salesWhere, params: salesParams } = buildSalesFilterClauses(
        normalizedDays,
        filters
      );
      const completedQuery = `
        SELECT COUNT(*) as completedOrders
        FROM sales_order so
        ${salesJoins.join('\n')}
        WHERE ${salesWhere.join(' AND ')}
          AND so.quote_id IS NOT NULL
      `;
      const completedResults = await executeQuery<any>(completedQuery, salesParams);
      completedOrders = parseInt(completedResults[0]?.completedOrders || '0');
    } catch (error) {
      console.error('Error getting completed customization orders:', error);
    }

    // Open quotes (active carts)
    let openQuotes = 0;
    try {
      const quoteWhere: string[] = ['q.is_active = 1'];
      const quoteParams: any[] = [];

      if (filters.startDate && filters.endDate) {
        quoteWhere.push('q.created_at >= ? AND q.created_at <= ?');
        quoteParams.push(filters.startDate, filters.endDate);
      } else if (normalizedDays > 0) {
        quoteWhere.push('q.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)');
        quoteParams.push(normalizedDays);
      }

      const openQuery = `
        SELECT COUNT(*) as openQuotes
        FROM quote q
        WHERE ${quoteWhere.join(' AND ')}
      `;
      const openResults = await executeQuery<any>(openQuery, quoteParams);
      openQuotes = parseInt(openResults[0]?.openQuotes || '0');
    } catch (error) {
      console.error('Error getting open customization quotes:', error);
    }

    const totalQuotes = completedOrders + openQuotes;
    const completionRate = totalQuotes > 0 ? (completedOrders / totalQuotes) * 100 : 0;
    
    // Calculate average value
    let avgValue = 0;
    try {
      const avgValueQuery = `
        SELECT COALESCE(AVG(qi.base_price), 0) as avgValue
        FROM quote_item qi
        INNER JOIN quote_item_option qio ON qi.item_id = qio.item_id
        ${joins.join('\n')}
        WHERE qio.code = 'additional_options'
          AND qio.value IS NOT NULL
          AND (
            JSON_CONTAINS_PATH(qio.value, 'one', '$.custom_length')
            OR JSON_CONTAINS_PATH(qio.value, 'one', '$.room_width')
            OR JSON_CONTAINS_PATH(qio.value, 'one', '$.room_length')
          )
          AND ${where.length > 0 ? where.join(' AND ') : '1=1'}
      `;
      const avgValueResults = await executeQuery<any>(avgValueQuery, params);
      avgValue = parseFloat(avgValueResults[0]?.avgValue || '0');
    } catch (error) {
      console.error('Error getting avg value:', error);
    }
    
    return {
      totalCustomizations: parseInt(result?.totalCustomizations || '0'),
      uniqueQuotes: parseInt(result?.uniqueQuotes || '0'),
      completedOrders,
      completionRate: parseFloat(completionRate.toFixed(2)),
      averageValue: avgValue,
      popularOptions: [] as string[]
    };
  } catch (error) {
    console.error('Error in getCustomizationMetrics:', error);
    return {
      totalCustomizations: 0,
      completionRate: 0,
      averageValue: 0,
      popularOptions: [] as string[]
    };
  }
};

export const getPopularCustomizations = async (limit: number = 10, days?: number, filters: SalesFilters = {}) => {
  try {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const normalizedDays =
      typeof days === 'number' && Number.isFinite(days) ? Math.max(1, Math.min(days, 3650)) : 0;
    const { joins, where, params } = buildCustomizationFilterClauses(normalizedDays, filters);

    // Extract customization keys from JSON and count them
    const jsonConditions = '(JSON_CONTAINS_PATH(qio.value, \'one\', \'$.custom_length\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.room_width\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.room_length\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.sample_color\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.configurable_product_name\'))';
    const baseWhere = [
      "qio.code = 'additional_options'",
      'qio.value IS NOT NULL',
      jsonConditions
    ].join(' AND ');
    
    const allWhere = where.length > 0 
      ? `${baseWhere} AND ${where.join(' AND ')}`
      : baseWhere;
    
    const query = `
      SELECT 
        COALESCE(
          CASE 
            WHEN JSON_CONTAINS_PATH(qio.value, 'one', '$.custom_length') THEN 'Custom Length'
            WHEN JSON_CONTAINS_PATH(qio.value, 'one', '$.room_width') THEN 'Room Width'
            WHEN JSON_CONTAINS_PATH(qio.value, 'one', '$.room_length') THEN 'Room Length'
            WHEN JSON_CONTAINS_PATH(qio.value, 'one', '$.sample_color') THEN 'Color'
            WHEN JSON_CONTAINS_PATH(qio.value, 'one', '$.configurable_product_name') THEN 'Product Configuration'
            ELSE 'Other'
          END,
          'Unknown'
        ) as optionName,
        COALESCE(
          CASE 
            WHEN JSON_CONTAINS_PATH(qio.value, 'one', '$.custom_length') THEN JSON_UNQUOTE(JSON_EXTRACT(qio.value, '$.custom_length.value'))
            WHEN JSON_CONTAINS_PATH(qio.value, 'one', '$.room_width') THEN JSON_UNQUOTE(JSON_EXTRACT(qio.value, '$.room_width.value'))
            WHEN JSON_CONTAINS_PATH(qio.value, 'one', '$.room_length') THEN JSON_UNQUOTE(JSON_EXTRACT(qio.value, '$.room_length.value'))
            WHEN JSON_CONTAINS_PATH(qio.value, 'one', '$.sample_color') THEN JSON_UNQUOTE(JSON_EXTRACT(qio.value, '$.sample_color.value'))
            ELSE 'N/A'
          END,
          'N/A'
        ) as optionValue,
        COUNT(*) as uses,
        COUNT(DISTINCT qi.quote_id) as uniqueQuotes
      FROM quote_item_option qio
      INNER JOIN quote_item qi ON qio.item_id = qi.item_id
      ${joins.join('\n')}
      WHERE ${allWhere}
      GROUP BY optionName, optionValue
      ORDER BY uses DESC
      LIMIT ?
    `;
    
    const results = await executeQuery<any>(query, [...params, safeLimit]);
    
    return results.map((row: any) => ({
      optionName: row.optionName || '',
      optionValue: row.optionValue || '',
      uses: parseInt(row.uses || '0'),
      uniqueQuotes: parseInt(row.uniqueQuotes || '0')
    }));
  } catch (error) {
    console.error('Error in getPopularCustomizations:', error);
    return [];
  }
};

export const getCustomizationTrends = async (days?: number, filters: SalesFilters = {}) => {
  try {
    const normalizedDays =
      typeof days === 'number' && Number.isFinite(days) ? Math.max(1, Math.min(days, 3650)) : 0;
    const { joins, where, params } = buildCustomizationFilterClauses(normalizedDays, filters);

    const jsonConditions = '(JSON_CONTAINS_PATH(qio.value, \'one\', \'$.custom_length\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.room_width\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.room_length\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.sample_color\'))';
    const baseWhere = [
      "qio.code = 'additional_options'",
      'qio.value IS NOT NULL',
      jsonConditions
    ].join(' AND ');
    
    const allWhere = where.length > 0 
      ? `${baseWhere} AND ${where.join(' AND ')}`
      : baseWhere;
    
    const query = `
      SELECT 
        DATE(qi.created_at) as date,
        COUNT(*) as customizations,
        COUNT(DISTINCT qi.quote_id) as uniqueQuotes
      FROM quote_item_option qio
      INNER JOIN quote_item qi ON qio.item_id = qi.item_id
      ${joins.join('\n')}
      WHERE ${allWhere}
      GROUP BY DATE(qi.created_at)
      ORDER BY date ASC
    `;
    
    const results = await executeQuery<any>(query, params);
    
    return results.map((row: any) => ({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
      customizations: parseInt(row.customizations || '0'),
      uniqueQuotes: parseInt(row.uniqueQuotes || '0')
    }));
  } catch (error) {
    console.error('Error in getCustomizationTrends:', error);
    return [];
  }
};

export const getCustomizationsByCategory = async (days?: number, filters: SalesFilters = {}) => {
  try {
    const normalizedDays =
      typeof days === 'number' && Number.isFinite(days) ? Math.max(1, Math.min(days, 3650)) : 0;
    const { joins, where, params } = buildCustomizationFilterClauses(normalizedDays, filters);

    // Group by product SKU - count customizations from additional_options
    const jsonConditions = '(JSON_CONTAINS_PATH(qio.value, \'one\', \'$.custom_length\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.room_width\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.room_length\') OR JSON_CONTAINS_PATH(qio.value, \'one\', \'$.sample_color\'))';
    const baseWhere = [
      "qio.code = 'additional_options'",
      'qio.value IS NOT NULL',
      jsonConditions
    ].join(' AND ');
    
    const allWhere = where.length > 0 
      ? `${baseWhere} AND ${where.join(' AND ')}`
      : baseWhere;
    
    const query = `
      SELECT 
        COALESCE(MAX(qi.name), qi.sku, 'Unknown') as category,
        COUNT(DISTINCT qio.item_id) as customizations,
        COUNT(DISTINCT qi.quote_id) as uniqueQuotes
      FROM quote_item_option qio
      INNER JOIN quote_item qi ON qio.item_id = qi.item_id
      ${joins.join('\n')}
      WHERE ${allWhere}
      GROUP BY qi.sku
      ORDER BY customizations DESC
      LIMIT 20
    `;
    
    const results = await executeQuery<any>(query, params);
    
    return results.map((row: any) => ({
      category: row.category || 'Uncategorized',
      customizations: parseInt(row.customizations || '0'),
      uniqueQuotes: parseInt(row.uniqueQuotes || '0')
    }));
  } catch (error) {
    console.error('Error in getCustomizationsByCategory:', error);
    return [];
  }
};

// ============================================
// DASHBOARD QUERIES
// ============================================

export const getRecentActivity = async (limit: number = 10) => {
  try {
    // Get recent orders
    const ordersQuery = `
      SELECT 
        so.entity_id as id,
        'order' as type,
        CONCAT('New order #', COALESCE(so.increment_id, so.entity_id), ' - $', FORMAT(COALESCE(so.base_grand_total, 0), 2)) as message,
        so.created_at as timestamp,
        so.base_grand_total as value
      FROM sales_order so
      WHERE so.status NOT IN ('canceled', 'closed')
      ORDER BY so.created_at DESC
      LIMIT ?
    `;
    
    const orders = await executeQuery<any>(ordersQuery, [limit]);
    
    // Get recent customers
    const customersQuery = `
      SELECT 
        ce.entity_id as id,
        'customer' as type,
        CONCAT('New customer: ', COALESCE(ce.email, 'Unknown')) as message,
        ce.created_at as timestamp,
        NULL as value
      FROM customer_entity ce
      ORDER BY ce.created_at DESC
      LIMIT ?
    `;
    
    const customers = await executeQuery<any>(customersQuery, [limit]);
    
    // Combine and sort
    const allActivity = [...orders, ...customers]
      .sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);
    
    return allActivity.map((row: any) => ({
      id: row.id,
      type: row.type,
      message: row.message || '',
      timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : '',
      value: row.value ? parseFloat(row.value) : undefined
    }));
  } catch (error) {
    console.error('Error in getRecentActivity:', error);
    return [];
  }
};

// ============================================
// DASHBOARD METRICS QUERIES
// ============================================

export const getDashboardMetrics = async () => {
  try {
    // Get total views
    const viewsQuery = `
      SELECT COALESCE(SUM(views), 0) as totalViews
      FROM (
        SELECT COUNT(*) as views
        FROM report_viewed_product_index
        GROUP BY product_id
      ) as product_views
    `;
    const viewsResults = await executeQuery<any>(viewsQuery);
    const totalViews = parseInt(viewsResults[0]?.totalViews || '0');
    
    // Get total orders
    const ordersQuery = `
      SELECT COUNT(*) as totalOrders
      FROM sales_order
      WHERE status NOT IN ('canceled', 'closed')
    `;
    const ordersResults = await executeQuery<any>(ordersQuery);
    const totalOrders = parseInt(ordersResults[0]?.totalOrders || '0');
    
    // Calculate conversion rate (orders / views * 100)
    const conversionRate = totalViews > 0 ? (totalOrders / totalViews * 100) : 0;
    
    // Get active carts
    const cartsQuery = `
      SELECT 
        COUNT(*) as activeCarts,
        COALESCE(SUM(grand_total), 0) as cartValue
      FROM quote
      WHERE is_active = 1
    `;
    const cartsResults = await executeQuery<any>(cartsQuery);
    const activeCarts = parseInt(cartsResults[0]?.activeCarts || '0');
    const cartValue = parseFloat(cartsResults[0]?.cartValue || '0');
    
    // Get cart abandonment rate
    // Abandoned carts = active carts that haven't been converted to orders
    const abandonmentQuery = `
      SELECT 
        COUNT(*) as abandonedCarts
      FROM quote q
      WHERE q.is_active = 1
        AND NOT EXISTS (
          SELECT 1 FROM sales_order so
          WHERE so.quote_id = q.entity_id
          AND so.status NOT IN ('canceled', 'closed')
        )
    `;
    const abandonmentResults = await executeQuery<any>(abandonmentQuery);
    const abandonedCarts = parseInt(abandonmentResults[0]?.abandonedCarts || '0');
    const totalCarts = activeCarts + totalOrders;
    const abandonmentRate = totalCarts > 0 ? (abandonedCarts / totalCarts * 100) : 0;
    
    // Calculate growth (first half vs second half)
    let conversionGrowth = 0;
    let abandonmentGrowth = 0;
    let cartsGrowth = 0;
    
    try {
      // Conversion rate growth
      const firstHalfViews = totalViews / 2;
      const firstHalfOrders = totalOrders / 2;
      const firstHalfConversion = firstHalfViews > 0 ? (firstHalfOrders / firstHalfViews * 100) : 0;
      conversionGrowth = firstHalfConversion > 0 
        ? ((conversionRate - firstHalfConversion) / firstHalfConversion) * 100 
        : 0;
      
      // For abandonment and carts, use simple comparison
      abandonmentGrowth = 0; // Would need historical data
      cartsGrowth = 0; // Would need historical data
    } catch (error) {
      console.error('Error calculating growth:', error);
    }
    
    return {
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      conversionGrowth: parseFloat(conversionGrowth.toFixed(2)),
      abandonmentRate: parseFloat(abandonmentRate.toFixed(2)),
      abandonmentGrowth: parseFloat(abandonmentGrowth.toFixed(2)),
      activeCarts: activeCarts,
      cartValue: cartValue,
      cartsGrowth: parseFloat(cartsGrowth.toFixed(2))
    };
  } catch (error) {
    console.error('Error in getDashboardMetrics:', error);
    return {
      conversionRate: 0,
      conversionGrowth: 0,
      abandonmentRate: 0,
      abandonmentGrowth: 0,
      activeCarts: 0,
      cartValue: 0,
      cartsGrowth: 0
    };
  }
};

