import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import { buyerApi, SellerWithPrice, PnLData } from '../../api/client';

interface TradeDialogProps {
  open: boolean;
  onClose: () => void;
  seller: SellerWithPrice | null;
  balance: number;
  onSuccess: (newBalance: number) => void;
}

const TradeDialog: React.FC<TradeDialogProps> = ({
  open,
  onClose,
  seller,
  balance,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pnl, setPnl] = useState<PnLData | null>(null);

  const price = seller?.latestPrice?.price || 0;
  const total = price * parseInt(quantity || '0');

  // Load P&L data when dialog opens
  useEffect(() => {
    if (open && seller) {
      const loadPnL = async () => {
        try {
          const response = await buyerApi.getPnL(seller.id);
          setPnl(response.data);
        } catch {
          // Ignore error - PnL is optional
        }
      };
      loadPnL();
    }
  }, [open, seller]);

  const handleSideChange = (_: React.MouseEvent<HTMLElement>, newSide: 'buy' | 'sell' | null) => {
    if (newSide !== null) {
      setSide(newSide);
    }
  };

  const handleSubmit = async () => {
    setError('');

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError(t('buyer.invalidQuantity'));
      return;
    }

    if (side === 'buy' && total > balance) {
      setError(t('buyer.insufficientBalance'));
      return;
    }

    if (side === 'sell' && pnl && qty > pnl.position) {
      setError(t('buyer.insufficientPosition'));
      return;
    }

    if (!seller) return;

    setLoading(true);
    try {
      const response = await buyerApi.trade({
        sellerId: seller.id,
        price,
        quantity: qty,
        side,
      });
      onSuccess(response.data.balance);
      setQuantity('1');
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        t('buyer.tradeFailed');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setQuantity('1');
      setSide('buy');
      setError('');
      setPnl(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t('buyer.trade')} - {seller?.username}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {t('buyer.currentPrice')}
          </Typography>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
            ${price.toFixed(2)}
          </Typography>
        </Box>

        {pnl && pnl.position > 0 && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {t('buyer.position')}: {pnl.position}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: pnl.pnl >= 0 ? 'success.main' : 'error.main' }}
            >
              {t('buyer.pnl')}: ${pnl.pnl.toFixed(2)} ({pnl.pnlPercent.toFixed(2)}%)
            </Typography>
          </Box>
        )}

        <ToggleButtonGroup
          value={side}
          exclusive
          onChange={handleSideChange}
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton
            value="buy"
            sx={{
              '&.Mui-selected': {
                bgcolor: 'success.main',
                color: 'success.contrastText',
                '&:hover': { bgcolor: 'success.dark' },
              },
            }}
          >
            {t('buyer.buy')}
          </ToggleButton>
          <ToggleButton
            value="sell"
            sx={{
              '&.Mui-selected': {
                bgcolor: 'error.main',
                color: 'error.contrastText',
                '&:hover': { bgcolor: 'error.dark' },
              },
            }}
            disabled={!pnl || pnl.position === 0}
          >
            {t('buyer.sell')}
          </ToggleButton>
        </ToggleButtonGroup>

        <TextField
          fullWidth
          label={t('buyer.quantity')}
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          margin="normal"
          inputProps={{ min: '1', step: '1' }}
          disabled={loading}
        />

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography color="text.secondary">{t('buyer.total')}:</Typography>
          <Typography sx={{ fontWeight: 600 }}>${total.toFixed(2)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography color="text.secondary">{t('buyer.balance')}:</Typography>
          <Typography sx={{ color: balance < total && side === 'buy' ? 'error.main' : 'inherit' }}>
            ${balance.toFixed(2)}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !quantity}
          color={side === 'buy' ? 'success' : 'error'}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : side === 'buy' ? (
            t('buyer.buy')
          ) : (
            t('buyer.sell')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TradeDialog;
