import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Target, TrendingUp, Users, DollarSign, Zap, Calendar } from 'lucide-react';
import { RecommendationCard } from '../components/intelligence/RecommendationCard';
import { LoadingScreen } from '../components/LoadingScreen';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const StrategicRecommendations = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/intelligence/recommendations`);
        setRecommendations(res.data);
      } catch (error) {
        console.error('Error fetching strategic recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading strategic recommendations..." />;
  }

  // Group recommendations by priority
  const highPriority = recommendations.filter(r => r.priority === 'High');
  const mediumPriority = recommendations.filter(r => r.priority === 'Medium');
  const lowPriority = recommendations.filter(r => r.priority === 'Low');

  // Calculate total potential impact
  const totalImpact = recommendations.reduce((sum, rec) => {
    const impactValue = parseFloat(rec.estimatedImpact?.replace(/[^0-9.-]+/g, '') || '0');
    return sum + impactValue;
  }, 0);

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
            <Lightbulb className="w-8 h-8 text-accent" />
            Strategic Recommendations
          </h1>
          <p className="text-text-muted mt-1">AI-powered insights and action items to grow your business</p>
        </div>
      </div>

      {/* Total Impact Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Total Potential Impact</h2>
            <p className="text-text-muted">Combined estimated annual revenue increase from all recommendations</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-accent">${totalImpact.toLocaleString()}</p>
            <p className="text-sm text-text-muted mt-1">{recommendations.length} actionable recommendations</p>
          </div>
        </div>
      </motion.div>

      {/* Priority Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 font-semibold text-sm mb-1">🔥 High Priority</p>
              <p className="text-text-muted text-xs">Immediate action required</p>
            </div>
            <div className="text-3xl font-bold text-red-400">{highPriority.length}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 font-semibold text-sm mb-1">⚡ Medium Priority</p>
              <p className="text-text-muted text-xs">Plan within 30 days</p>
            </div>
            <div className="text-3xl font-bold text-yellow-400">{mediumPriority.length}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 font-semibold text-sm mb-1">💡 Low Priority</p>
              <p className="text-text-muted text-xs">Nice to have</p>
            </div>
            <div className="text-3xl font-bold text-green-400">{lowPriority.length}</div>
          </div>
        </motion.div>
      </div>

      {/* High Priority Recommendations */}
      {highPriority.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-red-400" />
            🔥 High Priority Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highPriority.map((rec: any) => (
              <RecommendationCard
                key={rec.id}
                id={rec.id}
                title={rec.title}
                description={rec.description}
                priority={rec.priority}
                estimatedImpact={rec.estimatedImpact}
                timeframe={rec.timeframe}
                actionItems={rec.actionItems}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Medium Priority Recommendations */}
      {mediumPriority.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            ⚡ Medium Priority Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediumPriority.map((rec: any) => (
              <RecommendationCard
                key={rec.id}
                id={rec.id}
                title={rec.title}
                description={rec.description}
                priority={rec.priority}
                estimatedImpact={rec.estimatedImpact}
                timeframe={rec.timeframe}
                actionItems={rec.actionItems}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Low Priority Recommendations */}
      {lowPriority.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-green-400" />
            💡 Low Priority Ideas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lowPriority.map((rec: any) => (
              <RecommendationCard
                key={rec.id}
                id={rec.id}
                title={rec.title}
                description={rec.description}
                priority={rec.priority}
                estimatedImpact={rec.estimatedImpact}
                timeframe={rec.timeframe}
                actionItems={rec.actionItems}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Implementation Roadmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-accent" />
          📅 Suggested Implementation Roadmap
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-20 shrink-0">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-red-400 font-semibold">Week 1-2</p>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Immediate Actions (High Priority)</h3>
              <ul className="space-y-2">
                {highPriority.slice(0, 3).map((rec: any) => (
                  <li key={rec.id} className="text-sm text-text-secondary flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    {rec.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-20 shrink-0">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-yellow-400 font-semibold">Week 3-6</p>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Short-term Initiatives (Medium Priority)</h3>
              <ul className="space-y-2">
                {mediumPriority.slice(0, 3).map((rec: any) => (
                  <li key={rec.id} className="text-sm text-text-secondary flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    {rec.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-20 shrink-0">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-green-400 font-semibold">Month 2+</p>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Long-term Opportunities (Low Priority)</h3>
              <ul className="space-y-2">
                {lowPriority.slice(0, 3).map((rec: any) => (
                  <li key={rec.id} className="text-sm text-text-secondary flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    {rec.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Success Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg"
      >
        <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-accent" />
          📈 Success Metrics to Track
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-button-dark/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-accent" />
              <p className="text-sm font-semibold text-text-primary">Revenue Growth</p>
            </div>
            <p className="text-xs text-text-muted">Track monthly revenue increases</p>
          </div>
          <div className="bg-button-dark/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-accent" />
              <p className="text-sm font-semibold text-text-primary">Customer Retention</p>
            </div>
            <p className="text-xs text-text-muted">Monitor repeat purchase rate</p>
          </div>
          <div className="bg-button-dark/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-accent" />
              <p className="text-sm font-semibold text-text-primary">Conversion Rate</p>
            </div>
            <p className="text-xs text-text-muted">Measure one-time to repeat conversions</p>
          </div>
          <div className="bg-button-dark/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-accent" />
              <p className="text-sm font-semibold text-text-primary">Customer LTV</p>
            </div>
            <p className="text-xs text-text-muted">Track lifetime value improvements</p>
          </div>
        </div>
      </motion.div>

      {/* No Recommendations Fallback */}
      {recommendations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-secondary rounded-xl p-12 border border-button-dark shadow-lg text-center"
        >
          <Lightbulb className="w-16 h-16 text-accent mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-text-primary mb-2">No Recommendations Available</h3>
          <p className="text-text-muted">
            We're analyzing your business data. Check back soon for personalized strategic recommendations.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

