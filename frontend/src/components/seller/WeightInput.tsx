import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
  ListItemText,
} from '@mui/material';
import { sellerApi } from '../../api/client';
import { calculatePrice } from '../../utils/priceCalculator';

interface SellerSettings {
  baselineWeight: number | null;
  basePrice: number | null;
  kUp: number | null;
  kDown: number | null;
}

const WeightInput: React.FC = () => {
  const { t } = useTranslation();
  const [weight, setWeight] = useState('');
  const [session, setSession] = useState<'AM' | 'PM'>('AM');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [settings, setSettings] = useState<SellerSettings | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filledSessions, setFilledSessions] = useState<('AM' | 'PM')[]>([]);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await sellerApi.getSettings();
        setSettings(response.data);
      } catch {
        setError(t('seller.failedLoadSettings'));
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [t]);

  // Load filled sessions when date changes
  const loadFilledSessions = useCallback(async (selectedDate: string) => {
    try {
      const response = await sellerApi.getFilledSessions(selectedDate);
      setFilledSessions(response.data.filledSessions);
      // Auto-select first available session
      const filled = response.data.filledSessions;
      if (filled.includes('AM') && !filled.includes('PM')) {
        setSession('PM');
      } else if (!filled.includes('AM')) {
        setSession('AM');
      }
    } catch {
      setFilledSessions([]);
    }
  }, []);

  useEffect(() => {
    loadFilledSessions(date);
  }, [date, loadFilledSessions]);

  // Calculate price when weight changes
  useEffect(() => {
    if (
      weight &&
      settings &&
      settings.baselineWeight !== null &&
      settings.basePrice !== null &&
      settings.kUp !== null &&
      settings.kDown !== null
    ) {
      const price = calculatePrice({
        weight: parseFloat(weight),
        baselineWeight: settings.baselineWeight,
        basePrice: settings.basePrice,
        kUp: settings.kUp,
        kDown: settings.kDown,
      });
      setCalculatedPrice(price);
    } else {
      setCalculatedPrice(null);
    }
  }, [weight, settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (calculatedPrice === null) {
      setError(t('seller.invalidWeight'));
      return;
    }

    setSubmitting(true);
    try {
      await sellerApi.uploadPrice({
        date,
        session,
        price: calculatedPrice,
      });
      setSuccess(t('seller.uploadSuccess'));
      setWeight('');
      setCalculatedPrice(null);
      // Refresh filled sessions after successful upload
      loadFilledSessions(date);
    } catch {
      setError(t('seller.uploadError'));
    } finally {
      setSubmitting(false);
    }
  };

  const allSessionsFilled = filledSessions.includes('AM') && filledSessions.includes('PM');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasValidSettings =
    settings &&
    settings.baselineWeight !== null &&
    settings.basePrice !== null &&
    settings.kUp !== null &&
    settings.kDown !== null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {t('seller.uploadPrice')}
        </Typography>

        {!hasValidSettings && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('seller.configureSettingsFirst')}
          </Alert>
        )}

        {allSessionsFilled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('seller.allSessionsFilled')}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('seller.date')}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>{t('seller.session')}</InputLabel>
            <Select
              value={session}
              onChange={(e) => setSession(e.target.value as 'AM' | 'PM')}
              label={t('seller.session')}
              disabled={allSessionsFilled}
            >
              <MenuItem value="AM" disabled={filledSessions.includes('AM')}>
                <ListItemText
                  primary={t('seller.am')}
                  secondary={filledSessions.includes('AM') ? t('seller.alreadyFilled') : undefined}
                />
              </MenuItem>
              <MenuItem value="PM" disabled={filledSessions.includes('PM')}>
                <ListItemText
                  primary={t('seller.pm')}
                  secondary={filledSessions.includes('PM') ? t('seller.alreadyFilled') : undefined}
                />
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label={t('seller.weight')}
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            margin="normal"
            placeholder={t('seller.enterWeight')}
            disabled={!hasValidSettings}
            InputProps={{
              endAdornment: <InputAdornment position="end">{t('seller.kg')}</InputAdornment>,
            }}
            inputProps={{ step: '0.1' }}
          />

          {calculatedPrice !== null && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="subtitle2">{t('seller.calculatedPrice')}</Typography>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                ${calculatedPrice.toFixed(2)}
              </Typography>
            </Box>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={!hasValidSettings || calculatedPrice === null || submitting || allSessionsFilled}
            sx={{ mt: 3 }}
          >
            {submitting ? <CircularProgress size={24} /> : t('seller.uploadPrice')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeightInput;
