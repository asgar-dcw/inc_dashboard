import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/cards/StatCard';
import { MetricCard } from '../components/cards/MetricCard';
import { LineChartComponent } from '../components/charts/LineChartComponent';
import { BarChartComponent } from '../components/charts/BarChartComponent';
import { LoadingScreen } from '../components/LoadingScreen';
import { salesApi, dashboardApi } from '../services/api';
import { DataAvailabilityNotice } from '../components/DataAvailabilityNotice';
import type {
  SalesOverview,
  SalesTrend,
  TopProduct,
  RecentActivity,
  SalesFilterParams,
} from '../types';

export const Dashboard = () => {
  const ALL_TIME_DAYS = 3650;
  const [salesOverview, setSalesOverview] = useState<SalesOverview | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [initialTrends, setInitialTrends] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('All');
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate days for API calls based on filters
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
    const fetchFilterOptions = async () => {
      try {
        const filterData = await dashboardApi.getFilters();
        setAvailableCountries(filterData.countries || []);
        setAvailablePaymentMethods(filterData.paymentMethods || []);
      } catch (error) {
        console.error('Error loading dashboard filters:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const days = getDaysFromFilters;
        const [overview, trends, products, activity, metrics] = await Promise.all([
          salesApi.getOverview(days, activeFilters),
          salesApi.getTrends(days, activeFilters),
          salesApi.getTopProducts(5, days, activeFilters),
          dashboardApi.getActivity(10),
          dashboardApi.getMetrics()
        ]);

        setSalesOverview(overview);
        setSalesTrends(trends);
        setTopProducts(products);
        setRecentActivity(activity);
        setTotalCustomers(overview.uniqueCustomers || 0);
        setDashboardMetrics(metrics);

        const noFiltersApplied =
          selectedYear === 'All' &&
          selectedMonth === 'All' &&
          selectedCountry === 'All' &&
          selectedPaymentMethod === 'All';

        if (initialTrends.length === 0 && noFiltersApplied) {
          setInitialTrends(trends);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 5 minutes
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

    return {
      ...salesOverview,
      totalRevenue,
      totalOrders,
      averageOrderValue: avgOrderValue
    };
  }, [filteredSalesTrends, salesOverview, selectedYear]);

  // Filter recent activity based on selected period
  const filteredRecentActivity = useMemo(() => {
    if (!recentActivity || recentActivity.length === 0 || selectedYear === 'All') {
      return recentActivity;
    }

    // Filter activity by date if activity has timestamp/date field
    // For now, return all activity since the structure may not have dates
    return recentActivity;
  }, [recentActivity, selectedYear, selectedMonth]);

  const noDataAvailable =
    !loading &&
    (!!salesOverview &&
      salesOverview.totalOrders === 0 &&
      filteredSalesTrends.length === 0);

  if (loading || !salesOverview) {
    return <LoadingScreen message="Loading dashboard data..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          index={0}
          title="Total Revenue"
          value={filteredOverview?.totalRevenue || 0}
          valuePrefix="$"
          change={salesOverview.growth}
          icon={DollarSign}
          iconColor="#F76C2F"
          subtitle={selectedYear !== 'All' ? `${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear}` : 'All Time'}
        />
        <StatCard
          index={1}
          title="Total Orders"
          value={filteredOverview?.totalOrders || 0}
          change={15.3}
          icon={ShoppingBag}
          iconColor="#10B981"
          subtitle={selectedYear !== 'All' ? `${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear}` : 'All Time'}
        />
        <StatCard
          index={2}
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
          index={3}
          title="Total Customers"
          value={totalCustomers}
          change={salesOverview.growth}
          icon={Users}
          iconColor="#8B5CF6"
          subtitle={selectedYear !== 'All' ? `${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear}` : 'All Time'}
        />
      </div>

      <DataAvailabilityNotice
        show={noDataAvailable}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        description="No activity was found for this time range. Select 'All Years' or a different month to explore historical performance."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-text-secondary">
            Revenue Filters
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
              {availableCountries.map((country) => (
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
              {availablePaymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard 
          index={0}
          title={`Revenue Trends${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}
        >
          <LineChartComponent
            data={filteredSalesTrends}
            dataKeys={[
              { key: 'revenue', color: '#F76C2F', name: 'Revenue' }
            ]}
            xAxisKey="date"
            height={300}
          />
        </MetricCard>

        <MetricCard 
          index={1}
          title={`Order Volume${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}
        >
          <LineChartComponent
            data={filteredSalesTrends}
            dataKeys={[
              { key: 'orders', color: '#10B981', name: 'Orders' }
            ]}
            xAxisKey="date"
            height={300}
          />
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricCard 
          index={2}
          title={`Top Products${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`} 
          className="lg:col-span-2"
        >
          <BarChartComponent
            data={topProducts}
            dataKeys={[
              { key: 'revenue', color: '#F76C2F', name: 'Revenue' }
            ]}
            xAxisKey="name"
            height={300}
          />
        </MetricCard>

        <MetricCard 
          index={3}
          title="Recent Activity"
        >
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {filteredRecentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                whileHover={{ x: 4, scale: 1.02 }}
                transition={{ 
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 300
                }}
                className="flex items-start gap-3 p-3 bg-button-dark rounded-lg hover:bg-button-darkAlt transition-colors cursor-pointer"
              >
                <div
                  className={`w-2 h-2 mt-2 rounded-full ${
                    activity.type === 'order'
                      ? 'bg-accent'
                      : activity.type === 'customer'
                      ? 'bg-green-400'
                      : 'bg-blue-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-text-secondary text-sm">{activity.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-text-muted text-xs">{activity.timestamp}</p>
                    {activity.value && (
                      <span className="text-accent text-xs font-semibold">
                        ${activity.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-text-primary font-semibold">Conversion Rate</h4>
            {dashboardMetrics && dashboardMetrics.conversionGrowth !== 0 && (
              <span className={`text-sm font-semibold ${dashboardMetrics.conversionGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dashboardMetrics.conversionGrowth > 0 ? '↑' : '↓'} {Math.abs(dashboardMetrics.conversionGrowth).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-text-primary mb-2">
            {dashboardMetrics ? `${dashboardMetrics.conversionRate.toFixed(2)}%` : '0%'}
          </div>
          <div className="w-full bg-button-dark rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dashboardMetrics ? Math.min(dashboardMetrics.conversionRate, 100) : 0}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-accent h-2 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-text-primary font-semibold">Cart Abandonment</h4>
            {dashboardMetrics && dashboardMetrics.abandonmentGrowth !== 0 && (
              <span className={`text-sm font-semibold ${dashboardMetrics.abandonmentGrowth < 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dashboardMetrics.abandonmentGrowth < 0 ? '↓' : '↑'} {Math.abs(dashboardMetrics.abandonmentGrowth).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-text-primary mb-2">
            {dashboardMetrics ? `${dashboardMetrics.abandonmentRate.toFixed(1)}%` : '0%'}
          </div>
          <div className="w-full bg-button-dark rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dashboardMetrics ? Math.min(dashboardMetrics.abandonmentRate, 100) : 0}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-red-400 h-2 rounded-full"
            />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-text-primary font-semibold">Active Carts</h4>
            <span className="text-accent text-sm font-semibold">Live</span>
          </div>
          <div className="text-3xl font-bold text-text-primary mb-2">
            {dashboardMetrics ? dashboardMetrics.activeCarts.toLocaleString() : '0'}
          </div>
          <div className="text-text-muted text-sm mt-2">
            {dashboardMetrics ? `$${(dashboardMetrics.cartValue / 1000000).toFixed(1)}M in cart value` : '$0 in cart value'}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
