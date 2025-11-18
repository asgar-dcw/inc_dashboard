import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Package, Eye, TrendingUp, Star } from 'lucide-react';
import { StatCard } from '../components/cards/StatCard';
import { MetricCard } from '../components/cards/MetricCard';
import { BarChartComponent } from '../components/charts/BarChartComponent';
import { LineChartComponent } from '../components/charts/LineChartComponent';
import { LoadingScreen } from '../components/LoadingScreen';
import { productsApi, salesApi } from '../services/api';
import { DataAvailabilityNotice } from '../components/DataAvailabilityNotice';
import type {
  ProductPerformance,
  CategoryPerformance,
  SalesFilterParams,
  ProductMetrics,
  ViewedNotPurchasedProduct
} from '../types';

export const Products = () => {
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [searchAnalytics, setSearchAnalytics] = useState<any[]>([]);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [initialTrends, setInitialTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('All');
  const [filterOptions, setFilterOptions] = useState<{ countries: string[]; paymentMethods: string[] }>({
    countries: [],
    paymentMethods: []
  });
  const [revenueFilter, setRevenueFilter] = useState<'top5' | 'bottom5'>('top5');
  const [volumeFilter, setVolumeFilter] = useState<'top5' | 'bottom5'>('top5');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalViews: 0,
    totalOrders: 0,
    avgConversion: 0,
    avgRating: 4.7
  });
  const [unpurchasedProducts, setUnpurchasedProducts] = useState<ViewedNotPurchasedProduct[]>([]);
  const [unpurchasedLoading, setUnpurchasedLoading] = useState<boolean>(true);
  const [unpurchasedError, setUnpurchasedError] = useState<string | null>(null);

  // Calculate days for API calls based on filters
  const getDaysFromFilters = useMemo<number | undefined>(() => {
    if (selectedYear === 'All') {
      return undefined;
    }

    if (selectedMonth === 'All') {
      return 365; // Full year
    } else {
      const year = parseInt(selectedYear, 10);
      const month = parseInt(selectedMonth, 10) - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return daysInMonth;
    }
  }, [selectedYear, selectedMonth]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const options = await salesApi.getFilters();
        setFilterOptions(options);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  // Calculate date range when specific month is selected
  const getDateRange = useMemo(() => {
    if (selectedYear === 'All') {
      return { startDate: undefined, endDate: undefined };
    }

    const year = parseInt(selectedYear, 10);
    const pad = (value: number) => value.toString().padStart(2, '0');

    if (selectedMonth === 'All') {
      return {
        startDate: `${year}-01-01 00:00:00`,
        endDate: `${year}-12-31 23:59:59`
      };
    }

    const month = parseInt(selectedMonth, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    return {
      startDate: `${year}-${pad(month)}-01 00:00:00`,
      endDate: `${year}-${pad(month)}-${pad(daysInMonth)} 23:59:59`
    };
  }, [selectedYear, selectedMonth]);

  // Build filter params object
  const activeFilters = useMemo<SalesFilterParams>(() => {
    const filters: SalesFilterParams = {};
    if (selectedCountry !== 'All') {
      filters.country = selectedCountry;
    }
    if (selectedPaymentMethod !== 'All') {
      filters.paymentMethod = selectedPaymentMethod;
    }
    // Add date range when specific month/year is selected
    if (selectedYear !== 'All') {
      filters.startDate = getDateRange.startDate;
      filters.endDate = getDateRange.endDate;
    }
    return filters;
  }, [selectedCountry, selectedPaymentMethod, getDateRange]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setUnpurchasedLoading(true);
        setUnpurchasedError(null);
        const days = getDaysFromFilters;
        const fallbackDays = days ?? 3650;
        
        // Fetch main data first
        const [
          productData,
          categoryData,
          searchData,
          trendsData,
          metricsData
        ] = await Promise.all([
          productsApi.getPerformance(20, days, activeFilters),
          salesApi.getCategories(fallbackDays, activeFilters),
          productsApi.getSearchAnalytics(10, days),
          salesApi.getTrends(fallbackDays, activeFilters),
          productsApi.getMetrics(days, activeFilters)
        ]);
        
        setProducts(productData);
        setCategories(categoryData);
        setSearchAnalytics(searchData);
        setSalesTrends(trendsData);
        
        try {
          const unpurchasedData = await productsApi.getTopUnpurchased(5, days, activeFilters);
          setUnpurchasedProducts(Array.isArray(unpurchasedData) ? unpurchasedData : []);
        } catch (error) {
          console.warn('Failed to fetch unpurchased products:', error);
          setUnpurchasedProducts([]);
          setUnpurchasedError('Unable to load viewed-but-not-purchased insights right now.');
        } finally {
          setUnpurchasedLoading(false);
        }

        const noFiltersApplied =
          selectedYear === 'All' &&
          selectedMonth === 'All' &&
          selectedCountry === 'All' &&
          selectedPaymentMethod === 'All';

        if (initialTrends.length === 0 && noFiltersApplied) {
          setInitialTrends(trendsData);
        }
        
        // Update stats with backend metrics
        const metrics: ProductMetrics = metricsData;
        
        setStats({
          totalProducts: metrics.totalProducts,
          totalViews: metrics.totalViews,
          totalOrders: metrics.totalOrders,
          avgConversion: metrics.avgConversion,
          avgRating: 4.7
        });
      } catch (error) {
        console.error('Error fetching products data:', error);
        setUnpurchasedLoading(false);
        setUnpurchasedError(prev => prev ?? 'Unable to load product insights at the moment.');
      } finally {
        setLoading(false);
        setUnpurchasedLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [getDaysFromFilters, activeFilters, getDateRange]);

  const monthNames = useMemo(
    () => [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ],
    []
  );

  const trendOptionsSource = initialTrends.length > 0 ? initialTrends : salesTrends;

  const yearOptions = useMemo(() => {
    const years = Array.from(
      new Set(
        trendOptionsSource.map((trend) => {
          const [year] = trend.date.split('-');
          return parseInt(year, 10);
        })
      )
    ).filter((year) => !Number.isNaN(year));

    return years.sort((a, b) => b - a);
  }, [trendOptionsSource]);

  const monthOptions = useMemo(() => {
    if (selectedYear === 'All') {
      return [];
    }

    const months = Array.from(
      new Set(
        trendOptionsSource
          .filter((trend) => trend.date.startsWith(`${selectedYear}-`))
          .map((trend) => {
            const [, month] = trend.date.split('-');
            return parseInt(month, 10);
          })
      )
    ).filter((month) => !Number.isNaN(month));

    return months.sort((a, b) => a - b);
  }, [trendOptionsSource, selectedYear]);

  useEffect(() => {
    if (selectedYear === 'All') {
      setSelectedMonth('All');
      return;
    }

    if (
      selectedMonth !== 'All' &&
      !monthOptions.includes(parseInt(selectedMonth, 10))
    ) {
      setSelectedMonth('All');
    }
  }, [selectedYear, selectedMonth, monthOptions]);

  const handleYearChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value);
  };

  const handleMonthChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(event.target.value);
  };

  const handleRevenueFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setRevenueFilter(event.target.value as 'top5' | 'bottom5');
  };

  const handleVolumeFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setVolumeFilter(event.target.value as 'top5' | 'bottom5');
  };

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.target.value);
  };

  const handlePaymentMethodChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedPaymentMethod(event.target.value);
  };

  // Filter products by revenue (top 5 or bottom 5)
  const filteredProductsByRevenue = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const sorted = [...products].sort((a, b) => b.revenue - a.revenue);
    
    if (revenueFilter === 'top5') {
      return sorted.slice(0, 5);
    } else {
      return sorted.slice(-5).reverse();
    }
  }, [products, revenueFilter]);

  // Filter products by volume (sales) (top 5 or bottom 5)
  const filteredProductsByVolume = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    const sorted = [...products].sort((a, b) => b.sales - a.sales);
    
    if (volumeFilter === 'top5') {
      return sorted.slice(0, 5);
    } else {
      return sorted.slice(-5).reverse();
    }
  }, [products, volumeFilter]);

  const noDataAvailable = !loading && products.length === 0 && salesTrends.length === 0;

  if (loading) {
    return <LoadingScreen message="Loading products data..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          change={5.2}
          icon={Package}
          iconColor="#F76C2F"
          subtitle="Catalog size"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          change={18.3}
          icon={Eye}
          iconColor="#3B82F6"
          subtitle={selectedYear !== 'All' ? `${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear}` : 'All Time'}
        />
        <StatCard
          title="Avg Conversion"
          value={stats.avgConversion}
          valueSuffix="%"
          valueDecimals={1}
          change={2.1}
          icon={TrendingUp}
          iconColor="#10B981"
          subtitle="Views to sales"
        />
        <StatCard
          title="Avg Rating"
          value="N/A"
          change={0}
          icon={Star}
          iconColor="#F59E0B"
          subtitle="No data source"
        />
      </div>

      <DataAvailabilityNotice
        show={noDataAvailable}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        description="No product performance data was found for the selected filters. Try choosing a wider date range or resetting the filters."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-text-secondary">
            Product Performance Filters
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="mt-1 rounded-lg border border-button-dark bg-primary-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="All">All Years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              disabled={selectedYear === 'All'}
              className="mt-1 rounded-lg border border-button-dark bg-primary-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="All">All Months</option>
              {monthOptions.map((month) => (
                <option key={month} value={month.toString()}>
                  {monthNames[month - 1]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={handleCountryChange}
              className="mt-1 rounded-lg border border-button-dark bg-primary-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="All">All Countries</option>
              {filterOptions.countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted">
              Payment Method
            </label>
            <select
              value={selectedPaymentMethod}
              onChange={handlePaymentMethodChange}
              className="mt-1 rounded-lg border border-button-dark bg-primary-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="All">All Methods</option>
              {filterOptions.paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <MetricCard title={`Product Performance${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-button-dark">
                <th className="text-left py-3 px-4 text-text-muted text-sm font-semibold">Product</th>
                <th className="text-right py-3 px-4 text-text-muted text-sm font-semibold">Views</th>
                <th className="text-right py-3 px-4 text-text-muted text-sm font-semibold">Sales</th>
                <th className="text-right py-3 px-4 text-text-muted text-sm font-semibold">Conv. Rate</th>
                <th className="text-right py-3 px-4 text-text-muted text-sm font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <motion.tr
                  key={`${product.id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-button-dark hover:bg-button-dark transition-colors cursor-pointer"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-dark rounded-lg flex items-center justify-center text-accent font-bold text-sm">
                        {product.name.charAt(0)}
                      </div>
                      <span className="text-text-primary font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-text-secondary">
                    {product.views.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-text-secondary">
                    {product.sales.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={`font-semibold ${
                      product.conversionRate > 3.5 ? 'text-green-400' : 'text-text-secondary'
                    }`}>
                      {product.conversionRate}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-accent font-semibold">
                    ${product.revenue.toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </MetricCard>

      <MetricCard title="Most Viewed Without Orders">
        <div className="space-y-3">
          {unpurchasedLoading ? (
            <>
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="flex animate-pulse items-center justify-between rounded-xl border border-button-dark bg-primary-secondary px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-button-dark" />
                    <div className="space-y-2">
                      <div className="h-3 w-32 rounded bg-button-dark" />
                      <div className="h-3 w-48 rounded bg-button-dark" />
                    </div>
                  </div>
                  <div className="h-5 w-20 rounded-full bg-button-dark" />
                </div>
              ))}
            </>
          ) : unpurchasedError ? (
            <p className="text-sm text-red-400">{unpurchasedError}</p>
          ) : unpurchasedProducts.length > 0 ? (
            unpurchasedProducts.map((product, index) => (
              <motion.div
                key={`${product.productId}-${index}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between rounded-xl border border-button-dark bg-primary-secondary px-4 py-3 hover:border-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 text-sm font-semibold text-white">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {product.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      SKU: {product.sku} •{' '}
                      {product.views.toLocaleString()} views •{' '}
                      {product.orders.toLocaleString()}{' '}
                      {product.orders === 1 ? 'order' : 'orders'}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  {product.orders === 0 ? 'Opportunity' : 'Low Conversion'}
                </span>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-text-muted">
              No high-intent-but-unconverted products for the current filters. Try broadening the date range or adjusting filters to uncover more insights.
            </p>
          )}
        </div>
        {!unpurchasedLoading && !unpurchasedError && unpurchasedProducts.length > 0 && (
          <p className="mt-4 text-xs text-text-muted">
            {unpurchasedProducts.some(product => product.orders === 0)
              ? 'Highlight products drawing the most interest without any matching orders. Pair them with targeted offers or inventory-check nudges to convert that demand.'
              : 'Every highly viewed product in this selection has at least one order, but these are the lowest-converting SKUs. Consider fresh campaigns or bundle offers to lift conversion.'}
          </p>
        )}
      </MetricCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard 
          title={`Products by Revenue${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}
        >
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase text-text-muted mb-2">
              Filter
            </label>
            <select
              value={revenueFilter}
              onChange={handleRevenueFilterChange}
              className="w-full rounded-lg border border-button-dark bg-primary-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="top5">Top 5 by Revenue</option>
              <option value="bottom5">Bottom 5 by Revenue</option>
            </select>
          </div>
          <BarChartComponent
            data={filteredProductsByRevenue}
            dataKeys={[
              { key: 'revenue', color: '#F76C2F', name: 'Revenue' }
            ]}
            xAxisKey="name"
            height={300}
          />
        </MetricCard>

        <MetricCard 
          title={`Products by Volume${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}
        >
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase text-text-muted mb-2">
              Filter
            </label>
            <select
              value={volumeFilter}
              onChange={handleVolumeFilterChange}
              className="w-full rounded-lg border border-button-dark bg-primary-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="top5">Top 5 by Volume</option>
              <option value="bottom5">Bottom 5 by Volume</option>
            </select>
          </div>
          <BarChartComponent
            data={filteredProductsByVolume}
            dataKeys={[
              { key: 'sales', color: '#3B82F6', name: 'Volume (Sales)' }
            ]}
            xAxisKey="name"
            height={300}
          />
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard title={`Category Distribution${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
          <BarChartComponent
            data={categories.map(cat => ({
              name: cat.category,
              revenue: cat.revenue
            }))}
            dataKeys={[
              { key: 'revenue', color: '#F76C2F', name: 'Revenue' }
            ]}
            xAxisKey="name"
            height={300}
            layout="horizontal"
          />
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard title={`Views vs Sales Correlation${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
          <LineChartComponent
            data={products.slice(0, 8)}
            dataKeys={[
              { key: 'views', color: '#3B82F6', name: 'Views' },
              { key: 'sales', color: '#F76C2F', name: 'Sales' }
            ]}
            xAxisKey="name"
            height={300}
          />
        </MetricCard>

        <MetricCard title={`Product Growth Trends${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
          <LineChartComponent
            data={products.slice(0, 8).map((p, i) => ({ name: p.name, views: p.views, sales: p.sales }))}
            dataKeys={[
              { key: 'views', color: '#3B82F6', name: 'Views' },
              { key: 'sales', color: '#F76C2F', name: 'Sales' }
            ]}
            xAxisKey="name"
            height={300}
          />
        </MetricCard>
      </div>

      <MetricCard title={`Category Performance Metrics${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ delay: index * 0.1 }}
              className="bg-button-dark rounded-xl p-5 border border-button-darkAlt hover:border-accent transition-all cursor-pointer"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-dark rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package size={24} className="text-accent" />
                </div>
                <h4 className="text-text-primary font-semibold mb-1">{category.category}</h4>
                <p className="text-text-muted text-xs mb-3">{category.products} products</p>
                <div className="mb-2">
                  <p className="text-accent text-xl font-bold">
                    ${(category.revenue / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className={`text-sm font-semibold ${
                  category.growth >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {category.growth >= 0 ? '↑' : '↓'} {Math.abs(category.growth)}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </MetricCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-text-primary font-semibold">Stock Level</h4>
            <span className="text-green-400 text-sm">Healthy</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">In Stock</span>
              <span className="text-text-primary font-semibold">142 items</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Low Stock</span>
              <span className="text-yellow-400 font-semibold">12 items</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Out of Stock</span>
              <span className="text-red-400 font-semibold">5 items</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-text-primary font-semibold">Popular Searches</h4>
          </div>
          <div className="space-y-3">
            {searchAnalytics.slice(0, 5).map((search, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">{search.query || 'Unknown'}</span>
                <span className="text-accent font-semibold text-sm">
                  {search.searches}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-text-primary font-semibold">Best Sellers</h4>
          </div>
          <div className="space-y-3">
            {['Today', 'This Week', 'This Month'].map((period, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-text-secondary text-sm">{period}</span>
                <span className="text-accent font-semibold text-sm">
                  {i === 0 ? 'Wood Table' : i === 1 ? 'Office Desk' : 'Gaming Chair'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
