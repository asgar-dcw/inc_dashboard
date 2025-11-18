import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserCheck, TrendingDown } from 'lucide-react';
import { StatCard } from '../components/cards/StatCard';
import { MetricCard } from '../components/cards/MetricCard';
import { LineChartComponent } from '../components/charts/LineChartComponent';
import { PieChartComponent } from '../components/charts/PieChartComponent';
import { AreaChartComponent } from '../components/charts/AreaChartComponent';
import { LoadingScreen } from '../components/LoadingScreen';
import { customersApi, salesApi } from '../services/api';
import { DataAvailabilityNotice } from '../components/DataAvailabilityNotice';
import type { CustomerOverview, CustomerSegment, SalesFilterParams } from '../types';

export const Customers = () => {
  const [overview, setOverview] = useState<CustomerOverview | null>(null);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [growth, setGrowth] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
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
        const days = getDaysFromFilters;
        const fallbackDays = days ?? 3650;

        const [overviewData, segmentsData, growthData, topData, trendsData] = await Promise.all([
          customersApi.getOverview(days, activeFilters),
          customersApi.getSegments(),
          customersApi.getGrowth(days, activeFilters),
          customersApi.getTop(10, fallbackDays, activeFilters),
          salesApi.getTrends(fallbackDays, activeFilters)
        ]);
        
        setOverview(overviewData);
        setSegments(segmentsData);
        setGrowth(growthData);
        setTopCustomers(topData);
        setSalesTrends(trendsData);

        const noFiltersApplied =
          selectedYear === 'All' &&
          selectedMonth === 'All' &&
          selectedCountry === 'All' &&
          selectedPaymentMethod === 'All';

        if (initialTrends.length === 0 && noFiltersApplied) {
          setInitialTrends(trendsData);
        }
      } catch (error) {
        console.error('Error fetching customers data:', error);
      } finally {
        setLoading(false);
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

  const filteredGrowth = useMemo(() => {
    if (!growth || growth.length === 0 || selectedYear === 'All') {
      return growth;
    }

    return growth.filter((item) => {
      if (!item.date) return true;
      const [yearStr, monthStr] = item.date.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      if (Number.isNaN(year) || Number.isNaN(month)) {
        return true;
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
  }, [growth, selectedYear, selectedMonth]);

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

  // Calculate filtered overview from growth data
  const filteredOverview = useMemo(() => {
    // If no filters are selected, return original overview
    if (selectedYear === 'All' || !filteredGrowth || filteredGrowth.length === 0) {
      return overview;
    }

    // Calculate totals from filtered growth data
    const totalNewCustomers = filteredGrowth.reduce((sum, item) => sum + (item.newCustomers || 0), 0);
    const totalActiveCustomers = filteredGrowth.reduce((sum, item) => sum + (item.activeCustomers || 0), 0);
    
    // For total customers in the period, use active customers (or new if active isn't available)
    // For returning customers, estimate as active - new (customers who were active but not new in this period)
    const estimatedReturning = Math.max(0, totalActiveCustomers - totalNewCustomers);
    
    // Use total active customers for total customers in the period
    const totalCustomersInPeriod = totalActiveCustomers > 0 ? totalActiveCustomers : totalNewCustomers;
    
    // Calculate churn rate (keep original for now as it's complex to calculate per period)
    const churnRate = overview ? overview.churnRate : 0;

    return {
      ...overview,
      totalCustomers: totalCustomersInPeriod || 0,
      newCustomers: totalNewCustomers || 0,
      returningCustomers: estimatedReturning || 0,
      churnRate: churnRate
    };
  }, [filteredGrowth, overview, selectedYear]);

  const noDataAvailable =
    !loading &&
    ((!overview || overview.totalCustomers === 0) && growth.length === 0 && segments.length === 0);

  if (loading || !overview) {
    return <LoadingScreen message="Loading customers data..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={filteredOverview?.totalCustomers || 0}
          change={12.5}
          icon={Users}
          iconColor="#F76C2F"
          subtitle={selectedYear !== 'All' ? `${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear}` : 'All time'}
        />
        <StatCard
          title="New Customers"
          value={filteredOverview?.newCustomers || 0}
          change={18.3}
          icon={UserPlus}
          iconColor="#10B981"
          subtitle={selectedYear !== 'All' ? `${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear}` : 'All Time'}
        />
        <StatCard
          title="Returning Customers"
          value={filteredOverview?.returningCustomers || 0}
          change={8.7}
          icon={UserCheck}
          iconColor="#3B82F6"
          subtitle={selectedYear !== 'All' ? `${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear}` : 'All Time'}
        />
        <StatCard
          title="Churn Rate"
          value={filteredOverview?.churnRate || 0}
          valueSuffix="%"
          valueDecimals={1}
          change={-2.3}
          icon={TrendingDown}
          iconColor="#EF4444"
          subtitle={selectedYear !== 'All' ? `${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear}` : 'All Time'}
        />
      </div>

      <DataAvailabilityNotice
        show={noDataAvailable}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        description="No customer activity was found for the selected filters. Choose 'All Years' or a different month to view historical performance."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-text-secondary">
            Customer Analytics Filters
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard title={`Customer Growth${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
          <LineChartComponent
            data={filteredGrowth}
            dataKeys={[
              { key: 'newCustomers', color: '#F76C2F', name: 'New Customers' }
            ]}
            xAxisKey="date"
            height={300}
          />
        </MetricCard>

        <MetricCard title={`Customer Segments${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
          <PieChartComponent
            data={segments.map(seg => ({
              name: seg.segment,
              value: seg.count
            }))}
            dataKey="value"
            nameKey="name"
            height={300}
          />
        </MetricCard>
      </div>

      <MetricCard title={`Segment Analysis${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
        <div className="space-y-4">
          {segments.map((segment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-button-dark rounded-lg p-4 hover:bg-button-darkAlt transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-dark rounded-full flex items-center justify-center">
                    <Users size={20} className="text-accent" />
                  </div>
                  <div>
                    <h4 className="text-text-primary font-semibold">{segment.segment}</h4>
                    <p className="text-text-muted text-sm">
                      {segment.count.toLocaleString()} customers ({segment.percentage}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-accent text-lg font-bold">
                    ${(segment.revenue / 1000).toFixed(0)}K
                  </p>
                  <p className="text-text-muted text-xs">Total Revenue</p>
                </div>
              </div>
              <div className="w-full bg-primary-bg rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${segment.percentage}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, #F76C2F ${index * 15}%, #FF8A50 100%)`
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </MetricCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard title={`Customer Lifetime Value${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
          <AreaChartComponent
            data={filteredGrowth}
            dataKeys={[
              { key: 'activeCustomers', color: '#F76C2F', name: 'Active Customers' }
            ]}
            xAxisKey="date"
            height={300}
          />
        </MetricCard>

        <MetricCard title={`Customer Retention${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-baseline gap-2">
                <span className="text-5xl font-bold text-text-primary">78</span>
                <span className="text-2xl font-semibold text-accent">%</span>
              </div>
              <p className="text-text-muted text-sm mt-2">Overall Retention Rate</p>
            </div>

            <div className="space-y-4">
              {[
                { period: 'Month 1', rate: 95 },
                { period: 'Month 3', rate: 82 },
                { period: 'Month 6', rate: 78 },
                { period: 'Month 12', rate: 71 }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">{item.period}</span>
                    <span className="text-text-primary font-semibold">{item.rate}%</span>
                  </div>
                  <div className="w-full bg-button-dark rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.rate}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      className="bg-green-400 h-full rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </MetricCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Avg. Purchases</p>
            <p className="text-text-primary text-3xl font-bold mb-1">3.2</p>
            <p className="text-accent text-sm font-semibold">per customer</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Customer LTV</p>
            <p className="text-text-primary text-3xl font-bold mb-1">$1,245</p>
            <p className="text-green-400 text-sm font-semibold">↑ 12.5%</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Repeat Rate</p>
            <p className="text-text-primary text-3xl font-bold mb-1">42%</p>
            <p className="text-green-400 text-sm font-semibold">↑ 5.2%</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Avg. Session</p>
            <p className="text-text-primary text-3xl font-bold mb-1">8:34</p>
            <p className="text-accent text-sm font-semibold">minutes</p>
          </div>
        </motion.div>
      </div>

      <MetricCard title={`Top Customers${selectedYear !== 'All' ? ` (${selectedMonth !== 'All' ? monthNames[parseInt(selectedMonth) - 1] + ' ' : ''}${selectedYear})` : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-button-dark">
                <th className="text-left py-3 px-4 text-text-muted text-sm font-semibold">Customer</th>
                <th className="text-right py-3 px-4 text-text-muted text-sm font-semibold">Orders</th>
                <th className="text-right py-3 px-4 text-text-muted text-sm font-semibold">Total Spent</th>
                <th className="text-right py-3 px-4 text-text-muted text-sm font-semibold">Avg Order</th>
                <th className="text-right py-3 px-4 text-text-muted text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.length > 0 ? topCustomers.map((customer: any, index: number) => {
                const avgOrder = customer.orders > 0 ? customer.totalSpent / customer.orders : 0;
                const status = customer.orders >= 20 ? 'VIP' : customer.orders >= 10 ? 'Frequent' : 'Regular';
                return (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-button-dark hover:bg-button-dark transition-colors cursor-pointer"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-dark rounded-full flex items-center justify-center text-accent font-bold text-sm">
                        {customer.name ? customer.name.substring(0, 2).toUpperCase() : 'CU'}
                      </div>
                      <span className="text-text-primary font-medium">{customer.name || customer.email || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-text-secondary">
                    {customer.orders}
                  </td>
                  <td className="py-4 px-4 text-right text-accent font-semibold">
                    ${customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-text-secondary">
                    ${avgOrder.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      status === 'VIP'
                        ? 'bg-accent/20 text-accent'
                        : status === 'Frequent'
                        ? 'bg-green-400/20 text-green-400'
                        : 'bg-button-dark text-text-secondary'
                    }`}>
                      {status}
                    </span>
                  </td>
                </motion.tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    No customer data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </MetricCard>
    </div>
  );
};
