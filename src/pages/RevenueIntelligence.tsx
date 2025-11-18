import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Users, Package, Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import { StatCard } from '../components/cards/StatCard';
import { LineChartComponent } from '../components/charts/LineChartComponent';
import { BarChartComponent } from '../components/charts/BarChartComponent';
import { AreaChartComponent } from '../components/charts/AreaChartComponent';
import { LoadingScreen } from '../components/LoadingScreen';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const RevenueIntelligence = () => {
  const [newVsRepeat, setNewVsRepeat] = useState<any>(null);
  const [mrrSummary, setMrrSummary] = useState<any>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [revenueBySegment, setRevenueBySegment] = useState<any[]>([]);
  const [orderValueDistribution, setOrderValueDistribution] = useState<any[]>([]);
  const [distributionMetric, setDistributionMetric] = useState<'revenue' | 'orders'>('revenue');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [newVsRepeatRes, mrrRes, trendRes, segmentRes, distributionRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/intelligence/new-vs-repeat-revenue?days=3650`),
          axios.get(`${API_BASE_URL}/intelligence/monthly-revenue`),
          axios.get(`${API_BASE_URL}/intelligence/monthly-revenue-trend`),
          axios.get(`${API_BASE_URL}/intelligence/revenue-by-segment?days=3650`),
          axios.get(`${API_BASE_URL}/intelligence/order-value-distribution`)
        ]);

        setNewVsRepeat(newVsRepeatRes.data);
        setMrrSummary(mrrRes.data || null);
        setMonthlyTrend(Array.isArray(trendRes.data) ? trendRes.data : []);
        setRevenueBySegment(Array.isArray(segmentRes.data) ? segmentRes.data : []);
        setOrderValueDistribution(Array.isArray(distributionRes.data) ? distributionRes.data : []);
      } catch (error) {
        console.error('Error fetching revenue intelligence data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading revenue intelligence..." />;
  }

  // Prepare chart data
  const newOrders = parseInt(newVsRepeat?.newCustomerOrders || 0);
  const repeatOrders = parseInt(newVsRepeat?.repeatCustomerOrders || 0);
  const totalOrders = newOrders + repeatOrders;

  const totalRevenue = parseFloat(newVsRepeat?.newCustomerRevenue || 0) +
                       parseFloat(newVsRepeat?.repeatCustomerRevenue || 0);

  const barDistributionData = [
    {
      metric: 'Revenue',
      newShare: totalRevenue > 0 ? (parseFloat(newVsRepeat?.newCustomerRevenue || 0) / totalRevenue) * 100 : 0,
      repeatShare: totalRevenue > 0 ? (parseFloat(newVsRepeat?.repeatCustomerRevenue || 0) / totalRevenue) * 100 : 0
    },
    {
      metric: 'Orders',
      newShare: totalOrders > 0 ? (newOrders / totalOrders) * 100 : 0,
      repeatShare: totalOrders > 0 ? (repeatOrders / totalOrders) * 100 : 0
    }
  ];

  const repeatRevenuePercent = totalRevenue > 0
    ? (parseFloat(newVsRepeat?.repeatCustomerRevenue || 0) / totalRevenue) * 100
    : 0;

  const repeatOrdersPercent = totalOrders > 0 ? (repeatOrders / totalOrders) * 100 : 0;

  const distributionLabel = distributionMetric === 'revenue' ? 'revenue' : 'orders';
  const repeatSharePercent = distributionMetric === 'revenue' ? repeatRevenuePercent : repeatOrdersPercent;

  const distributionBarData = distributionMetric === 'revenue'
    ? [
        {
          segment: 'New Customers',
          value: parseFloat(newVsRepeat?.newCustomerRevenue || 0),
          color: '#F76C2F'
        },
        {
          segment: 'Repeat Customers',
          value: parseFloat(newVsRepeat?.repeatCustomerRevenue || 0),
          color: '#FFB085'
        }
      ]
    : [
        {
          segment: 'New Customers',
          value: newOrders,
          color: '#F76C2F'
        },
        {
          segment: 'Repeat Customers',
          value: repeatOrders,
          color: '#FFB085'
        }
      ];

  const mrrChartData = monthlyTrend.map((item: any) => ({
    month: item.month,
    mrr: parseFloat(item.revenue || 0)
  }));

  const avgMonthlyRevenue = parseFloat(mrrSummary?.currentMRR || 0);
  const avgMonthlyPerCustomer = parseFloat(mrrSummary?.avgMonthlyPerCustomer || 0);

  const segmentRevenueChartData = (revenueBySegment || []).map((item: any) => ({
    segment: item.segment || 'Unknown',
    revenue: parseFloat(item.revenue || 0),
    orders: parseInt(item.orderCount || 0)
  }));

  const orderDistributionData = (orderValueDistribution || []).map((item: any) => ({
    range: item.range || '',
    count: parseInt(item.orderCount || 0),
    revenue: parseFloat(item.totalRevenue || 0)
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-accent" />
            Revenue Intelligence
          </h1>
          <p className="text-text-muted mt-1">Deep revenue analysis and growth opportunities</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={totalRevenue}
          valuePrefix="$"
          icon={DollarSign}
          trend={15}
          subtitle="All Time"
        />
        <StatCard
          title="Repeat Revenue %"
          value={repeatRevenuePercent}
          valueSuffix="%"
          valueDecimals={1}
          icon={TrendingUp}
          trend={8}
          subtitle="Revenue from returning customers"
        />
        <StatCard
          title="Avg. Monthly Revenue"
          value={avgMonthlyRevenue}
          valuePrefix="$"
          icon={Layers}
          trend={12}
          subtitle="Monthly average"
        />
        <StatCard
          title="Revenue Segments"
          value={segmentRevenueChartData.length}
          icon={Users}
          trend={0}
          subtitle="Active customer segments"
        />
      </div>

      {/* New vs Repeat Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent" />
            New vs Repeat Customer Revenue
          </h2>
          {totalRevenue === 0 && totalOrders === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-text-muted">
              No revenue or order activity available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={barDistributionData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#33373E" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  stroke="#A0A0A0"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  type="category"
                  dataKey="metric"
                  stroke="#A0A0A0"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
                />
                <Legend wrapperStyle={{ color: '#D0D0D0' }} iconType="circle" />
                <Bar dataKey="newShare" name="New Customers" stackId="share" fill="#F76C2F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="repeatShare" name="Repeat Customers" stackId="share" fill="#FFB085" radius={[0, 0, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-button-dark/30 rounded-lg p-3">
              <p className="text-text-muted text-sm">New Customer Orders</p>
              <p className="text-xl font-bold text-text-primary">
                {newVsRepeat?.newCustomerOrders || 0}
              </p>
            </div>
            <div className="bg-button-dark/30 rounded-lg p-3">
              <p className="text-text-muted text-sm">Repeat Customer Orders</p>
              <p className="text-xl font-bold text-accent">
                {newVsRepeat?.repeatCustomerOrders || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Revenue Distribution (New vs Repeat)
          </h2>
          <div className="flex items-center gap-2 mb-4">
            {(['revenue', 'orders'] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setDistributionMetric(metric)}
                className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                  distributionMetric === metric
                    ? 'bg-accent text-white border-accent'
                    : 'bg-button-dark text-text-secondary border-button-dark hover:text-white'
                }`}
              >
                {metric === 'revenue' ? 'Revenue' : 'Orders'}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={distributionBarData}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#33373E" />
              <XAxis
                dataKey="segment"
                stroke="#A0A0A0"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#A0A0A0"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) =>
                  distributionMetric === 'revenue'
                    ? `$${value >= 1000 ? value.toLocaleString() : value}`
                    : value.toLocaleString()
                }
              />
              <Tooltip
                formatter={(value: number) =>
                  distributionMetric === 'revenue'
                    ? `$${value.toLocaleString()}`
                    : value.toLocaleString()
                }
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                animationDuration={800}
              >
                {distributionBarData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-sm text-text-muted">
              💡 <strong>Insight:</strong> Repeat customers contribute{' '}
              <strong className="text-accent">{repeatSharePercent.toFixed(1)}%</strong> of your {distributionLabel}. 
              Focus on retention strategies to maximize this high-value segment.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Monthly Revenue Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Layers className="w-6 h-6 text-accent" />
          Monthly Revenue Trend
        </h2>
        {mrrChartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[350px] text-text-muted">
            Monthly revenue history is unavailable. If you just pulled the latest code, restart the backend server and refresh.
          </div>
        ) : (
          <>
            <AreaChartComponent
              data={mrrChartData}
              dataKeys={[
                { key: 'mrr', color: '#F76C2F', name: 'Revenue ($)' }
              ]}
              xAxisKey="month"
              height={350}
            />
          <div className="mt-4 bg-button-dark/30 rounded-lg p-4">
            <p className="text-text-muted text-sm">Per Customer Avg.</p>
            <p className="text-3xl font-bold text-accent">
              ${avgMonthlyPerCustomer.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Repeat customers: {mrrSummary?.repeatCustomers?.toLocaleString() || 0}
            </p>
          </div>
          </>
        )}
      </motion.div>

      {/* Revenue by Customer Segment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-accent" />
          Revenue by Customer Segment (All Time)
        </h2>
        <BarChartComponent
          data={segmentRevenueChartData}
          xKey="segment"
          yKey="revenue"
          color="#F76C2F"
          title=""
          height={350}
        />
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {segmentRevenueChartData.map((segment: any, index: number) => (
            <div key={index} className="bg-button-dark/30 rounded-lg p-3">
              <p className="text-text-muted text-xs">{segment.segment}</p>
              <p className="text-lg font-bold text-text-primary">
                ${parseFloat(segment.revenue).toLocaleString()}
              </p>
              <p className="text-xs text-text-muted">{segment.orders} orders</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Order Value Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Package className="w-6 h-6 text-accent" />
          Order Value Distribution
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-button-dark">
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Order Value Range</th>
                <th className="text-right py-3 px-4 text-text-secondary font-semibold">Order Count</th>
                <th className="text-right py-3 px-4 text-text-secondary font-semibold">Total Revenue</th>
                <th className="text-right py-3 px-4 text-text-secondary font-semibold">Avg. Order Value</th>
              </tr>
            </thead>
            <tbody>
              {orderDistributionData.map((item: any, index: number) => {
                const avgOrderValue = item.count > 0 ? (item.revenue / item.count) : 0;
                return (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="border-b border-button-dark/50 hover:bg-button-dark/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-text-primary font-medium">{item.range}</td>
                    <td className="py-3 px-4 text-right text-text-secondary">{item.count}</td>
                    <td className="py-3 px-4 text-right text-accent font-semibold">
                      ${parseFloat(item.revenue).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-text-primary">
                      ${avgOrderValue.toFixed(2)}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {orderDistributionData.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              No order distribution data available
            </div>
          )}
        </div>
      </motion.div>

      {/* Key Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-text-primary mb-4">📊 Key Revenue Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary-secondary/80 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-accent mb-2">Revenue Concentration</h3>
            <p className="text-sm text-text-secondary">
              {repeatRevenuePercent}% of revenue comes from repeat customers. This indicates strong customer loyalty
              but also highlights opportunity to convert more one-time buyers.
            </p>
          </div>
          <div className="bg-primary-secondary/80 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-accent mb-2">Growth Opportunity</h3>
            <p className="text-sm text-text-secondary">
              Focus on converting VIP and Loyal segments into higher-value orders. Target campaigns
              during peak MRR months to maximize impact.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

