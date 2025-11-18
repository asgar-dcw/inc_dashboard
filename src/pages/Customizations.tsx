import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Settings, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/cards/StatCard';
import { MetricCard } from '../components/cards/MetricCard';
import { BarChartComponent } from '../components/charts/BarChartComponent';
import { LineChartComponent } from '../components/charts/LineChartComponent';
import { PieChartComponent } from '../components/charts/PieChartComponent';
import { LoadingScreen } from '../components/LoadingScreen';
import { customizationsApi, salesApi } from '../services/api';
import { DataAvailabilityNotice } from '../components/DataAvailabilityNotice';
import type { CustomizationMetrics, SalesFilterParams } from '../types';

export const Customizations = () => {
  const [metrics, setMetrics] = useState<CustomizationMetrics | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('All');
  const [filterOptions, setFilterOptions] = useState<{ countries: string[]; paymentMethods: string[] }>({
    countries: [],
    paymentMethods: []
  });
  const [initialTrends, setInitialTrends] = useState<any[]>([]);

  const getDaysFromFilters = useMemo<number | undefined>(() => {
    if (selectedYear === 'All') {
      return undefined;
    }

    if (selectedMonth === 'All') {
      return 365;
    }

    const year = parseInt(selectedYear, 10);
    const month = parseInt(selectedMonth, 10) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return daysInMonth;
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
        const [metricsData, trendsData, popularData, categoryData] = await Promise.all([
          customizationsApi.getMetrics(days, activeFilters),
          customizationsApi.getTrends(days, activeFilters),
          customizationsApi.getPopular(10, days, activeFilters),
          customizationsApi.getByCategory(days, activeFilters)
        ]);
        
        setMetrics(metricsData);
        setTrends(trendsData);
        setPopular(popularData);
        setByCategory(categoryData);

        const noFiltersApplied =
          selectedYear === 'All' &&
          selectedMonth === 'All' &&
          selectedCountry === 'All' &&
          selectedPaymentMethod === 'All';

        if (initialTrends.length === 0 && noFiltersApplied) {
          setInitialTrends(trendsData);
        }
      } catch (error) {
        console.error('Error fetching customizations data:', error);
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

  const trendOptionsSource = initialTrends.length > 0 ? initialTrends : trends;

  const yearOptions = useMemo(() => {
    const years = Array.from(
      new Set(
        trendOptionsSource.map((trend) => {
          if (!trend.date) return null;
          const [year] = trend.date.split('-');
          return parseInt(year, 10);
        }).filter((year) => year !== null && !Number.isNaN(year))
      )
    ) as number[];

    return years.sort((a, b) => b - a);
  }, [trendOptionsSource]);

  const monthOptions = useMemo(() => {
    if (selectedYear === 'All') {
      return [];
    }

    const months = Array.from(
      new Set(
        trendOptionsSource
          .filter((trend) => trend.date && trend.date.startsWith(`${selectedYear}-`))
          .map((trend) => {
            const [, month] = trend.date.split('-');
            return parseInt(month, 10);
          })
          .filter((month) => !Number.isNaN(month))
      )
    );

    return months.sort((a, b) => a - b);
  }, [trendOptionsSource, selectedYear]);

  const filteredTrends = useMemo(() => {
    if (!trends || trends.length === 0 || selectedYear === 'All') {
      return trends;
    }

    return trends.filter((trend) => {
      if (!trend.date) return false;
      const [yearStr, monthStr] = trend.date.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      if (Number.isNaN(year) || Number.isNaN(month)) {
        return false;
      }

      if (year !== parseInt(selectedYear, 10)) {
        return false;
      }

      if (selectedMonth !== 'All' && month !== parseInt(selectedMonth, 10)) {
        return false;
      }

      return true;
    });
  }, [trends, selectedYear, selectedMonth]);

  useEffect(() => {
    if (selectedYear === 'All') {
      setSelectedMonth('All');
      return;
    }

    if (selectedMonth !== 'All' && !monthOptions.includes(parseInt(selectedMonth, 10))) {
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

  const selectedPeriodLabel = useMemo(() => {
    if (selectedYear === 'All') {
      return 'All Time';
    }

    const monthLabel =
      selectedMonth !== 'All' ? `${monthNames[parseInt(selectedMonth, 10) - 1]} ` : '';
    return `${monthLabel}${selectedYear}`;
  }, [selectedYear, selectedMonth, monthNames]);

  if (loading || !metrics) {
    return <LoadingScreen message="Loading customizations data..." />;
  }

  const totalCustomizationsCount = metrics?.totalCustomizations ?? 0;
  const completedOrdersCount = metrics?.completedOrders ?? Math.round(totalCustomizationsCount * (metrics?.completionRate ?? 0) / 100);
  const noDataAvailable =
    totalCustomizationsCount === 0 &&
    trends.length === 0 &&
    popular.length === 0 &&
    byCategory.length === 0;

  // Calculate customization type data from popular options
  const customizationTypeData = popular.length > 0 
    ? popular.reduce((acc: any[], item: any) => {
        const type = item.optionName || 'Other';
        const existing = acc.find(a => a.name === type);
        if (existing) {
          existing.value += item.uses;
        } else {
          acc.push({ name: type, value: item.uses, percentage: 0 });
        }
        return acc;
      }, []).map(item => ({
        ...item,
        percentage: totalCustomizationsCount > 0 
          ? (item.value / totalCustomizationsCount) * 100 
          : 0
      }))
    : [
        { name: 'Size', value: 0, percentage: 0 },
        { name: 'Material', value: 0, percentage: 0 },
        { name: 'Color', value: 0, percentage: 0 },
        { name: 'Hardware', value: 0, percentage: 0 }
      ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customizations"
          value={totalCustomizationsCount}
          change={25.3}
          icon={Settings}
          iconColor="#F76C2F"
          subtitle={selectedPeriodLabel}
        />
        <StatCard
          title="Completion Rate"
          value={metrics.completionRate}
          valueSuffix="%"
          valueDecimals={2}
          change={5.7}
          icon={CheckCircle}
          iconColor="#10B981"
          subtitle={`Successfully completed · ${selectedPeriodLabel}`}
        />
        <StatCard
          title="Avg Custom Value"
          value={metrics.averageValue}
          valuePrefix="$"
          valueDecimals={2}
          change={12.8}
          icon={DollarSign}
          iconColor="#3B82F6"
          subtitle={`Per customization · ${selectedPeriodLabel}`}
        />
        <StatCard
          title="Custom Orders"
          value={completedOrdersCount}
          change={18.5}
          icon={TrendingUp}
          iconColor="#8B5CF6"
          subtitle={`Estimated completed · ${selectedPeriodLabel}`}
        />
      </div>

      <DataAvailabilityNotice
        show={noDataAvailable}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        description="No customization insights matched the selected filters. Choose a wider time range or clear filters to review historical activity."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-text-secondary">
            Customization Filters
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
        <MetricCard title={`Customization Growth (${selectedPeriodLabel})`}>
          <LineChartComponent
            data={filteredTrends}
            dataKeys={[
              { key: 'customizations', color: '#F76C2F', name: 'Customizations' }
            ]}
            xAxisKey="date"
            height={300}
          />
        </MetricCard>

        <MetricCard title={`Customization Types Distribution (${selectedPeriodLabel})`}>
          <PieChartComponent
            data={customizationTypeData}
            dataKey="value"
            nameKey="name"
            height={300}
          />
        </MetricCard>
      </div>

      <MetricCard title={`Popular Customization Options (${selectedPeriodLabel})`}>
        <div className="space-y-4">
          {popular.slice(0, 5).map((option: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-button-dark rounded-lg p-4 hover:bg-button-darkAlt transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-dark rounded-lg flex items-center justify-center text-accent font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-text-primary font-semibold">{option.optionName || 'Unknown'}: {option.optionValue || 'N/A'}</h4>
                    <p className="text-text-muted text-sm">{option.uses} uses</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-accent text-lg font-bold">
                    {option.uniqueQuotes}
                  </p>
                  <p className="text-text-muted text-xs">Unique Quotes</p>
                </div>
              </div>
              <div className="w-full bg-primary-bg rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${popular.length > 0 ? (option.uses / Math.max(...popular.map((p: any) => p.uses))) * 100 : 0}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, #F76C2F ${index * 20}%, #FF8A50 100%)`
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </MetricCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricCard title={`Customization by Product Category (${selectedPeriodLabel})`}>
          <BarChartComponent
            data={byCategory}
            dataKeys={[
              { key: 'customizations', color: '#F76C2F', name: 'Customizations' }
            ]}
            xAxisKey="category"
            height={300}
          />
        </MetricCard>

        <MetricCard title={`Customization Completion Funnel (${selectedPeriodLabel})`}>
          <div className="space-y-6 mt-4">
            {[
              { stage: 'Started', count: 2345, percentage: 100 },
              { stage: 'Options Selected', count: 2156, percentage: 92 },
              { stage: 'Preview Viewed', count: 1989, percentage: 85 },
              { stage: 'Added to Cart', count: 1845, percentage: 78.5 },
              { stage: 'Completed', count: 1845, percentage: 78.5 }
            ].map((stage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-text-primary font-medium">{stage.stage}</span>
                  <div className="text-right">
                    <span className="text-text-primary font-semibold mr-2">
                      {stage.count.toLocaleString()}
                    </span>
                    <span className="text-text-muted text-sm">({stage.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-button-dark rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{
                      background: `linear-gradient(90deg, #F76C2F, #FF8A50)`
                    }}
                  >
                    {stage.percentage >= 20 && (
                      <span className="text-white text-xs font-bold">
                        {stage.percentage}%
                      </span>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </MetricCard>
      </div>

      <MetricCard title={`Customization Options Performance (${selectedPeriodLabel})`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.popularOptions.map((option, index) => (
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
                  <Settings size={24} className="text-accent" />
                </div>
                <h4 className="text-text-primary font-semibold mb-1">{option}</h4>
                <div className="mt-3">
                  <p className="text-accent text-xl font-bold">
                    {Math.floor(Math.random() * 500 + 200)}
                  </p>
                  <p className="text-text-muted text-xs">Total Uses</p>
                </div>
                <div className={`mt-2 text-sm font-semibold text-green-400`}>
                  ↑ {Math.floor(Math.random() * 20 + 5)}%
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
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Avg Customization Time</p>
            <p className="text-text-primary text-3xl font-bold mb-1">4:23</p>
            <p className="text-accent text-sm font-semibold">minutes</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Most Popular Product</p>
            <p className="text-text-primary text-lg font-bold mb-1">Custom Desk</p>
            <p className="text-accent text-sm font-semibold">567 customizations</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="text-center">
            <p className="text-text-muted text-sm mb-2">Revenue Impact</p>
            <p className="text-text-primary text-3xl font-bold mb-1">+34%</p>
            <p className="text-green-400 text-sm font-semibold">vs standard products</p>
          </div>
        </motion.div>
      </div>

      <MetricCard title={`Customization Trends (${selectedPeriodLabel})`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-text-primary font-semibold">Top Materials</h4>
            {['Oak Wood', 'Walnut Wood', 'Pine Wood', 'Metal Frame', 'Glass Top'].map((material, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-button-dark rounded-lg"
              >
                <span className="text-text-secondary">{material}</span>
                <span className="text-accent font-semibold">
                  {Math.floor(Math.random() * 200 + 100)}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="text-text-primary font-semibold">Top Finishes</h4>
            {['Natural', 'Dark Stain', 'Light Stain', 'White Paint', 'Black Paint'].map((finish, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-button-dark rounded-lg"
              >
                <span className="text-text-secondary">{finish}</span>
                <span className="text-accent font-semibold">
                  {Math.floor(Math.random() * 200 + 100)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </MetricCard>
    </div>
  );
};
