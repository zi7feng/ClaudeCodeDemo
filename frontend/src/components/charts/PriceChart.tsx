import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { pricesApi, ChartDataPoint, PriceStats } from '../../api/client';
import TimeRangeSelector from './TimeRangeSelector';

interface PriceChartProps {
  sellerId: number;
  sellerName?: string;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: ChartDataPoint;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  const { t } = useTranslation();

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 2,
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          {label} ({data.session})
        </Typography>
        {/* Price displayed prominently with larger font and bold */}
        <Typography
          variant="h6"
          sx={{
            color: '#1976D2',
            fontWeight: 700,
            mb: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            pb: 1,
          }}
        >
          {t('seller.price')}: ${data.price.toFixed(2)}
        </Typography>
        {/* MA lines with smaller, lighter text */}
        {payload.map(
          (item) =>
            item.dataKey !== 'price' && (
              <Typography
                key={item.dataKey}
                variant="body2"
                sx={{ color: item.color, opacity: 0.85, fontSize: '0.8rem' }}
              >
                {item.name}: ${item.value.toFixed(2)}
              </Typography>
            )
        )}
      </Box>
    );
  }
  return null;
};

const PriceChart: React.FC<PriceChartProps> = ({ sellerId, sellerName }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [period, setPeriod] = useState('1M');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await pricesApi.getSellerPrices(sellerId, period);
        setData(response.data.data);
      } catch {
        setError(t('chart.failedLoadChartData'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [sellerId, period]);

  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const response = await pricesApi.getSellerStats(sellerId);
        setStats(response.data.stats);
      } catch {
        // Stats loading failure is non-critical
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [sellerId]);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {t('chart.priceChart')} {sellerName && `- ${sellerName}`}
        </Typography>

        <TimeRangeSelector value={period} onChange={setPeriod} />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" align="center" sx={{ py: 4 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && data.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            {t('common.noData')}
          </Typography>
        )}

        {!loading && !error && data.length > 0 && (
          <Box sx={{ width: '100%', height: isMobile ? 300 : 400 }}>
            <ResponsiveContainer>
              <LineChart
                data={data}
                margin={{
                  top: 5,
                  right: 10,
                  left: isMobile ? 0 : 10,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  stroke={theme.palette.text.secondary}
                />
                <YAxis
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  stroke={theme.palette.text.secondary}
                  tickFormatter={(value) => `$${value}`}
                  width={isMobile ? 50 : 60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                  iconSize={isMobile ? 8 : 14}
                />
                {/* Price line - prominent with thicker stroke and data points */}
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#1976D2"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#1976D2', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#1976D2', stroke: '#fff', strokeWidth: 2 }}
                  name={t('seller.price')}
                />
                {/* MA lines - lighter colors and thinner strokes for visual hierarchy */}
                <Line
                  type="monotone"
                  dataKey="ma5"
                  stroke="#FF9999"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  name={t('chart.ma5')}
                />
                <Line
                  type="monotone"
                  dataKey="ma10"
                  stroke="#80E0D8"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  name={t('chart.ma10')}
                />
                <Line
                  type="monotone"
                  dataKey="ma20"
                  stroke="#87CEEB"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  name={t('chart.ma20')}
                />
                <Line
                  type="monotone"
                  dataKey="ma50"
                  stroke="#B8E0C8"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  name={t('chart.ma50')}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* Price Statistics Table */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('chart.priceAnalysis')}
          </Typography>
          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : stats ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('chart.metric')}</TableCell>
                    <TableCell align="right">{t('chart.value')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{t('chart.lastSalePrice')}</TableCell>
                    <TableCell align="right">
                      {stats.lastSalePrice !== null ? `$${stats.lastSalePrice.toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('chart.oneWeekHigh')}</TableCell>
                    <TableCell align="right">
                      {stats['1wHigh'] !== null ? `$${stats['1wHigh'].toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('chart.oneWeekLow')}</TableCell>
                    <TableCell align="right">
                      {stats['1wLow'] !== null ? `$${stats['1wLow'].toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('chart.oneMonthHigh')}</TableCell>
                    <TableCell align="right">
                      {stats['1mHigh'] !== null ? `$${stats['1mHigh'].toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('chart.oneMonthLow')}</TableCell>
                    <TableCell align="right">
                      {stats['1mLow'] !== null ? `$${stats['1mLow'].toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('chart.threeMonthHigh')}</TableCell>
                    <TableCell align="right">
                      {stats['3mHigh'] !== null ? `$${stats['3mHigh'].toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('chart.threeMonthLow')}</TableCell>
                    <TableCell align="right">
                      {stats['3mLow'] !== null ? `$${stats['3mLow'].toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('chart.sixMonthHigh')}</TableCell>
                    <TableCell align="right">
                      {stats['6mHigh'] !== null ? `$${stats['6mHigh'].toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('chart.sixMonthLow')}</TableCell>
                    <TableCell align="right">
                      {stats['6mLow'] !== null ? `$${stats['6mLow'].toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">{t('common.noData')}</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PriceChart;
