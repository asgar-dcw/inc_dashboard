import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';

interface RecommendationCardProps {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  impact: string;
  effort: string;
  timeframe: string;
  roi: string;
  steps: string[];
  estimatedCost?: number;
  estimatedRevenue?: number;
}

export const RecommendationCard = ({
  priority,
  title,
  description,
  impact,
  effort,
  timeframe,
  roi,
  steps
}: RecommendationCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const priorityConfig = {
    critical: {
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: '🔴 CRITICAL'
    },
    high: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      label: '🟡 HIGH PRIORITY'
    },
    medium: {
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      label: '🟢 MEDIUM PRIORITY'
    }
  };

  const config = priorityConfig[priority];
  const progress = (completedSteps.size / steps.length) * 100;

  const toggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedSteps(newCompleted);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.bg} ${config.border} border rounded-xl p-6 shadow-lg`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className={`text-sm font-semibold ${config.color} mb-2`}>
            {config.label}
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            {title}
          </h3>
          <p className="text-sm text-text-secondary">
            {description}
          </p>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-4 p-2 bg-button-dark hover:bg-button-darkAlt rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-text-primary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-primary" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-xs text-text-muted mb-1">Impact</div>
          <div className="text-sm font-semibold text-green-400">{impact}</div>
        </div>
        <div>
          <div className="text-xs text-text-muted mb-1">Effort</div>
          <div className="text-sm font-semibold text-text-secondary">{effort}</div>
        </div>
        <div>
          <div className="text-xs text-text-muted mb-1">Timeframe</div>
          <div className="text-sm font-semibold text-text-secondary">{timeframe}</div>
        </div>
        <div>
          <div className="text-xs text-text-muted mb-1">ROI</div>
          <div className="text-sm font-semibold text-accent">{roi}</div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="border-t border-button-dark pt-4 mt-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-primary">
                    Implementation Steps
                  </span>
                  <span className="text-sm text-text-muted">
                    {completedSteps.size}/{steps.length} completed
                  </span>
                </div>
                
                <div className="w-full bg-button-dark rounded-full h-2 mb-4">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <div className="space-y-2">
                  {steps.map((step, index) => {
                    const isCompleted = completedSteps.has(index);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-primary-secondary rounded-lg hover:bg-button-dark transition-colors cursor-pointer"
                        onClick={() => toggleStep(index)}
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${isCompleted ? 'text-text-muted line-through' : 'text-text-secondary'}`}>
                          {step}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors">
                  Start Implementation
                </button>
                <button className="px-4 py-2 bg-button-dark hover:bg-button-darkAlt text-text-primary rounded-lg text-sm font-medium transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

