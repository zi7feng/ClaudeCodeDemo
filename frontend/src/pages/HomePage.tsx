import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <TrendingUpIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: t('home.trackWeight'),
      description: t('home.trackWeightDesc'),
    },
    {
      icon: <ShowChartIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: t('home.viewCharts'),
      description: t('home.viewChartsDesc'),
    },
    {
      icon: <AccountBalanceIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: t('home.tradeInvest'),
      description: t('home.tradeInvestDesc'),
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: 'center',
          py: { xs: 6, md: 10 },
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: { xs: '2rem', md: '3rem' },
          }}
        >
          {t('common.appName')}
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{
            mb: 4,
            maxWidth: 600,
            mx: 'auto',
            fontSize: { xs: '1rem', md: '1.25rem' },
          }}
        >
          {t('home.tagline')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <Button variant="contained" size="large" onClick={() => navigate('/dashboard')}>
              {t('nav.dashboard')}
            </Button>
          ) : (
            <>
              <Button variant="contained" size="large" onClick={() => navigate('/register')}>
                {t('home.getStarted')}
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/login')}>
                {t('auth.login')}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Features Section */}
      <Grid container spacing={4} sx={{ py: 6 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                textAlign: 'center',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ py: 4 }}>
                {feature.icon}
                <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">{feature.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage;
