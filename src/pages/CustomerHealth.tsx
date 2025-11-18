import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, AlertTriangle, Heart, DollarSign } from 'lucide-react';
import { StatCard } from '../components/cards/StatCard';
import { LineChartComponent } from '../components/charts/LineChartComponent';
import { PieChartComponent } from '../components/charts/PieChartComponent';
import { BarChartComponent } from '../components/charts/BarChartComponent';
import { CustomerPyramid } from '../components/intelligence/CustomerPyramid';
import { LoadingScreen } from '../components/LoadingScreen';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const CustomerHealth = () => {
  const [retentionMetrics, setRetentionMetrics] = useState<any>(null);
  const [ltvData, setLtvData] = useState<any>(null);
  const [atRiskCustomers, setAtRiskCustomers] = useState<any[]>([]);
  const [timeToSecondPurchase, setTimeToSecondPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [retention, ltv, atRisk, timeToPurchase] = await Promise.all([
          axios.get(`${API_BASE_URL}/intelligence/retention-metrics`),
          axios.get(`${API_BASE_URL}/intelligence/customer-ltv`),
          axios.get(`${API_BASE_URL}/intelligence/at-risk-customers?limit=10`),
          axios.get(`${API_BASE_URL}/intelligence/time-to-second-purchase`)
        ]);

        setRetentionMetrics(retention.data);
        setLtvData(ltv.data);
        setAtRiskCustomers(atRisk.data);
        setTimeToSecondPurchase(timeToPurchase.data);
      } catch (error) {
        console.error('Error fetching customer health data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading customer health data..." />;
  }

  // Prepare customer pyramid data
  const pyramidData = retentionMetrics ? [
    {
      segment: 'VIP',
      count: retentionMetrics.vip || 0,
      percentage: retentionMetrics.totalCustomers > 0 
        ? ((retentionMetrics.vip / retentionMetrics.totalCustomers) * 100).toFixed(1)
        : '0',
      color: '#F76C2F'
    },
    {
      segment: 'Loyal',
      count: retentionMetrics.loyal || 0,
      percentage: retentionMetrics.totalCustomers > 0
        ? ((retentionMetrics.loyal / retentionMetrics.totalCustomers) * 100).toFixed(1)
        : '0',
      color: '#FFB085'
    },
    {
      segment: 'Regular',
      count: retentionMetrics.regular || 0,
      percentage: retentionMetrics.totalCustomers > 0
        ? ((retentionMetrics.regular / retentionMetrics.totalCustomers) * 100).toFixed(1)
        : '0',
      color: '#D0D0D0'
    },
    {
      segment: 'One-time',
      count: retentionMetrics.oneTime || 0,
      percentage: retentionMetrics.totalCustomers > 0
        ? ((retentionMetrics.oneTime / retentionMetrics.totalCustomers) * 100).toFixed(1)
        : '0',
      color: '#A0A0A0'
    }
  ] : [];

  // Prepare LTV chart data
  const ltvChartData = ltvData?.segments?.map((segment: any) => ({
    segment: segment.segment || 'Unknown',
    ltv: parseFloat(segment.avgLTV || 0),
    orders: parseInt(segment.avgOrders || 0)
  })) || [];

  const churnRate = retentionMetrics?.totalCustomers > 0
    ? ((retentionMetrics.oneTime / retentionMetrics.totalCustomers) * 100).toFixed(1)
    : '0';

  const avgLTV = ltvData?.avgLTV || 0;

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
            <Heart className="w-8 h-8 text-accent" />
            Customer Health Dashboard
          </h1>
          <p className="text-text-muted mt-1">Deep insights into customer behavior and retention</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={retentionMetrics?.totalCustomers || 0}
          icon={Users}
          trend={0}
          subtitle="All-time"
        />
        <StatCard
          title="Churn Rate"
          value={parseFloat(churnRate) || 0}
          valueSuffix="%"
          valueDecimals={1}
          icon={TrendingDown}
          trend={-5}
          subtitle="One-time buyers"
          alert={parseFloat(churnRate) > 80}
        />
        <StatCard
          title="Avg. Customer LTV"
          value={parseFloat(avgLTV) || 0}
          valuePrefix="$"
          valueDecimals={2}
          icon={DollarSign}
          trend={12}
          subtitle="Lifetime value"
        />
        <StatCard
          title="VIP Customers"
          value={retentionMetrics?.vip || 0}
          icon={TrendingUp}
          trend={8}
          subtitle="High-value accounts"
        />
      </div>

      {/* Customer Segmentation Pyramid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-accent" />
          Customer Segmentation Pyramid
        </h2>
        <CustomerPyramid data={pyramidData} />
      </motion.div>

      {/* Customer LTV by Segment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent" />
            Lifetime Value by Segment
          </h2>
          <BarChartComponent
            data={ltvChartData}
            xKey="segment"
            yKey="ltv"
            color="#F76C2F"
            title=""
            height={300}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Average Orders by Segment
          </h2>
          <BarChartComponent
            data={ltvChartData}
            xKey="segment"
            yKey="orders"
            color="#FFB085"
            title=""
            height={300}
          />
        </motion.div>
      </div>

      {/* At-Risk Customers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          At-Risk Customers (Top 10)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-button-dark">
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Customer</th>
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Email</th>
                <th className="text-right py-3 px-4 text-text-secondary font-semibold">Total Spent</th>
                <th className="text-right py-3 px-4 text-text-secondary font-semibold">Orders</th>
                <th className="text-right py-3 px-4 text-text-secondary font-semibold">Days Since Last</th>
                <th className="text-center py-3 px-4 text-text-secondary font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody>
              {atRiskCustomers.map((customer: any, index: number) => (
                <motion.tr
                  key={customer.customerId || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="border-b border-button-dark/50 hover:bg-button-dark/30 transition-colors"
                >
                  <td className="py-3 px-4 text-text-primary font-medium">
                    {customer.customerName || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {customer.email || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right text-text-primary font-semibold">
                    ${parseFloat(customer.totalSpent || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-text-secondary">
                    {customer.orderCount || 0}
                  </td>
                  <td className="py-3 px-4 text-right text-text-secondary">
                    {customer.daysSinceLastOrder || 0} days
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400">
                      High
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {atRiskCustomers.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              No at-risk customers found
            </div>
          )}
        </div>
      </motion.div>

      {/* Time to Second Purchase Insight */}
      {timeToSecondPurchase && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Time to Second Purchase Insight
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-button-dark/30 rounded-lg p-4">
              <p className="text-text-muted text-sm mb-1">Average Days</p>
              <p className="text-2xl font-bold text-text-primary">
                {parseFloat(timeToSecondPurchase.avgDays || 0).toFixed(0)} days
              </p>
            </div>
            <div className="bg-button-dark/30 rounded-lg p-4">
              <p className="text-text-muted text-sm mb-1">Median Days</p>
              <p className="text-2xl font-bold text-text-primary">
                {parseFloat(timeToSecondPurchase.medianDays || 0).toFixed(0)} days
              </p>
            </div>
            <div className="bg-button-dark/30 rounded-lg p-4">
              <p className="text-text-muted text-sm mb-1">Repeat Customer %</p>
              <p className="text-2xl font-bold text-accent">
                {parseFloat(timeToSecondPurchase.repeatCustomerRate || 0).toFixed(1)}%
              </p>
            </div>
          </div>
          <p className="text-text-muted mt-4 text-sm">
            💡 <strong>Insight:</strong> Target customers around {parseFloat(timeToSecondPurchase.avgDays || 0).toFixed(0)} days 
            after their first purchase with a personalized offer to increase repeat rate from {parseFloat(timeToSecondPurchase.repeatCustomerRate || 0).toFixed(1)}%.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

