import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
} from '@mui/material';
import { buyerApi, HoldingData } from '../../api/client';
import PnLCard from './PnLCard';
import StockCard from './StockCard';

interface HoldingsCardProps {
  onViewChart: (sellerId: number, sellerName: string) => void;
  refreshTrigger?: number;
}

const HoldingsCard: React.FC<HoldingsCardProps> = ({ onViewChart, refreshTrigger }) => {
  const { t } = useTranslation();
  const [holdings, setHoldings] = useState<HoldingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHoldings = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await buyerApi.getHoldings();
        const activeHoldings = response.data.holdings.filter((h) => h.shares > 0);
        setHoldings(activeHoldings);
      } catch {
        setError(t('holdings.failedLoadHoldings'));
      } finally {
        setLoading(false);
      }
    };
    loadHoldings();
  }, [t, refreshTrigger]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {t('holdings.title')}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <PnLCard userRole="buyer" />
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" align="center" sx={{ py: 4 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && holdings.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            {t('holdings.noHoldings')}
          </Typography>
        )}

        {!loading && !error && holdings.length > 0 && (
          <Grid container spacing={2}>
            {holdings.map((holding) => (
              <Grid item xs={12} sm={6} md={4} key={holding.sellerId}>
                <StockCard holding={holding} onViewChart={onViewChart} />
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default HoldingsCard;
