import { motion } from 'framer-motion';

interface HealthScoreGaugeProps {
  score: number;
  maxScore?: number;
  grade: string;
  label: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  components?: {
    retention: number;
    growth: number;
    productHealth: number;
    revenue: number;
  };
}

export const HealthScoreGauge = ({
  score,
  maxScore = 100,
  grade,
  label,
  status,
  components
}: HealthScoreGaugeProps) => {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  const statusConfig = {
    healthy: { color: '#10B981', bgColor: 'bg-green-500/10', label: 'Healthy' },
    warning: { color: '#F59E0B', bgColor: 'bg-yellow-500/10', label: 'Needs Attention' },
    critical: { color: '#EF4444', bgColor: 'bg-red-500/10', label: 'Critical' },
    unknown: { color: '#6B7280', bgColor: 'bg-gray-500/10', label: 'Unknown' }
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-primary-secondary rounded-xl p-8 border border-button-dark shadow-lg"
    >
      <h3 className="text-xl font-semibold text-text-primary mb-6 text-center">
        {label}
      </h3>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90 w-48 h-48">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#33373E"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="96"
              cy="96"
              r="80"
              stroke={config.color}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-text-primary">
              {score}
            </div>
            <div className="text-2xl font-semibold text-text-muted">
              {grade}
            </div>
          </div>
        </div>
      </div>

      <div className={`${config.bgColor} rounded-lg p-4 text-center mb-6`}>
        <span className="text-sm font-medium" style={{ color: config.color }}>
          Status: {config.label}
        </span>
      </div>

      {components && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-text-muted mb-2">Score Breakdown:</div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Retention</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-button-dark rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${(components.retention / 25) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
              <span className="text-sm font-medium text-text-primary w-12 text-right">
                {components.retention}/25
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Growth</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-button-dark rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(components.growth / 25) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
              <span className="text-sm font-medium text-text-primary w-12 text-right">
                {components.growth}/25
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Product Health</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-button-dark rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(components.productHealth / 25) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />
              </div>
              <span className="text-sm font-medium text-text-primary w-12 text-right">
                {components.productHealth}/25
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Revenue</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-button-dark rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(components.revenue / 25) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </div>
              <span className="text-sm font-medium text-text-primary w-12 text-right">
                {components.revenue}/25
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

