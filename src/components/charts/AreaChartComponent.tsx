import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface AreaChartComponentProps {
  data: any[];
  dataKeys: { key: string; color: string; name: string }[];
  xAxisKey: string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-primary-secondary border border-button-dark rounded-lg p-3 shadow-xl">
        <p className="text-text-primary font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-text-secondary text-sm">
            <span className="font-medium" style={{ color: entry.color }}>
              {entry.name}:
            </span>{' '}
            {typeof entry.value === 'number' && entry.value > 1000
              ? `$${entry.value.toLocaleString()}`
              : entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AreaChartComponent = ({ data, dataKeys, xAxisKey, height = 300 }: AreaChartComponentProps) => {
  // Handle empty or undefined data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        No data available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {(dataKeys || []).map((item, index) => (
              <linearGradient key={index} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={item.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={item.color} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#33373E" />
          <XAxis
            dataKey={xAxisKey}
            stroke="#A0A0A0"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#A0A0A0"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#D0D0D0' }}
            iconType="circle"
          />
          {(dataKeys || []).map((item, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey={item.key}
              stroke={item.color}
              strokeWidth={2}
              name={item.name}
              fill={`url(#color${index})`}
              animationDuration={1000}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
