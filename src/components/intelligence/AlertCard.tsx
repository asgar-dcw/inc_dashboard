import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface AlertCardProps {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  impact?: string;
  action?: string;
  metric?: number;
  category?: string;
  onViewDetails?: () => void;
  onTakeAction?: () => void;
}

export const AlertCard = ({
  severity,
  title,
  description,
  impact,
  action,
  onViewDetails,
  onTakeAction
}: AlertCardProps) => {
  const severityConfig = {
    critical: {
      icon: AlertTriangle,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-500',
      textColor: 'text-red-400'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-400'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-400'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      iconColor: 'text-green-500',
      textColor: 'text-green-400'
    }
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`${config.bgColor} ${config.borderColor} border rounded-xl p-6 shadow-lg transition-all`}
    >
      <div className="flex items-start gap-4">
        <div className={`${config.iconColor} p-3 rounded-lg bg-primary-secondary`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {title}
          </h3>
          
          <p className="text-text-secondary mb-3">
            {description}
          </p>

          {impact && (
            <div className="mb-3">
              <span className="text-sm font-medium text-text-muted">Impact: </span>
              <span className={`text-sm font-bold ${config.textColor}`}>
                {impact}
              </span>
            </div>
          )}

          {action && (
            <div className="mb-4">
              <span className="text-sm font-medium text-text-muted">Recommended Action: </span>
              <span className="text-sm text-text-secondary">{action}</span>
            </div>
          )}

          <div className="flex gap-3">
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="px-4 py-2 bg-button-dark hover:bg-button-darkAlt text-text-primary rounded-lg text-sm font-medium transition-colors"
              >
                View Details
              </button>
            )}
            {onTakeAction && (
              <button
                onClick={onTakeAction}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                Take Action
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

