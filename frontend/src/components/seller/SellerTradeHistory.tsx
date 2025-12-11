import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { sellerApi, TradeRecord } from '../../api/client';

const SellerTradeHistory: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTrades = async () => {
      setLoading(true);
      try {
        const response = await sellerApi.getTradeHistory(50);
        setTrades(response.data.trades);
      } catch {
        setError(t('seller.failedLoadTradeHistory'));
      } finally {
        setLoading(false);
      }
    };
    loadTrades();
  }, [t]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isMobile) {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {t('seller.tradeHistory')}
        </Typography>

        {trades.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            {t('seller.noTrades')}
          </Typography>
        ) : (
          <TableContainer>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('seller.date')}</TableCell>
                  {!isMobile && <TableCell>{t('seller.buyer')}</TableCell>}
                  <TableCell align="right">{t('buyer.side')}</TableCell>
                  <TableCell align="right">{t('seller.price')}</TableCell>
                  <TableCell align="right">{t('buyer.quantity')}</TableCell>
                  <TableCell align="right">{t('buyer.total')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>{formatDate(trade.timestamp)}</TableCell>
                    {!isMobile && <TableCell>{trade.buyerName}</TableCell>}
                    <TableCell align="right">
                      <Chip
                        label={trade.side === 'buy' ? t('seller.buyerBought') : t('seller.buyerSold')}
                        size="small"
                        color={trade.side === 'buy' ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">${trade.price.toFixed(2)}</TableCell>
                    <TableCell align="right">{trade.quantity}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                      ${(trade.price * trade.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SellerTradeHistory;
