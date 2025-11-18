import { motion } from 'framer-motion';
import { ChangeEvent } from 'react';

interface AnimatedSelectProps {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}

export const AnimatedSelect = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  className = ''
}: AnimatedSelectProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
        {label}
      </label>
      <div className="relative">
        <motion.select
          value={value}
          onChange={onChange}
          disabled={disabled}
          whileFocus={{ scale: 1.02 }}
          className="w-full rounded-lg border border-button-dark bg-primary-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60 appearance-none cursor-pointer"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </motion.select>
        <motion.div
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          animate={{ rotate: disabled ? 0 : [0, 5, -5, 0] }}
          transition={{ duration: 0.3 }}
        >
          <svg
            className="w-4 h-4 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
};

