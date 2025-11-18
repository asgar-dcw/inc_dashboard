import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface BarChartComponentProps {
  data: any[];
  dataKeys?: { key: string; color: string; name: string }[];
  xAxisKey?: string;
  xKey?: string;
  yKey?: string;
  color?: string;
  title?: string;
  height?: number;
  layout?: 'vertical' | 'horizontal';
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

export const BarChartComponent = ({
  data,
  dataKeys,
  xAxisKey,
  xKey,
  yKey,
  color = '#F76C2F',
  height = 300,
  layout = 'horizontal'
}: BarChartComponentProps) => {
  // Support both prop patterns
  const finalXKey = xKey || xAxisKey || 'name';
  const finalYKey = yKey;
  const finalDataKeys = dataKeys || (finalYKey ? [{ key: finalYKey, color, name: finalYKey }] : []);

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={layout}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#33373E" />
          {layout === 'horizontal' ? (
            <>
              <XAxis
                dataKey={finalXKey}
                stroke="#A0A0A0"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#A0A0A0"
                style={{ fontSize: '12px' }}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                stroke="#A0A0A0"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                type="category"
                dataKey={finalXKey}
                stroke="#A0A0A0"
                style={{ fontSize: '12px' }}
              />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#D0D0D0' }}
            iconType="circle"
          />
          {finalDataKeys.map((item, index) => (
            <Bar
              key={index}
              dataKey={item.key}
              fill={item.color}
              name={item.name}
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
