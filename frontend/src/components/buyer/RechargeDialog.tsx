import React, { useState } from 'react';
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
  InputAdornment,
} from '@mui/material';
import { buyerApi } from '../../api/client';

interface RechargeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

const RechargeDialog: React.FC<RechargeDialogProps> = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError(t('buyer.invalidRechargeAmount'));
      return;
    }

    setLoading(true);
    try {
      const response = await buyerApi.recharge(amountNum);
      onSuccess(response.data.balance.balance);
      setAmount('');
      onClose();
    } catch {
      setError(t('buyer.rechargeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('buyer.recharge')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label={t('buyer.rechargeAmount')}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          margin="normal"
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          inputProps={{ step: '0.01', min: '0' }}
          autoFocus
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !amount}>
          {loading ? <CircularProgress size={24} /> : t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RechargeDialog;
