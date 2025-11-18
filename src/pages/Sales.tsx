import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ShoppingCart, Calendar } from 'lucide-react';
import { StatCard } from '../components/cards/StatCard';
import { MetricCard } from '../components/cards/MetricCard';
import { LineChartComponent } from '../components/charts/LineChartComponent';
import { AreaChartComponent } from '../components/charts/AreaChartComponent';
import { BarChartComponent } from '../components/charts/BarChartComponent';
import { LoadingScreen } from '../components/LoadingScreen';
import { salesApi } from '../services/api';
import type { SalesOverview, SalesTrend, TopProduct, CategoryPerformance, SalesFilterParams } from '../types';
import { DataAvailabilityNotice } from '../components/DataAvailabilityNotice';

export const Sales = () => {
  const ALL_TIME_DAYS = 3650;
  const [salesOverview, setSalesOverview] = useState<SalesOverview | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [initialTrends, setInitialTrends] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('All');
  const [filterOptions, setFilterOptions] = useState<{ countries: string[]; paymentMethods: string[] }>({
    countries: [],
    paymentMethods: []
  });

  // Calculate date range from filters
  const getDateRange = useMemo(() => {
    if (selectedYear === 'All') {
      return { startDate: null, endDate: null };
    }

    const year = parseInt(selectedYear, 10);
    const pad = (value: number) => value.toString().padStart(2, '0');

    if (selectedMonth === 'All') {
      // Entire year (avoid timezone shifts by building strings directly)
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

  // Calculate days for API calls
  const getDaysFromFilters = useMemo(() => {
    if (selectedYear === 'All') {
      return ALL_TIME_DAYS;
    }

    if (selectedMonth === 'All') {
      return 365; // Full year
    } else {
      const year = parseInt(selectedYear, 10);
      const month = parseInt(selectedMonth, 10) - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return daysInMonth;
    }
  }, [selectedYear, selectedMonth, ALL_TIME_DAYS]);

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
        const days = getDaysFromFilters;
        const [overview, trends, products, categoryData, hourly] = await Promise.all([
          salesApi.getOverview(days, activeFilters),
          salesApi.getTrends(days, activeFilters),
          salesApi.getTopProducts(10, days, activeFilters),
          salesApi.getCategories(days, activeFilters),
          salesApi.getHourly('today')
        ]);
        
        setSalesOverview(overview);
        setSalesTrends(trends);
        setTopProducts(products);
        setCategories(categoryData);
        setHourlyData(hourly);

        const noFiltersApplied =
          selectedYear === 'All' &&
          selectedMonth === 'All' &&
          selectedCountry === 'All' &&
          selectedPaymentMethod === 'All';

        if (initialTrends.length === 0 && noFiltersApplied) {
          setInitialTrends(trends);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [getDaysFromFilters, activeFilters, getDateRange]);

  // Filter hourly data based on selected period
  const filteredHourlyData = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) {
      return [];
    }

    // If filters are set to "All", return all hourly data
    if (selectedYear === 'All') {
      return hourlyData;
    }

    // For now, return all hourly data since hourly endpoint doesn't support date filtering
    // In a real implementation, you'd filter by date if the data structure supports it
    return hourlyData;
  }, [hourlyData, selectedYear, selectedMonth]);

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

  const filteredSalesTrends = useMemo(() => {
    if (!salesTrends || salesTrends.length === 0) {
      return [];
    }

    return salesTrends.filter((trend) => {
      const [yearStr, monthStr] = trend.date.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      if (Number.isNaN(year) || Number.isNaN(month)) {
        return false;
      }

      if (selectedYear !== 'All' && year !== parseInt(selectedYear, 10)) {
        return false;
      }

      if (
        selectedYear !== 'All' &&
        selectedMonth !== 'All' &&
        month !== parseInt(selectedMonth, 10)
      ) {
        return false;
      }

      return true;
    });
  }, [salesTrends, selectedYear, selectedMonth]);

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

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.target.value);
  };

  const handlePaymentMethodChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedPaymentMethod(event.target.value);
  };

  // Calculate filtered totals for stat cards
  const filteredOverview = useMemo(() => {
    // When filters are applied, use salesOverview directly since it's fetched with correct date range
    // Only use filteredSalesTrends for "All" period or when salesOverview is not available
    if (selectedYear !== 'All' && salesOverview) {
      // Use backend-calculated values when filters are active
      return salesOverview;
    }

    // For "All" period, calculate from trends data
    if (!filteredSalesTrends || filteredSalesTrends.length === 0) {
      return salesOverview;
    }

    const totalRevenue = filteredSalesTrends.reduce((sum, trend) => sum + (trend.revenue || 0), 0);
    const totalOrders = filteredSalesTrends.reduce((sum, trend) => sum + (trend.orders || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Keep original uniqueCustomers since it's not in trends data
    const uniqueCustomers = salesOverview?.uniqueCustomers || 0;

    return {
      ...salesOverview,
      totalRevenue,
      totalOrders,
      averageOrderValue: avgOrderValue,
      uniqueCustomers
    };
  }, [filteredSalesTrends, salesOverview, selectedYear]);

  const noDataAvailable =
    !loading &&
    ((!salesOverview || salesOverview.totalOrders === 0) || filteredSalesTrends.length === 0);

  if (loading || !salesOverview) {
    return <LoadingScreen message="Loading sales data..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={filteredOverview?.totalRevenue || 0}
          valuePrefix="$"
          change={salesOverview.growth}
          icon={DollarSign}
          iconColor="#F76C2F"
          subtitle={selectedYear !== 'All' ? `${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear}` : 'All Time'}
        />
        <StatCard
          title="Total Orders"
          value={filteredOverview?.totalOrders || 0}
          change={15.3}
          icon={ShoppingCart}
          iconColor="#10B981"
          subtitle={selectedYear !== 'All' ? `${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear}` : 'All Time'}
        />
        <StatCard
          title="Avg Order Value"
          value={filteredOverview?.averageOrderValue || 0}
          valuePrefix="$"
          valueDecimals={2}
          change={8.7}
          icon={TrendingUp}
          iconColor="#3B82F6"
          subtitle="Per transaction"
        />
        <StatCard
          title="Unique Customers"
          value={filteredOverview?.uniqueCustomers || 0}
          change={salesOverview.growth}
          icon={Calendar}
          iconColor="#8B5CF6"
          subtitle={selectedYear !== 'All' ? `${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear}` : 'All Time'}
        />
      </div>

      <DataAvailabilityNotice
        show={noDataAvailable}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-text-secondary">
            Revenue & Orders Filters
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

      <MetricCard title={`Revenue & Orders Over Time${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
        <LineChartComponent
          data={filteredSalesTrends}
          dataKeys={[
            { key: 'revenue', color: '#F76C2F', name: 'Revenue ($)' },
            { key: 'orders', color: '#10B981', name: 'Orders' }
          ]}
          xAxisKey="date"
          height={350}
        />
      </MetricCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard title={`Revenue by Hour${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ' (All Time)'}`}>
          <AreaChartComponent
            data={filteredHourlyData.length > 0 ? filteredHourlyData.slice(8, 20).map((h: any) => ({ ...h, hour: `${h.hour}:00` })) : []}
            dataKeys={[
              { key: 'revenue', color: '#F76C2F', name: 'Revenue' }
            ]}
            xAxisKey="hour"
            height={300}
          />
        </MetricCard>

        <MetricCard title={`Orders by Hour${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ' (All Time)'}`}>
          <BarChartComponent
            data={filteredHourlyData.length > 0 ? filteredHourlyData.slice(8, 20).map((h: any) => ({ ...h, hour: `${h.hour}:00` })) : []}
            dataKeys={[
              { key: 'orders', color: '#10B981', name: 'Orders' }
            ]}
            xAxisKey="hour"
            height={300}
          />
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard title={`Top Selling Products${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <motion.div
                key={`${product.id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-button-dark rounded-lg hover:bg-button-darkAlt transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-dark rounded-lg flex items-center justify-center text-accent font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">{product.name}</p>
                    <p className="text-text-muted text-sm">{product.sales} sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-text-primary font-semibold">
                    ${product.revenue.toLocaleString()}
                  </p>
                  <p className={`text-sm font-medium ${
                    product.growth >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {product.growth >= 0 ? '↑' : '↓'} {Math.abs(product.growth)}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </MetricCard>

        <MetricCard title={`Revenue by Category${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
          <div className="space-y-3 mb-4">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm font-medium">
                    {category.category}
                  </span>
                  <span className="text-text-primary font-semibold">
                    ${category.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-button-dark rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${categories.length > 0 ? (category.revenue / Math.max(...categories.map(c => c.revenue))) * 100 : 0}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    className="bg-accent h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, #F76C2F ${index * 20}%, #FF8A50 100%)`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{category.products} products</span>
                  <span className={`font-medium ${
                    category.growth >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {category.growth >= 0 ? '↑' : '↓'} {Math.abs(category.growth)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Best Day</p>
            <p className="text-text-primary text-2xl font-bold mb-1">Tuesday</p>
            <p className="text-accent text-lg font-semibold">$45,678</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Best Hour</p>
            <p className="text-text-primary text-2xl font-bold mb-1">2:00 PM</p>
            <p className="text-accent text-lg font-semibold">156 orders</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Conversion Rate</p>
            <p className="text-text-primary text-2xl font-bold mb-1">3.8%</p>
            <p className="text-green-400 text-sm font-semibold">↑ 0.5%</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Refund Rate</p>
            <p className="text-text-primary text-2xl font-bold mb-1">2.3%</p>
            <p className="text-green-400 text-sm font-semibold">↓ 0.3%</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
