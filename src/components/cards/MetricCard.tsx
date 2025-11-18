import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  index?: number;
}

export const MetricCard = ({ 
  title, 
  children, 
  action, 
  className = '',
  index = 0
}: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      transition={{ 
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`bg-primary-secondary rounded-xl p-6 border border-button-dark shadow-lg hover:shadow-xl relative overflow-hidden group ${className}`}
    >
      {/* Animated border gradient */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(135deg, rgba(247, 108, 47, 0.1) 0%, transparent 50%)',
        }}
        transition={{ duration: 0.3 }}
      />
      
      <div className="relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 + 0.1 }}
          className="flex items-center justify-between mb-4"
        >
          <h3 className="text-text-primary text-lg font-semibold">{title}</h3>
          {action && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 + 0.2 }}
            >
              {action}
            </motion.div>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.15 }}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
};
