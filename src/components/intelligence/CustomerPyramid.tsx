import { motion } from 'framer-motion';

interface PyramidSegment {
  name: string;
  count: number;
  revenue: number;
  percentage: string;
  ltv: number;
}

interface CustomerPyramidProps {
  segments: PyramidSegment[];
  highlightProblem?: boolean;
}

export const CustomerPyramid = ({ segments, highlightProblem = false }: CustomerPyramidProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const segmentColors = {
    'VIP': { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
    'Loyal': { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
    'Regular': { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
    'Repeat': { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' },
    'One-time': { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' }
  };

  return (
    <div className="bg-primary-secondary rounded-xl p-8 border border-button-dark shadow-lg">
      <h3 className="text-xl font-semibold text-text-primary mb-6 text-center">
        Customer Value Pyramid
      </h3>

      <div className="space-y-3 mb-6">
        {(segments || []).map((segment, index) => {
          const colors = segmentColors[segment.name as keyof typeof segmentColors];
          const height = Math.max(40, parseFloat(segment.percentage) * 2);
          
          return (
            <motion.div
              key={segment.name}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`${colors?.bg} ${colors?.border} border-2 rounded-lg p-4 transition-all hover:scale-[1.02]`}
              style={{ 
                height: `${height}px`,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${colors?.text}`}>
                    {segment.name}
                  </span>
                  <span className="text-sm text-text-muted">
                    {segment.percentage}% of base
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">
                    {formatNumber(segment.count)} customers
                  </span>
                  <span className="text-text-secondary">
                    {formatCurrency(segment.revenue)} revenue
                  </span>
                </div>
                
                {segment.ltv > 0 && (
                  <div className="text-xs text-text-muted mt-1">
                    Avg LTV: {formatCurrency(segment.ltv)}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {highlightProblem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-red-400">Problem Identified</span>
          </div>
          <p className="text-sm text-text-secondary">
            Base is too heavy! Goal: Move customers UP the pyramid through retention strategies.
          </p>
        </motion.div>
      )}
    </div>
  );
};

