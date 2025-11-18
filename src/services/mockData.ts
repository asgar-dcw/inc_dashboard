import {
  SalesOverview,
  SalesTrend,
  TopProduct,
  ProductPerformance,
  CategoryPerformance,
  CustomerOverview,
  CustomerSegment,
  CustomizationMetrics,
  RecentActivity
} from '../types';

export const getSalesOverview = (): SalesOverview => ({
  totalRevenue: 1234567,
  totalOrders: 3456,
  averageOrderValue: 357.12,
  uniqueCustomers: 987,
  growth: 23.5
});

export const getSalesTrends = (): SalesTrend[] => {
  const data: SalesTrend[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 12; i++) {
    data.push({
      date: months[i],
      revenue: Math.floor(80000 + Math.random() * 60000),
      orders: Math.floor(250 + Math.random() * 150),
      customers: Math.floor(120 + Math.random() * 80)
    });
  }
  return data;
};

export const getTopProducts = (): TopProduct[] => [
  { id: 1, name: 'Custom Wood Table', sales: 234, revenue: 45678, growth: 15.3 },
  { id: 2, name: 'Office Desk Premium', sales: 189, revenue: 38900, growth: 12.7 },
  { id: 3, name: 'Gaming Chair Elite', sales: 167, revenue: 35400, growth: -5.2 },
  { id: 4, name: 'Standing Desk Pro', sales: 145, revenue: 32100, growth: 22.1 },
  { id: 5, name: 'Bookshelf Deluxe', sales: 123, revenue: 28900, growth: 8.9 }
];

export const getProductPerformance = (): ProductPerformance[] => [
  { id: 1, name: 'Custom Wood Table', views: 5678, sales: 234, conversionRate: 4.12, revenue: 45678 },
  { id: 2, name: 'Office Desk Premium', views: 4892, sales: 189, conversionRate: 3.86, revenue: 38900 },
  { id: 3, name: 'Gaming Chair Elite', views: 6234, sales: 167, conversionRate: 2.68, revenue: 35400 },
  { id: 4, name: 'Standing Desk Pro', views: 3456, sales: 145, conversionRate: 4.19, revenue: 32100 },
  { id: 5, name: 'Bookshelf Deluxe', views: 4123, sales: 123, conversionRate: 2.98, revenue: 28900 },
  { id: 6, name: 'Conference Table', views: 2890, sales: 98, conversionRate: 3.39, revenue: 24500 },
  { id: 7, name: 'Storage Cabinet', views: 3456, sales: 145, conversionRate: 4.19, revenue: 21300 },
  { id: 8, name: 'Lounge Chair', views: 2345, sales: 87, conversionRate: 3.71, revenue: 19800 }
];

export const getCategoryPerformance = (): CategoryPerformance[] => [
  { category: 'Tables', revenue: 145000, products: 23, growth: 18.5 },
  { category: 'Chairs', revenue: 98000, products: 34, growth: 12.3 },
  { category: 'Desks', revenue: 123000, products: 18, growth: 25.7 },
  { category: 'Storage', revenue: 67000, products: 28, growth: 8.9 },
  { category: 'Accessories', revenue: 45000, products: 56, growth: -3.2 }
];

export const getCustomerOverview = (): CustomerOverview => ({
  totalCustomers: 12456,
  newCustomers: 1234,
  returningCustomers: 789,
  churnRate: 5.6
});

export const getCustomerSegments = (): CustomerSegment[] => [
  { segment: 'VIP Customers', count: 456, percentage: 3.7, revenue: 234000 },
  { segment: 'Frequent Buyers', count: 1234, percentage: 9.9, revenue: 567000 },
  { segment: 'Regular Customers', count: 4567, percentage: 36.7, revenue: 345000 },
  { segment: 'Occasional Buyers', count: 3890, percentage: 31.2, revenue: 189000 },
  { segment: 'One-time Buyers', count: 2309, percentage: 18.5, revenue: 98000 }
];

export const getCustomizationMetrics = (): CustomizationMetrics => ({
  totalCustomizations: 2345,
  completionRate: 78.5,
  averageValue: 156.78,
  popularOptions: ['Custom Size', 'Wood Type', 'Finish Color', 'Hardware Style', 'Edge Profile']
});

export const getRecentActivity = (): RecentActivity[] => [
  { id: 1, type: 'order', message: 'New order #3456 - Custom Wood Table', timestamp: '2 min ago', value: 1299 },
  { id: 2, type: 'customer', message: 'New customer registration - John Smith', timestamp: '5 min ago' },
  { id: 3, type: 'order', message: 'Order #3455 shipped - Standing Desk Pro', timestamp: '12 min ago', value: 899 },
  { id: 4, type: 'product', message: 'Product viewed 50 times - Gaming Chair Elite', timestamp: '18 min ago' },
  { id: 5, type: 'order', message: 'New order #3454 - Office Desk Premium', timestamp: '23 min ago', value: 1499 },
  { id: 6, type: 'customer', message: 'Customer review posted - 5 stars', timestamp: '34 min ago' }
];

export const getHourlyData = () => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    orders: Math.floor(Math.random() * 50) + 10,
    revenue: Math.floor(Math.random() * 5000) + 1000
  }));
};

export const getMonthlyGrowth = () => {
  return Array.from({ length: 6 }, (_, i) => ({
    month: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    revenue: Math.floor(80000 + Math.random() * 40000),
    customers: Math.floor(800 + Math.random() * 400),
    orders: Math.floor(250 + Math.random() * 150)
  }));
};
