import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Tabs, Tab, Grid, Card, CardContent } from '@mui/material';
import { AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { WeightInput, SellerSettings, SellerTradeHistory } from '../components/seller';
import { PriceChart, BalanceGraph } from '../components/charts';
import { PnLCard } from '../components/dashboard';
import { sellerApi } from '../api/client';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const SellerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const balanceRes = await sellerApi.getBalance();
        setBalance(balanceRes.data.balance);
      } catch {
        // Ignore error
      }
    };
    loadData();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('seller.dashboard')}
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        {t('common.welcomeBack', { username: user?.username })}
      </Typography>

      {/* Balance and Earnings Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Balance Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WalletIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                    {t('seller.balance')}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 600 }}>
                    ${balance.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Earnings Card */}
        <Grid item xs={12} md={6}>
          <PnLCard userRole="seller" />
        </Grid>

        {/* Balance Graph */}
        <Grid item xs={12}>
          <BalanceGraph userRole="seller" />
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={t('seller.uploadPrice')} />
          <Tab label={t('seller.priceHistory')} />
          <Tab label={t('seller.tradeHistory')} />
          <Tab label={t('seller.settings')} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <WeightInput />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {user && <PriceChart sellerId={user.id} sellerName={user.username} />}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <SellerTradeHistory />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SellerSettings />
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default SellerDashboard;
