import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { HealthScoreGauge } from '../components/intelligence/HealthScoreGauge';
import { AlertCard } from '../components/intelligence/AlertCard';
import { OpportunityCard } from '../components/intelligence/OpportunityCard';
import { StatCard } from '../components/cards/StatCard';
import { LoadingScreen } from '../components/LoadingScreen';
import { LineChartComponent } from '../components/charts/LineChartComponent';
import { intelligenceApi } from '../services/api';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const ExecutiveCenter = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [pipelineForecast, setPipelineForecast] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, forecastResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/intelligence/executive-dashboard`),
          intelligenceApi.getPipelineForecast()
        ]);

        setData(dashboardResponse.data);
        setPipelineForecast(forecastResponse);
      } catch (error) {
        console.error('Error fetching executive dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const pipelineCharts = useMemo(() => {
    if (!pipelineForecast) {
      return {
        revenueSeries: [],
        ordersSeries: [],
      };
    }

    const historyDates = new Set(
      (pipelineForecast.history || []).map((point: any) => point.date)
    );

    const historySlice = (pipelineForecast.history || []).slice(-150);
    const combinedSeries = [
      ...historySlice,
      ...(pipelineForecast.forecast || [])
    ];

    const formatLabel = (isoDate: string) =>
      new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const revenueSeries = combinedSeries.map((point: any) => ({
      date: formatLabel(point.date),
      revenueActual: historyDates.has(point.date) ? point.revenue : undefined,
      revenueForecast: historyDates.has(point.date) ? undefined : point.revenue,
    }));

    const ordersSeries = combinedSeries.map((point: any) => ({
      date: formatLabel(point.date),
      ordersActual: historyDates.has(point.date) ? point.orders : undefined,
      ordersForecast: historyDates.has(point.date) ? undefined : point.orders,
    }));

    return { revenueSeries, ordersSeries };
  }, [pipelineForecast]);

  const revenueGrowthPct = pipelineForecast?.summary?.revenueGrowthPct || 0;
  const ordersGrowthPct = pipelineForecast?.summary?.ordersGrowthPct || 0;
  const revenueLastQuarter = pipelineForecast?.summary?.revenueLastQuarter || 0;
  const ordersLastQuarter = pipelineForecast?.summary?.ordersLastQuarter || 0;

  if (loading || !data) {
    return <LoadingScreen message="Loading executive dashboard..." />;
  }

  const { 
    healthScore, 
    alerts, 
    quickWins = [], 
    retentionMetrics, 
    catalogHealth,
    recommendations = []
  } = data;

  const catalogActiveShare = parseFloat(catalogHealth?.percentages?.active || '0');
  const catalogRecentShare = parseFloat(catalogHealth?.percentages?.recent || '0');
  const formatCurrency = (value: number, decimals: number = 0) =>
    `$${value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  const formatNumber = (value: number) => value.toLocaleString();

  const topOpportunities = recommendations.slice(0, 5);
  const weeklyActions = recommendations.filter((rec: any) =>
    typeof rec.timeframe === 'string' && rec.timeframe.toLowerCase().includes('week')
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Executive Command Center
        </h1>
        <p className="text-text-secondary">
          Business health snapshot and strategic insights at a glance
        </p>
      </motion.div>

      {/* Business Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <HealthScoreGauge
            score={healthScore.score}
            maxScore={healthScore.maxScore}
            grade={healthScore.grade}
            label="Business Health Score"
            status={healthScore.status}
            components={healthScore.components}
          />
        </div>

        {/* Key Metrics */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <StatCard
            title="Retention Rate"
            value={retentionMetrics.retentionRate}
            valueSuffix="%"
            valueDecimals={2}
            change={retentionMetrics.retentionRate - 4.7} // Compare to previous
            icon={retentionMetrics.retentionRate > 10 ? TrendingUp : TrendingDown}
            iconColor={retentionMetrics.retentionRate > 10 ? "#10B981" : "#EF4444"}
          />
          
          <StatCard
            title="Catalog Health"
            value={catalogHealth.healthScore || 0}
            valueDecimals={0}
            subtitle={`Grade ${catalogHealth.grade}`}
            change={catalogActiveShare ? Math.round(catalogActiveShare - 50) : 0}
            icon={AlertTriangle}
            iconColor="#F59E0B"
          />

          <div className="col-span-2 bg-primary-secondary rounded-xl p-6 border border-button-dark">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Stats</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-text-muted mb-1">Active Products (All Time)</div>
                <div className="text-2xl font-bold text-text-primary">
                  {catalogHealth.activeProducts.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary flex items-center gap-2">
                  {catalogActiveShare.toFixed(1)}% of {catalogHealth.totalProducts.toLocaleString()} total
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted mb-1">Recent Movers (≤90d)</div>
                <div className="text-2xl font-bold text-green-400">
                  {catalogHealth.recentActiveProducts?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-text-secondary">
                  {catalogRecentShare.toFixed(1)}% of catalog showed activity
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted mb-1">Dead Products</div>
                <div className="text-2xl font-bold text-red-400">
                  {catalogHealth.deadProducts.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary">
                  ${(catalogHealth.estimatedCarryingCost / 1000).toFixed(0)}K carrying cost
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted mb-1">One-Time Customers</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {retentionMetrics.segments.oneTime.count.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary">
                  {retentionMetrics.segments.oneTime.percentage}% of base
                </div>
              </div>
              <div>
                <div className="text-sm text-text-muted mb-1">VIP Customers</div>
                <div className="text-2xl font-bold text-purple-400">
                  {retentionMetrics.segments.vip.count}
                </div>
                <div className="text-xs text-text-secondary">
                  {retentionMetrics.segments.vip.percentage}% of base
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pipelineForecast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Pipeline Forecast (Next Quarter)</h2>
                <p className="text-text-muted">
                  Updated {new Date(pipelineForecast.generatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Forecasted Revenue"
                value={Math.round(pipelineForecast.summary?.revenueForecast || 0)}
                valuePrefix="$"
                valueDecimals={0}
                icon={TrendingUp}
                trend={parseFloat(revenueGrowthPct.toFixed(1))}
                subtitle="Next 90 days"
              />
              <StatCard
                title="Forecasted Orders"
                value={Math.round(pipelineForecast.summary?.ordersForecast || 0)}
                valueDecimals={0}
                icon={TrendingUp}
                trend={parseFloat(ordersGrowthPct.toFixed(1))}
                subtitle="Next 90 days"
              />
              <StatCard
                title="Last Quarter Revenue"
                value={Math.round(revenueLastQuarter)}
                valuePrefix="$"
                valueDecimals={0}
                icon={TrendingDown}
                trend={0}
                subtitle="Previous 90 days"
              />
              <StatCard
                title="Last Quarter Orders"
                value={Math.round(ordersLastQuarter)}
                valueDecimals={0}
                icon={TrendingDown}
                trend={0}
                subtitle="Previous 90 days"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Revenue Trend</h3>
                <LineChartComponent
                  data={pipelineCharts.revenueSeries}
                  dataKeys={[
                    { key: 'revenueActual', color: '#22C55E', name: 'Revenue (Actual)' },
                    { key: 'revenueForecast', color: '#38BDF8', name: 'Revenue (Forecast)' }
                  ]}
                  xAxisKey="date"
                  height={320}
                />
                <p className="text-xs text-text-muted mt-2">
                  Historical values are shown in green, while forecasted revenue is highlighted in blue.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Order Volume Trend</h3>
                <LineChartComponent
                  data={pipelineCharts.ordersSeries}
                  dataKeys={[
                    { key: 'ordersActual', color: '#F97316', name: 'Orders (Actual)' },
                    { key: 'ordersForecast', color: '#C084FC', name: 'Orders (Forecast)' }
                  ]}
                  xAxisKey="date"
                  height={320}
                />
                <p className="text-xs text-text-muted mt-2">
                  Contrasting lines make it easy to see where order volume is projected to accelerate or cool.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Critical Alerts */}
      {alerts && alerts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Critical Alerts
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {alerts.map((alert: any) => (
              <AlertCard
                key={alert.id}
                {...alert}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            💡 Quick Wins (High Impact, Low Effort)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickWins.map((opportunity: any) => (
              <OpportunityCard
                key={opportunity.id}
                {...opportunity}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Opportunities by ROI */}
      {topOpportunities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-primary-secondary rounded-xl p-8 border border-button-dark shadow-lg"
        >
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            🎯 Top Opportunities (Ranked by ROI)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topOpportunities.map((opp: any, index: number) => (
              <OpportunityCard key={opp.id || index} {...opp} />
            ))}
          </div>
        </motion.div>
      )}

      {weeklyActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-8 border border-accent/30 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            ⚡ Recommended Actions This Week
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklyActions.slice(0, 4).map((item: any, index: number) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-primary-secondary rounded-lg p-4 border border-button-dark hover:border-accent transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary mb-2">{item.title}</div>
                    {item.impact && (
                      <div className="text-sm text-green-400 mb-1">💰 {item.impact}</div>
                    )}
                    {item.effort && (
                      <div className="text-sm text-text-muted">⏱️ {item.effort}</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

