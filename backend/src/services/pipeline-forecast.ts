import { executeQuery } from './database.js';

interface HistoricalPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface ForecastPoint extends HistoricalPoint {
  revenueLower: number;
  revenueUpper: number;
  ordersLower: number;
  ordersUpper: number;
}

interface RegressionResult {
  slope: number;
  intercept: number;
  stdDev: number;
}

const HISTORY_WINDOW_DAYS = 730;
const FORECAST_DAYS = 90;
const CONFIDENCE_Z = 1.282; // ~80% interval
const ROLLING_WINDOW = 7;
const FORECAST_CACHE_TTL = 60 * 60 * 1000; // 1 hour

let forecastCache:
  | {
      timestamp: number;
      payload: any;
    }
  | null = null;

const fetchHistoricalData = async (): Promise<HistoricalPoint[]> => {
  const rows = await executeQuery<{
    day: string;
    revenue: string;
    orders: string;
  }>(`
    SELECT
      DATE(created_at) as day,
      SUM(base_grand_total) as revenue,
      COUNT(*) as orders
    FROM sales_order
    WHERE status NOT IN ('canceled', 'closed')
      AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
    GROUP BY day
    ORDER BY day ASC
  `, [HISTORY_WINDOW_DAYS]);

  return rows.map((row) => ({
    date: row.day,
    revenue: parseFloat(row.revenue || '0'),
    orders: parseInt(row.orders || '0', 10),
  }));
};

const computeRollingAverage = (series: number[], window: number): number[] => {
  if (series.length === 0) return [];
  const smoothed: number[] = [];
  let sum = 0;
  for (let i = 0; i < series.length; i += 1) {
    sum += series[i];
    if (i >= window) {
      sum -= series[i - window];
    }
    const divisor = i + 1 < window ? i + 1 : window;
    smoothed.push(sum / divisor);
  }
  return smoothed;
};

