import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  ShowChart as ChartIcon,
  ShoppingCart as TradeIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { pricesApi, SellerWithPrice } from '../../api/client';

interface SellerListProps {
  onSelectSeller: (seller: SellerWithPrice) => void;
  onViewChart: (sellerId: number, sellerName: string) => void;
}

const SellerList: React.FC<SellerListProps> = ({ onSelectSeller, onViewChart }) => {
  const { t } = useTranslation();
  const [sellers, setSellers] = useState<SellerWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce the search query with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadSellers = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const response = await pricesApi.getAllSellers(search || undefined);
      setSellers(response.data.sellers);
      setError('');
    } catch {
      setError(t('buyer.failedLoadSellers'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load sellers when debounced search changes
  useEffect(() => {
    loadSellers(debouncedSearch);
  }, [debouncedSearch, loadSellers]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {t('buyer.sellers')}
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder={t('buyer.searchSellers')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : sellers.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            {t('common.noData')}
          </Typography>
        ) : (
          <List>
            {sellers.map((seller) => (
              <ListItem
                key={seller.id}
                divider
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemText
                  primary={seller.username}
                  secondary={
                    seller.latestPrice ? (
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ color: 'primary.main', fontWeight: 600 }}
                        >
                          ${seller.latestPrice.price.toFixed(2)}
                        </Typography>
                        <Chip
                          label={seller.latestPrice.session}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.625rem', height: 20 }}
                        />
                        <Typography component="span" variant="caption" color="text.secondary">
                          {seller.latestPrice.date}
                        </Typography>
                      </Box>
                    ) : (
                      t('buyer.noPriceAvailable')
                    )
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => onViewChart(seller.id, seller.username)}
                    sx={{ mr: 1 }}
                    title={t('buyer.viewChart')}
                  >
                    <ChartIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => onSelectSeller(seller)}
                    color="primary"
                    title={t('buyer.trade')}
                    disabled={!seller.latestPrice}
                  >
                    <TradeIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default SellerList;
