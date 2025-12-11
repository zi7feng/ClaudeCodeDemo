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
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { buyerApi, AccountValuePoint } from '../../api/client';

interface AccountValueGraphProps {
  userRole: 'buyer' | 'seller';
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: AccountValuePoint;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  const { t } = useTranslation();

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.timestamp);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

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
          {formattedDate} {formattedTime}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: '#1976D2',
            fontWeight: 700,
          }}
        >
          {t('chart.accountValue')}: ${data.accountValue.toFixed(2)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('chart.cash')}: ${data.cashBalance.toFixed(2)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('chart.equity')}: ${data.equityValue.toFixed(2)}
        </Typography>
      </Box>
    );
  }
  return null;
};

const AccountValueGraph: React.FC<AccountValueGraphProps> = ({ userRole }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [data, setData] = useState<AccountValuePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        if (userRole === 'buyer') {
          const response = await buyerApi.getAccountValueHistory();
          setData(response.data.data);
        }
      } catch {
        setError(t('chart.failedLoadAccountValueHistory'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userRole, t]);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {t('chart.accountValueHistory')}
        </Typography>

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
          <Box sx={{ width: '100%', height: isMobile ? 250 : 350 }}>
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
                  dataKey="timestamp"
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
                <Line
                  type="monotone"
                  dataKey="accountValue"
                  stroke="#1976D2"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#1976D2', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#1976D2', stroke: '#fff', strokeWidth: 2 }}
                  name={t('chart.accountValue')}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountValueGraph;