const computeRegression = (series: number[]): RegressionResult => {
  const n = series.length;
  if (n === 0) {
    return { slope: 0, intercept: 0, stdDev: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  series.forEach((value, index) => {
    sumX += index;
    sumY += value;
    sumXY += index * value;
    sumX2 += index * index;
  });

  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  const residuals = series.map((value, index) => value - (slope * index + intercept));
  const variance =
    residuals.reduce((acc, val) => acc + val * val, 0) / (Math.max(n - 2, 1));
  const stdDev = Math.sqrt(Math.max(variance, 0));

  return { slope, intercept, stdDev };
};

const buildSeasonalityMultipliers = (history: HistoricalPoint[]) => {
  if (history.length === 0) {
    return {
      weekday: new Array(7).fill(1),
      month: new Array(12).fill(1),
    };
  }

  const weekdaySums = new Array(7).fill(0);
  const weekdayCounts = new Array(7).fill(0);
  const monthSums = new Array(12).fill(0);
  const monthCounts = new Array(12).fill(0);

  let totalRevenue = 0;
  history.forEach((point) => {
    const date = new Date(point.date);
    const weekday = date.getUTCDay();
    const month = date.getUTCMonth();
    weekdaySums[weekday] += point.revenue;
    weekdayCounts[weekday] += 1;
    monthSums[month] += point.revenue;
    monthCounts[month] += 1;
    totalRevenue += point.revenue;
  });

  const overallAvg = totalRevenue / history.length || 1;
  const weekdayMultipliers = weekdaySums.map((sum, idx) =>
    weekdayCounts[idx] > 0 ? (sum / weekdayCounts[idx]) / overallAvg : 1
  );
  const monthMultipliers = monthSums.map((sum, idx) =>
    monthCounts[idx] > 0 ? (sum / monthCounts[idx]) / overallAvg : 1
  );

  return {
    weekday: weekdayMultipliers,
    month: monthMultipliers,
  };
};

const mergeForecast = (
  history: HistoricalPoint[],
  revenueProjection: RegressionResult,
  orderProjection: RegressionResult,
  seasonality: { weekday: number[]; month: number[] },
): ForecastPoint[] => {
  const lastDate = new Date(history[history.length - 1]?.date || Date.now());
  const points: ForecastPoint[] = [];

  for (let i = 0; i < FORECAST_DAYS; i += 1) {
    const x = history.length + i;
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + (i + 1));

    const weekday = forecastDate.getUTCDay();
    const month = forecastDate.getUTCMonth();
    const seasonalityMultiplier =
      seasonality.weekday[weekday] * seasonality.month[month];

    const revenueBase = Math.max(
      revenueProjection.slope * x + revenueProjection.intercept,
      0,
    );
    const ordersBase = Math.max(
      orderProjection.slope * x + orderProjection.intercept,
      0,
    );
    const revenue = revenueBase * seasonalityMultiplier;
    const orders = ordersBase * seasonalityMultiplier;

    const revenueDelta = CONFIDENCE_Z * revenueProjection.stdDev;
    const ordersDelta = CONFIDENCE_Z * orderProjection.stdDev;

    points.push({
      date: forecastDate.toISOString().slice(0, 10),
      revenue,
      orders,
      revenueLower: Math.max(revenue - revenueDelta, 0),
      revenueUpper: revenue + revenueDelta,
      ordersLower: Math.max(orders - ordersDelta, 0),
      ordersUpper: orders + ordersDelta,
    });
  }

  return points;
};

export const getPipelineForecast = async () => {
  if (
    forecastCache &&
    Date.now() - forecastCache.timestamp < FORECAST_CACHE_TTL
  ) {
    return forecastCache.payload;
  }

  const history = await fetchHistoricalData();
  if (history.length === 0) {
    const emptyPayload = {
      generatedAt: new Date().toISOString(),
      horizonDays: FORECAST_DAYS,
      historyDays: 0,
      history: [],
      forecast: [],
      summary: {
        revenueForecast: 0,
        ordersForecast: 0,
        revenueGrowthPct: 0,
        ordersGrowthPct: 0,
      },
    };
    forecastCache = { timestamp: Date.now(), payload: emptyPayload };
    return emptyPayload;
  }

  const revenueSeries = history.map((point) => point.revenue);
  const orderSeries = history.map((point) => point.orders);

  const smoothedRevenue = computeRollingAverage(revenueSeries, ROLLING_WINDOW);
  const smoothedOrders = computeRollingAverage(orderSeries, ROLLING_WINDOW);

  const revenueRegression = computeRegression(smoothedRevenue);
  const orderRegression = computeRegression(smoothedOrders);
  const seasonality = buildSeasonalityMultipliers(history);
  const forecast = mergeForecast(history, revenueRegression, orderRegression, seasonality);

  const revenueForecastTotal = forecast.reduce((sum, point) => sum + point.revenue, 0);
  const ordersForecastTotal = forecast.reduce((sum, point) => sum + point.orders, 0);

  const trailingRevenue = revenueSeries
    .slice(-FORECAST_DAYS)
    .reduce((sum, value) => sum + value, 0);
  const trailingOrders = orderSeries
    .slice(-FORECAST_DAYS)
    .reduce((sum, value) => sum + value, 0);

  const revenueGrowthPct = trailingRevenue > 0
    ? ((revenueForecastTotal - trailingRevenue) / trailingRevenue) * 100
    : 0;
  const ordersGrowthPct = trailingOrders > 0
    ? ((ordersForecastTotal - trailingOrders) / trailingOrders) * 100
    : 0;

  console.log('[PipelineForecast] Generated forecast', {
    historyDays: history.length,
    revenueForecastTotal: Math.round(revenueForecastTotal),
    ordersForecastTotal: Math.round(ordersForecastTotal),
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    horizonDays: FORECAST_DAYS,
    historyDays: history.length,
    history,
    forecast,
    summary: {
      revenueForecast: revenueForecastTotal,
      ordersForecast: ordersForecastTotal,
      revenueLastQuarter: trailingRevenue,
      ordersLastQuarter: trailingOrders,
      revenueGrowthPct,
      ordersGrowthPct,
    },
  };
  forecastCache = { timestamp: Date.now(), payload };
  return payload;
};

export default {
  getPipelineForecast,
};

