// Shared query functions for Vercel serverless functions
// This file contains query logic adapted from backend/src/services/queries.ts
// but uses the serverless database connection

import { executeQuery } from './db';

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

  return { joins, where, params, hasFilters: Boolean(filters.country || filters.paymentMethod) };
};

// Export key query functions - we'll add more as needed
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
    const { joins, where, params } = buildSalesFilterClauses(intervalDays, filters);

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
    
    const results = await executeQuery<any>(query, [...params, safeLimit]);
    
    return results.map((product: any) => ({
      id: product.product_id,
      name: product.product_name || product.sku || `Product #${product.product_id}`,
      sales: parseInt(product.sales || '0'),
      revenue: parseFloat(product.revenue || '0'),
      quantity: parseInt(product.quantity || '0'),
      growth: 0
    }));
  } catch (error) {
    console.error('[getTopProducts] ERROR:', error);
    return [];
  }
};

// Re-export buildSalesFilterClauses for use in other query functions
export { buildSalesFilterClauses };

