import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DataAvailabilityNoticeProps {
  show: boolean;
  selectedYear?: string;
  selectedMonth?: string;
  description?: string;
  className?: string;
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const formatPeriodLabel = (selectedYear?: string, selectedMonth?: string) => {
  if (!selectedYear || selectedYear === 'All') {
    return 'All available data (past 365 days)';
  }

  if (!selectedMonth || selectedMonth === 'All') {
    return selectedYear;
  }

  const monthIndex = parseInt(selectedMonth, 10) - 1;
  const monthLabel = monthNames[monthIndex] || selectedMonth;
  return `${monthLabel} ${selectedYear}`;
};

export const DataAvailabilityNotice = ({
  show,
  selectedYear = 'All',
  selectedMonth = 'All',
  description = 'Try expanding the time range or clearing filters to see more activity.',
  className,
}: DataAvailabilityNoticeProps) => {
  if (!show) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-100 ${className ?? ''}`}
    >
      <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-300">
        <AlertTriangle size={20} />
      </div>
      <div>
        <p className="text-sm font-semibold text-yellow-100">
          No data available for {formatPeriodLabel(selectedYear, selectedMonth)}
        </p>
        <p className="text-xs text-yellow-200/80 mt-1">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

