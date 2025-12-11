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
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!username.trim()) {
      setLocalError(t('auth.usernameRequired'));
      return;
    }
    if (!password) {
      setLocalError(t('auth.passwordRequired'));
      return;
    }

    try {
      await login(username, password);
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
        {t('auth.loginTitle')}
      </Typography>

      {(error || localError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {localError || error}
        </Alert>
      )}

      <TextField
        fullWidth
        label={t('auth.username')}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        margin="normal"
        autoComplete="username"
        autoFocus
        disabled={loading}
      />

      <TextField
        fullWidth
        label={t('auth.password')}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        autoComplete="current-password"
        disabled={loading}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={loading}
        sx={{ mt: 3, mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : t('auth.login')}
      </Button>

      <Typography align="center" color="text.secondary">
        {t('auth.noAccount')}{' '}
        <Link component={RouterLink} to="/register">
          {t('auth.register')}
        </Link>
      </Typography>
    </Box>
  );
};

export default LoginForm;
