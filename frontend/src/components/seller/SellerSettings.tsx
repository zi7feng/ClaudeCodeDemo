import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { sellerApi } from '../../api/client';

const SellerSettings: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    baselineWeight: '',
    basePrice: '',
    kUp: '',
    kDown: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showValues, setShowValues] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await sellerApi.getSettings();
        setFormData({
          baselineWeight: response.data.baselineWeight?.toString() || '',
          basePrice: response.data.basePrice?.toString() || '',
          kUp: response.data.kUp?.toString() || '',
          kDown: response.data.kDown?.toString() || '',
        });
      } catch {
        setError(t('seller.failedLoadSettings'));
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [t]);

  const handleToggleVisibility = () => {
    setShowValues((prev) => !prev);
  };

  const getMaskedValue = (value: string): string => {
    if (!value) return '';
    return showValues ? value : '***';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">
            {t('seller.settings')}
          </Typography>
          <IconButton
            onClick={handleToggleVisibility}
            aria-label={showValues ? t('seller.hideSettings') : t('seller.showSettings')}
          >
            {showValues ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('seller.settingsLocked')}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('seller.settingsFormula')}
          <br />
          W {'>'}= W0: price = P0 + (W - W0) * kUp
          <br />
          W {'<'} W0: price = P0 + (W - W0) * kDown
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box>
          <TextField
            fullWidth
            label={t('seller.baselineWeight')}
            value={getMaskedValue(formData.baselineWeight)}
            margin="normal"
            disabled
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
              readOnly: true,
            }}
            helperText={t('seller.helperBaselineWeight')}
          />

          <TextField
            fullWidth
            label={t('seller.basePrice')}
            value={getMaskedValue(formData.basePrice)}
            margin="normal"
            disabled
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              readOnly: true,
            }}
            helperText={t('seller.helperBasePrice')}
          />

          <TextField
            fullWidth
            label={t('seller.kUp')}
            value={getMaskedValue(formData.kUp)}
            margin="normal"
            disabled
            InputProps={{
              readOnly: true,
            }}
            helperText={t('seller.helperKUp')}
          />

          <TextField
            fullWidth
            label={t('seller.kDown')}
            value={getMaskedValue(formData.kDown)}
            margin="normal"
            disabled
            InputProps={{
              readOnly: true,
            }}
            helperText={t('seller.helperKDown')}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SellerSettings;
