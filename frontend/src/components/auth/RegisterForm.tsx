import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const RegisterForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'buyer' as 'buyer' | 'seller',
    baselineWeight: '',
    basePrice: '',
    kUp: '',
    kDown: '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleRoleChange = (e: { target: { value: string } }) => {
    setFormData((prev) => ({
      ...prev,
      role: e.target.value as 'buyer' | 'seller',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    // Validation
    if (!formData.username.trim()) {
      setLocalError(t('auth.usernameRequired'));
      return;
    }
    if (!formData.password) {
      setLocalError(t('auth.passwordRequired'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError(t('auth.passwordMismatch'));
      return;
    }

    try {
      const registerData: {
        username: string;
        password: string;
        role: 'buyer' | 'seller';
        baselineWeight?: number;
        basePrice?: number;
        kUp?: number;
        kDown?: number;
      } = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
      };

      // Add seller-specific fields
      if (formData.role === 'seller') {
        if (formData.baselineWeight) {
          registerData.baselineWeight = parseFloat(formData.baselineWeight);
        }
        if (formData.basePrice) {
          registerData.basePrice = parseFloat(formData.basePrice);
        }
        if (formData.kUp) {
          registerData.kUp = parseFloat(formData.kUp);
        }
        if (formData.kDown) {
          registerData.kDown = parseFloat(formData.kDown);
        }
      }

      await register(registerData);
      navigate('/dashboard');
    } catch {
      // Error is handled by AuthContext
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
        p: 4,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        {t('auth.registerTitle')}
      </Typography>

      {(error || localError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {localError || error}
        </Alert>
      )}

      <TextField
        fullWidth
        label={t('auth.username')}
        value={formData.username}
        onChange={handleChange('username')}
        margin="normal"
        autoComplete="username"
        autoFocus
        disabled={loading}
      />

      <TextField
        fullWidth
        label={t('auth.password')}
        type="password"
        value={formData.password}
        onChange={handleChange('password')}
        margin="normal"
        autoComplete="new-password"
        disabled={loading}
      />

      <TextField
        fullWidth
        label={t('auth.confirmPassword')}
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange('confirmPassword')}
        margin="normal"
        autoComplete="new-password"
        disabled={loading}
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>{t('auth.role')}</InputLabel>
        <Select value={formData.role} onChange={handleRoleChange} label={t('auth.role')}>
          <MenuItem value="buyer">{t('auth.buyer')}</MenuItem>
          <MenuItem value="seller">{t('auth.seller')}</MenuItem>
        </Select>
      </FormControl>

      <Collapse in={formData.role === 'seller'}>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {t('seller.settings')}
          </Typography>
          <TextField
            fullWidth
            label={t('seller.baselineWeight')}
            type="number"
            value={formData.baselineWeight}
            onChange={handleChange('baselineWeight')}
            margin="dense"
            size="small"
            inputProps={{ step: '0.1' }}
          />
          <TextField
            fullWidth
            label={t('seller.basePrice')}
            type="number"
            value={formData.basePrice}
            onChange={handleChange('basePrice')}
            margin="dense"
            size="small"
            inputProps={{ step: '0.01' }}
          />
          <TextField
            fullWidth
            label={t('seller.kUp')}
            type="number"
            value={formData.kUp}
            onChange={handleChange('kUp')}
            margin="dense"
            size="small"
            inputProps={{ step: '0.01' }}
          />
          <TextField
            fullWidth
            label={t('seller.kDown')}
            type="number"
            value={formData.kDown}
            onChange={handleChange('kDown')}
            margin="dense"
            size="small"
            inputProps={{ step: '0.01' }}
          />
        </Box>
      </Collapse>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        sx={{ mt: 3, mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : t('auth.register')}
      </Button>

      <Typography align="center" color="text.secondary">
        {t('auth.hasAccount')}{' '}
        <Link component={RouterLink} to="/login">
          {t('auth.login')}
        </Link>
      </Typography>
    </Box>
  );
};

export default RegisterForm;
