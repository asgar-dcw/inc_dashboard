export interface SalesOverview {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  growth: number;
}

export interface SalesTrend {
  date: string;
  revenue: number;
  orders: number;
  customers?: number;
}

export interface TopProduct {
  id: number;
  name: string;
  sales: number;
  revenue: number;
  growth: number;
}

export interface ProductPerformance {
  id: number;
  name: string;
  views: number;
  sales: number;
  conversionRate: number;
  revenue: number;
}

export interface ProductMetrics {
  totalProducts: number;
  totalViews: number;
  totalOrders: number;
  avgConversion: number;
}

export interface ViewedNotPurchasedProduct {
  productId: number;
  sku: string;
  name: string;
  views: number;
  orders: number;
}

export interface CategoryPerformance {
  category: string;
  revenue: number;
  products: number;
  growth: number;
}

export interface CustomerOverview {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  churnRate: number;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface CustomizationMetrics {
  totalCustomizations: number;
  uniqueQuotes?: number;
  completedOrders?: number;
  completionRate: number;
  averageValue: number;
  popularOptions: string[];
}

export interface RecentActivity {
  id: number;
  type: 'order' | 'customer' | 'product';
  message: string;
  timestamp: string;
  value?: number;
}

export interface SalesFilterParams {
  country?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}
