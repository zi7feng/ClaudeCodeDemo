import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { buyerApi, sellerApi, TotalPnLData, DailyPnLData, SellerEarningsData, DailyEarningsData } from '../../api/client';

interface PnLCardProps {
  userRole: 'buyer' | 'seller';
}

type PeriodType = 'today' | 'allTime';

const PnLCard: React.FC<PnLCardProps> = ({ userRole }) => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('allTime');
  const [loading, setLoading] = useState(true);
  const [buyerAllTimeData, setBuyerAllTimeData] = useState<TotalPnLData | null>(null);
  const [buyerDailyData, setBuyerDailyData] = useState<DailyPnLData | null>(null);
  const [sellerAllTimeData, setSellerAllTimeData] = useState<SellerEarningsData | null>(null);
  const [sellerDailyData, setSellerDailyData] = useState<DailyEarningsData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (userRole === 'buyer') {
          const [allTimeRes, dailyRes] = await Promise.all([
            buyerApi.getTotalPnL(),
            buyerApi.getDailyPnL(),
          ]);
          setBuyerAllTimeData(allTimeRes.data);
          setBuyerDailyData(dailyRes.data);
        } else {
          const [allTimeRes, dailyRes] = await Promise.all([
            sellerApi.getEarnings(),
            sellerApi.getDailyEarnings(),
          ]);
          setSellerAllTimeData(allTimeRes.data);
          setSellerDailyData(dailyRes.data);
        }
      } catch {
        // Ignore error
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userRole]);

  const handlePeriodChange = (_: React.MouseEvent<HTMLElement>, newPeriod: PeriodType | null) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  const getValueColor = (value: number) => {
    if (value >= 0) {
      return 'success.main';
    }
    return 'error.main';
  };

  const formatValue = (value: number, showSign: boolean = true) => {
    const sign = showSign && value >= 0 ? '+' : '';
    return `${sign}$${value.toFixed(2)}`;
  };

  const renderBuyerContent = () => {
    const data = period === 'today' ? buyerDailyData : buyerAllTimeData;
    if (!data) return null;

    const totalPnl = data.totalPnl;
    const returnPercent = data.returnPercent;

    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TrendingUpIcon sx={{ fontSize: 40, color: getValueColor(totalPnl) }} />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {period === 'today' ? t('pnl.todayPnl') : t('pnl.allTimePnl')}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, color: getValueColor(totalPnl) }}
            >
              {formatValue(totalPnl)}
              <Typography
                component="span"
                variant="body1"
                sx={{ ml: 1, color: getValueColor(returnPercent) }}
              >
                ({returnPercent.toFixed(2)}%)
              </Typography>
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              {t('pnl.realized')}
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 500, color: getValueColor(data.realizedPnl) }}
            >
              {formatValue(data.realizedPnl)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              {t('pnl.unrealized')}
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 500, color: getValueColor(data.unrealizedPnl) }}
            >
              {formatValue(data.unrealizedPnl)}
            </Typography>
          </Grid>
        </Grid>
      </>
    );
  };

  const renderSellerContent = () => {
    const data = period === 'today' ? sellerDailyData : sellerAllTimeData;
    if (!data) return null;

    const netEarnings = data.netEarnings;

    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TrendingUpIcon sx={{ fontSize: 40, color: getValueColor(netEarnings) }} />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {period === 'today' ? t('pnl.todayPnl') : t('pnl.allTimePnl')}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, color: getValueColor(netEarnings) }}
            >
              {formatValue(netEarnings)}
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              {t('seller.totalReceived')}
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 500, color: 'success.main' }}
            >
              +${data.totalReceived.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({data.buyTransactions} {t('seller.transactions')})
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              {t('seller.totalPaidOut')}
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 500, color: 'error.main' }}
            >
              -${data.totalPaidOut.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({data.sellTransactions} {t('seller.transactions')})
            </Typography>
          </Grid>
        </Grid>
      </>
    );
  };

  return (
    <Card sx={{ height: '100%', bgcolor: 'grey.100' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={handlePeriodChange}
            size="small"
          >
            <ToggleButton value="today">
              {t('pnl.today')}
            </ToggleButton>
            <ToggleButton value="allTime">
              {t('pnl.allTime')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          userRole === 'buyer' ? renderBuyerContent() : renderSellerContent()
        )}
      </CardContent>
    </Card>
  );
};

export default PnLCard;
