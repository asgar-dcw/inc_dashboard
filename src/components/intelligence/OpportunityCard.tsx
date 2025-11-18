import { motion } from 'framer-motion';
import { TrendingUp, Clock, Target, DollarSign } from 'lucide-react';

interface OpportunityCardProps {
  id: string;
  title: string;
  impact: string;
  effort: 'Low' | 'Medium' | 'High';
  timeframe: string;
  roi?: string;
  onViewDetails?: () => void;
}

export const OpportunityCard = ({
  title,
  impact,
  effort,
  timeframe,
  roi,
  onViewDetails
}: OpportunityCardProps) => {
  const effortConfig = {
    Low: { color: 'text-green-400', bg: 'bg-green-500/10' },
    Medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    High: { color: 'text-red-400', bg: 'bg-red-500/10' }
  };

  // Normalize effort value to handle various cases
  const normalizedEffort = (effort || 'Low') as 'Low' | 'Medium' | 'High';
  const config = effortConfig[normalizedEffort] || effortConfig.Low;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(247, 108, 47, 0.2)' }}
      className="bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg cursor-pointer transition-all"
      onClick={onViewDetails}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex-1">
          {title}
        </h3>
        <div className="p-2 bg-accent/10 rounded-lg">
          <TrendingUp className="w-5 h-5 text-accent" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-sm text-text-muted">Impact:</span>
          <span className="text-sm font-bold text-green-400">{impact}</span>
        </div>

        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">Effort:</span>
          <span className={`text-sm font-semibold ${config.color}`}>{normalizedEffort}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">Timeframe:</span>
          <span className="text-sm font-medium text-text-secondary">{timeframe}</span>
        </div>

        {roi && (
          <div className="mt-4 pt-4 border-t border-button-dark">
            <span className="text-sm text-text-muted">Expected ROI: </span>
            <span className="text-sm font-bold text-accent">{roi}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

