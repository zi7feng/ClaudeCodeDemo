import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
} from '@mui/material';
import { HoldingData } from '../../api/client';

interface StockCardProps {
  holding: HoldingData;
  onViewChart: (sellerId: number, sellerName: string) => void;
}

const StockCard: React.FC<StockCardProps> = ({ holding, onViewChart }) => {
  const { t } = useTranslation();

  const pnlColor = holding.pnl >= 0 ? 'success.main' : 'error.main';
  const pnlSign = holding.pnl >= 0 ? '+' : '';

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea
        onClick={() => onViewChart(holding.sellerId, holding.sellerName)}
        sx={{ height: '100%' }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom noWrap>
            {holding.sellerName}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('holdings.currentPrice')}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              ${holding.currentPrice.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('holdings.shares')}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {holding.shares}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('holdings.pnl')}
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: pnlColor }}>
                {pnlSign}${Math.abs(holding.pnl).toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: pnlColor }}>
                ({pnlSign}{holding.pnlPercent.toFixed(2)}%)
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default StockCard;
