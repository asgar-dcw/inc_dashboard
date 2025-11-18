import { motion, useSpring, useTransform } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: number;
  icon: LucideIcon | ReactNode;
  subtitle?: string;
  iconColor?: string;
  alert?: boolean;
  index?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  valueDecimals?: number;
  disableValueAnimation?: boolean;
}

// Animated number component
const AnimatedNumber = ({ value, decimals = 0 }: { value: number; decimals?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const spring = useSpring(0, { stiffness: 80, damping: 20 });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(Number(latest.toFixed(decimals)));
    });
    return () => {
      unsubscribe();
    };
  }, [spring, decimals]);

  return (
    <>
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  );
};

export const StatCard = ({
  title,
  value,
  change,
  trend,
  icon,
  subtitle,
  iconColor = '#F76C2F',
  alert = false,
  index = 0,
  valuePrefix = '',
  valueSuffix = '',
  valueDecimals = 0,
  disableValueAnimation = false
}: StatCardProps) => {
  const displayChange = change !== undefined ? change : trend;
  const isPositive = displayChange !== undefined && displayChange >= 0;

  const renderValue = () => {
    if (typeof value === 'number' && !disableValueAnimation) {
      return (
        <>
          {valuePrefix}
          <AnimatedNumber value={value} decimals={valueDecimals} />
          {valueSuffix}
        </>
      );
    }

    if (typeof value === 'number') {
      return (
        <>
          {valuePrefix}
          {value.toLocaleString(undefined, {
            minimumFractionDigits: valueDecimals,
            maximumFractionDigits: valueDecimals,
          })}
          {valueSuffix}
        </>
      );
    }

    return (
      <>
        {valuePrefix}
        {value}
        {valueSuffix}
      </>
    );
  };
  
  // Render icon - handle both component functions and ReactNode
  const renderIcon = () => {
    // Try to render as component if it's a function or has $$typeof (ForwardRef/Memo)
    if (typeof icon === 'function' || (icon && typeof icon === 'object' && '$$typeof' in icon)) {
      const IconComponent = icon as LucideIcon;
      return <IconComponent size={24} style={{ color: iconColor }} />;
    }
    // Otherwise return null to avoid rendering invalid objects
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        scale: 1.03, 
        y: -6,
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      transition={{ 
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`bg-primary-secondary rounded-xl p-6 border shadow-lg hover:shadow-2xl cursor-pointer relative overflow-hidden group ${
        alert ? 'border-red-500/50' : 'border-button-dark'
      }`}
    >
      {/* Animated background gradient on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
      />
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full"
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.1 }}
            className="text-text-muted text-sm font-medium mb-1"
          >
            {title}
          </motion.p>
          <motion.h3 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
            className="text-text-primary text-3xl font-bold mb-2"
          >
            {typeof value === 'number' ? (
              <AnimatedNumber value={value} />
            ) : typeof value === 'string' && value.startsWith('$') ? (
              // Handle currency strings
              `$${parseFloat(value.replace(/[^0-9.]/g, '') || '0').toLocaleString()}`
            ) : (
              value
            )}
          </motion.h3>
          {displayChange !== undefined && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="flex items-center gap-1"
            >
              <motion.span
                initial={{ opacity: 0, x: -10, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ 
                  delay: index * 0.1 + 0.4,
                  type: 'spring',
                  stiffness: 300
                }}
                className={`text-sm font-semibold ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                <motion.span
                  animate={{ 
                    rotate: isPositive ? [0, -10, 10, 0] : [0, 10, -10, 0]
                  }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
                  className="inline-block"
                >
                  {isPositive ? '↑' : '↓'}
                </motion.span>
                {' '}
                {Math.abs(displayChange)}%
              </motion.span>
              <span className="text-text-muted text-xs">vs last period</span>
            </motion.div>
          )}
          {subtitle && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.4 }}
              className="text-text-secondary text-xs mt-1"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          whileHover={{ 
            rotate: 360,
            scale: 1.1,
            transition: { duration: 0.6, ease: 'easeInOut' }
          }}
          transition={{ 
            delay: index * 0.1 + 0.3,
            type: 'spring',
            stiffness: 200
          }}
          className="rounded-lg p-3 relative"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          {/* Pulsing glow effect */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: iconColor }}
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <div className="relative z-10">
            {renderIcon()}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
