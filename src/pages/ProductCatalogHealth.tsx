import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingUp, Zap, Archive, Activity } from 'lucide-react';
import { StatCard } from '../components/cards/StatCard';
import { PieChartComponent } from '../components/charts/PieChartComponent';
import { BarChartComponent } from '../components/charts/BarChartComponent';
import { LoadingScreen } from '../components/LoadingScreen';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const ProductCatalogHealth = () => {
  const [catalogHealth, setCatalogHealth] = useState<any>(null);
  const [deadProducts, setDeadProducts] = useState<any[]>([]);
  const [productLifecycle, setProductLifecycle] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [healthRes, deadRes, lifecycleRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/intelligence/catalog-health`),
          axios.get(`${API_BASE_URL}/intelligence/dead-products?limit=20`),
          axios.get(`${API_BASE_URL}/intelligence/product-lifecycle`)
        ]);

        setCatalogHealth(healthRes.data);
        setDeadProducts(Array.isArray(deadRes.data) ? deadRes.data : []);
        setProductLifecycle(Array.isArray(lifecycleRes.data) ? lifecycleRes.data : []);
      } catch (error) {
        console.error('Error fetching product catalog health data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading product catalog health..." />;
  }

  // Prepare health score data
  const healthScore = catalogHealth?.healthScore || 0;
  const healthColor = healthScore >= 70 ? '#22C55E' : healthScore >= 40 ? '#F59E0B' : '#EF4444';

  const catalogStatusData = [
    {
      name: 'Active Products',
      value: parseInt(catalogHealth?.activeProducts || 0),
      color: '#22C55E'
    },
    {
      name: 'Slow Moving',
      value: parseInt(catalogHealth?.slowMovingProducts || 0),
      color: '#F59E0B'
    },
    {
      name: 'Dead Products',
      value: parseInt(catalogHealth?.deadProducts || 0),
      color: '#EF4444'
    }
  ];

  const lifecycleData = (productLifecycle || []).map((item: any) => ({
    stage: item.stage || 'Unknown',
    count: parseInt(item.productCount || 0),
    revenue: parseFloat(item.totalRevenue || 0)
  }));

  const deadProductsPercent = catalogHealth?.totalProducts > 0
    ? ((catalogHealth.deadProducts / catalogHealth.totalProducts) * 100).toFixed(1)
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
            <Package className="w-8 h-8 text-accent" />
            Product Catalog Health
          </h1>
          <p className="text-text-muted mt-1">Analyze product performance and identify optimization opportunities</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Catalog Health Score"
          value={healthScore}
          valueSuffix="/100"
          valueDecimals={0}
          icon={Activity}
          trend={healthScore >= 70 ? 5 : -5}
          subtitle="Overall health"
          alert={healthScore < 40}
        />
        <StatCard
          title="Total Products"
          value={catalogHealth?.totalProducts || 0}
          icon={Package}
          trend={0}
          subtitle="In catalog"
        />
        <StatCard
          title="Dead Products"
          value={parseFloat(deadProductsPercent) || 0}
          valueSuffix="%"
          icon={Archive}
          trend={-2}
          subtitle="No sales in 180+ days"
          alert={parseFloat(deadProductsPercent) > 30}
        />
        <StatCard
          title="Active Performers"
          value={catalogHealth?.activeProducts || 0}
          icon={Zap}
          trend={8}
          subtitle="Consistent sales"
        />
      </div>

      {/* Health Score Gauge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-accent" />
          Catalog Health Overview
        </h2>
        <div className="flex items-center justify-center">
          <div className="relative w-64 h-64">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="100"
                stroke="#3A3F47"
                strokeWidth="20"
                fill="none"
              />
              <circle
                cx="128"
                cy="128"
                r="100"
                stroke={healthColor}
                strokeWidth="20"
                fill="none"
                strokeDasharray={`${(healthScore / 100) * 628} 628`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold" style={{ color: healthColor }}>
                {healthScore.toFixed(0)}
              </span>
              <span className="text-lg text-text-muted">Health Score</span>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-text-secondary">
            {healthScore >= 70 && "✅ Your catalog is healthy! Keep optimizing for even better results."}
            {healthScore >= 40 && healthScore < 70 && "⚠️ Some products need attention. Review slow-moving items."}
            {healthScore < 40 && "🚨 Critical: Many products are underperforming. Immediate action required."}
          </p>
        </div>
      </motion.div>

      {/* Catalog Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" />
            Product Status Distribution
          </h2>
          <PieChartComponent
            data={catalogStatusData}
            nameKey="name"
            valueKey="value"
            colors={['#22C55E', '#F59E0B', '#EF4444']}
            title=""
            height={300}
          />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(catalogStatusData || []).map((status: any, index: number) => (
              <div key={index} className="bg-button-dark/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <p className="text-xs text-text-muted">{status.name}</p>
                </div>
                <p className="text-lg font-bold text-text-primary">{status.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Product Lifecycle Distribution
          </h2>
          <BarChartComponent
            data={lifecycleData}
            xKey="stage"
            yKey="count"
            color="#F76C2F"
            title=""
            height={300}
          />
          <div className="mt-4 bg-accent/10 border border-accent/30 rounded-lg p-3">
            <p className="text-sm text-text-muted">
              💡 <strong>Tip:</strong> Focus marketing efforts on "Growth" stage products
              and consider retiring or repositioning "Decline" stage products.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Dead Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Archive className="w-6 h-6 text-red-400" />
          Dead Products (No Sales in 180+ Days) - Top 20
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-button-dark">
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Product ID</th>
                <th className="text-left py-3 px-4 text-text-secondary font-semibold">Product Name</th>
                <th className="text-right py-3 px-4 text-text-secondary font-semibold">Days Since Last Sale</th>
                <th className="text-right py-3 px-4 text-text-secondary font-semibold">Last Sale Amount</th>
                <th className="text-center py-3 px-4 text-text-secondary font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {(deadProducts || []).map((product: any, index: number) => (
                <motion.tr
                  key={product.productId || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="border-b border-button-dark/50 hover:bg-button-dark/30 transition-colors"
                >
                  <td className="py-3 px-4 text-text-secondary font-mono">
                    #{product.productId || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-text-primary font-medium">
                    {product.productName || 'Unknown Product'}
                  </td>
                  <td className="py-3 px-4 text-right text-text-secondary">
                    {product.daysSinceLastSale || 'Never'} days
                  </td>
                  <td className="py-3 px-4 text-right text-text-primary">
                    ${parseFloat(product.lastSaleAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400">
                      Review
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {deadProducts.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              🎉 Great! No dead products found. Your catalog is performing well.
            </div>
          )}
        </div>
      </motion.div>

      {/* Product Lifecycle Revenue Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-accent" />
          Revenue by Product Lifecycle Stage
        </h2>
        <BarChartComponent
          data={lifecycleData}
          xKey="stage"
          yKey="revenue"
          color="#22C55E"
          title=""
          height={350}
        />
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {lifecycleData.map((stage: any, index: number) => (
            <div key={index} className="bg-button-dark/30 rounded-lg p-3">
              <p className="text-text-muted text-xs mb-1">{stage.stage}</p>
              <p className="text-lg font-bold text-text-primary">{stage.count} products</p>
              <p className="text-sm text-accent">${parseFloat(stage.revenue).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-red-500/20 to-orange-500/10 border border-red-500/30 rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          Recommended Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary-secondary/80 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-accent mb-2">🗑️ Clean Up Dead Products</h3>
            <p className="text-sm text-text-secondary">
              {deadProducts.length} products haven't sold in 180+ days. Consider discounting,
              bundling, or removing them from active inventory.
            </p>
          </div>
          <div className="bg-primary-secondary/80 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-accent mb-2">📈 Boost Growth Stage</h3>
            <p className="text-sm text-text-secondary">
              Products in the "Growth" stage show potential. Increase marketing spend and
              visibility to maximize their momentum.
            </p>
          </div>
          <div className="bg-primary-secondary/80 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-accent mb-2">🔄 Refresh Declining Items</h3>
            <p className="text-sm text-text-secondary">
              Products in "Decline" need repositioning. Update descriptions, images, or
              pricing to revitalize interest.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

