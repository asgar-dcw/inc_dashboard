import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, DollarSign, Package, Users, Award } from 'lucide-react';
import { StatCard } from '../components/cards/StatCard';
import { BarChartComponent } from '../components/charts/BarChartComponent';
import { PieChartComponent } from '../components/charts/PieChartComponent';
import { LoadingScreen } from '../components/LoadingScreen';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const B2BIntelligence = () => {
  const [b2bAnalysis, setB2bAnalysis] = useState<any>(null);
  const [topB2BCustomers, setTopB2BCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analysisRes, topCustomersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/intelligence/b2b-analysis`),
          axios.get(`${API_BASE_URL}/intelligence/top-b2b-customers?limit=20`)
        ]);

        setB2bAnalysis(analysisRes.data);
        setTopB2BCustomers(Array.isArray(topCustomersRes.data) ? topCustomersRes.data : []);
      } catch (error) {
        console.error('Error fetching B2B intelligence data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading B2B intelligence..." />;
  }

  // Prepare chart data
  const b2bVsB2CData = [
    {
      name: 'B2B Customers',
      revenue: parseFloat(b2bAnalysis?.totalB2BRevenue || 0),
      count: parseInt(b2bAnalysis?.b2bCustomerCount || 0)
    },
    {
      name: 'B2C Customers',
      revenue: parseFloat(b2bAnalysis?.totalRevenue || 0) - parseFloat(b2bAnalysis?.totalB2BRevenue || 0),
      count: parseInt(b2bAnalysis?.totalCustomers || 0) - parseInt(b2bAnalysis?.b2bCustomerCount || 0)
    }
  ];

  const b2bRevenuePercent = b2bAnalysis?.totalRevenue > 0
    ? ((b2bAnalysis.totalB2BRevenue / b2bAnalysis.totalRevenue) * 100).toFixed(1)
    : '0';

  const avgB2BOrderValue = b2bAnalysis?.b2bCustomerCount > 0
    ? (b2bAnalysis.totalB2BRevenue / b2bAnalysis.totalB2BOrders).toFixed(2)
    : '0';

  const b2bCustomerPercent = b2bAnalysis?.totalCustomers > 0
    ? ((b2bAnalysis.b2bCustomerCount / b2bAnalysis.totalCustomers) * 100).toFixed(1)
    : '0';

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
            <Building2 className="w-8 h-8 text-accent" />
            B2B Business Intelligence
          </h1>
          <p className="text-text-muted mt-1">Identify and analyze high-value business customers</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="B2B Customers"
          value={b2bAnalysis?.b2bCustomerCount || 0}
          icon={Building2}
          trend={15}
          subtitle={`${b2bCustomerPercent}% of total`}
        />
        <StatCard
          title="B2B Revenue"
          value={parseFloat(b2bAnalysis?.totalB2BRevenue || 0)}
          valuePrefix="$"
          icon={DollarSign}
          trend={22}
          subtitle={`${b2bRevenuePercent}% of total revenue`}
        />
        <StatCard
          title="Avg. B2B Order Value"
          value={parseFloat(avgB2BOrderValue) || 0}
          valuePrefix="$"
          icon={TrendingUp}
          trend={18}
          subtitle="Per order average"
        />
        <StatCard
          title="B2B Orders"
          value={b2bAnalysis?.totalB2BOrders || 0}
          icon={Package}
          trend={12}
          subtitle="Total orders"
        />
      </div>

      {/* B2B Identification Criteria */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-accent" />
          B2B Customer Identification Criteria
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-button-dark/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">5+</p>
                <p className="text-sm text-text-muted">Orders</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary">Minimum order count to qualify as B2B</p>
          </div>
          <div className="bg-button-dark/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">$1,000+</p>
                <p className="text-sm text-text-muted">Lifetime Value</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary">Minimum spending to indicate business account</p>
          </div>
          <div className="bg-button-dark/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">$200+</p>
                <p className="text-sm text-text-muted">Avg. Order</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary">Average order value threshold</p>
          </div>
        </div>
      </motion.div>

      {/* B2B vs B2C Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent" />
            Revenue: B2B vs B2C
          </h2>
          <PieChartComponent
            data={b2bVsB2CData}
            nameKey="name"
            valueKey="revenue"
            colors={['#F76C2F', '#FFB085']}
            title=""
            height={300}
          />
          <div className="mt-4 bg-accent/10 border border-accent/30 rounded-lg p-3">
            <p className="text-sm text-text-muted">
              💡 <strong>Insight:</strong> B2B customers represent only {b2bCustomerPercent}% of your customer base
              but contribute <strong className="text-accent">{b2bRevenuePercent}%</strong> of total revenue.
              High-value segment!
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Customer Count: B2B vs B2C
          </h2>
          <BarChartComponent
            data={b2bVsB2CData}
            xKey="name"
            yKey="count"
            color="#F76C2F"
            title=""
            height={300}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-button-dark/30 rounded-lg p-3">
              <p className="text-text-muted text-xs">B2B Customers</p>
              <p className="text-xl font-bold text-accent">
                {b2bAnalysis?.b2bCustomerCount || 0}
              </p>
            </div>
            <div className="bg-button-dark/30 rounded-lg p-3">
              <p className="text-text-muted text-xs">B2C Customers</p>
              <p className="text-xl font-bold text-text-primary">
                {(b2bAnalysis?.totalCustomers || 0) - (b2bAnalysis?.b2bCustomerCount || 0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top B2B Customers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Award className="w-6 h-6 text-accent" />
          Top 20 B2B Customers
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-button-dark">
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Rank</th>
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Customer</th>
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Email</th>
                <th className="text-right py-3 px-4 text-text-secondary font-semibold">Total Spent</th>
                <th className="text-right py-3 px-4 text-text-secondary font-semibold">Orders</th>
                <th className="text-right py-3 px-4 text-text-secondary font-semibold">Avg. Order Value</th>
                <th className="text-center py-3 px-4 text-text-secondary font-semibold">Tier</th>
              </tr>
            </thead>
            <tbody>
              {(topB2BCustomers || []).map((customer: any, index: number) => {
                const avgOrderValue = customer.orderCount > 0
                  ? (customer.totalSpent / customer.orderCount).toFixed(2)
                  : '0';
                
                let tier = 'Silver';
                let tierColor = 'text-gray-400 bg-gray-500/10';
                
                if (customer.totalSpent >= 5000) {
                  tier = 'Platinum';
                  tierColor = 'text-purple-400 bg-purple-500/10';
                } else if (customer.totalSpent >= 2500) {
                  tier = 'Gold';
                  tierColor = 'text-yellow-400 bg-yellow-500/10';
                }

                return (
                  <motion.tr
                    key={customer.customerId || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="border-b border-button-dark/50 hover:bg-button-dark/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-text-muted font-bold">
                      #{index + 1}
                    </td>
                    <td className="py-3 px-4 text-text-primary font-medium">
                      {customer.customerName || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">
                      {customer.email || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right text-accent font-bold">
                      ${parseFloat(customer.totalSpent || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-text-secondary">
                      {customer.orderCount || 0}
                    </td>
                    <td className="py-3 px-4 text-right text-text-primary font-semibold">
                      ${parseFloat(avgOrderValue).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tierColor}`}>
                        {tier}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {topB2BCustomers.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              No B2B customers identified yet
            </div>
          )}
        </div>
      </motion.div>

      {/* Strategic Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-text-primary mb-4">📊 B2B Strategy Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary-secondary/80 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-accent mb-2">🎯 Personalized Outreach</h3>
            <p className="text-sm text-text-secondary">
              Assign account managers to Platinum and Gold tier B2B customers. Personal touch
              can increase retention by 25% and upsell opportunities by 40%.
            </p>
          </div>
          <div className="bg-primary-secondary/80 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-accent mb-2">💰 Volume Discounts</h3>
            <p className="text-sm text-text-secondary">
              Implement tiered pricing for bulk orders. B2B customers ordering $1,000+ could
              get 10-15% discounts, encouraging larger orders and loyalty.
            </p>
          </div>
          <div className="bg-primary-secondary/80 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-accent mb-2">🚀 B2B Portal</h3>
            <p className="text-sm text-text-secondary">
              Create a dedicated B2B portal with features like quick reordering, invoicing,
              and volume discounts. This can increase B2B revenue by 30%+.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Revenue Potential */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          B2B Growth Potential
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-button-dark/30 rounded-lg p-4">
            <p className="text-text-muted text-sm mb-1">Current B2B Revenue</p>
            <p className="text-2xl font-bold text-text-primary">
              ${parseFloat(b2bAnalysis?.totalB2BRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-button-dark/30 rounded-lg p-4">
            <p className="text-text-muted text-sm mb-1">Potential with 20% Growth</p>
            <p className="text-2xl font-bold text-green-400">
              ${(parseFloat(b2bAnalysis?.totalB2BRevenue || 0) * 1.2).toLocaleString()}
            </p>
          </div>
          <div className="bg-button-dark/30 rounded-lg p-4">
            <p className="text-text-muted text-sm mb-1">Additional Revenue</p>
            <p className="text-2xl font-bold text-accent">
              +${(parseFloat(b2bAnalysis?.totalB2BRevenue || 0) * 0.2).toLocaleString()}
            </p>
          </div>
          <div className="bg-button-dark/30 rounded-lg p-4">
            <p className="text-text-muted text-sm mb-1">Investment Required</p>
            <p className="text-2xl font-bold text-text-primary">
              $5K - $10K
            </p>
          </div>
        </div>
        <p className="text-sm text-text-muted mt-4">
          💡 <strong>ROI Estimate:</strong> Investing $5K-$10K in B2B initiatives (portal, account managers, marketing)
          could generate ${(parseFloat(b2bAnalysis?.totalB2BRevenue || 0) * 0.2).toLocaleString()} in additional
          annual revenue. That's a potential ROI of{' '}
          <strong className="text-accent">
            {((parseFloat(b2bAnalysis?.totalB2BRevenue || 0) * 0.2) / 7500 * 100).toFixed(0)}%
          </strong>!
        </p>
      </motion.div>
    </motion.div>
  );
};

