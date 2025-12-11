import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { buyerApi, SellerWithPrice } from '../api/client';
import { SellerList, RechargeDialog, TradeDialog, TradeHistory } from '../components/buyer';
import { PriceChart, AccountValueGraph } from '../components/charts';
import { HoldingsCard } from '../components/dashboard';

const BuyerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerWithPrice | null>(null);
  const [chartSeller, setChartSeller] = useState<{ id: number; name: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load balance on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const balanceRes = await buyerApi.getBalance();
        setBalance(balanceRes.data.balance);
      } catch {
        // Ignore error
      }
    };
    loadData();
  }, [refreshKey]);

  const handleSelectSeller = (seller: SellerWithPrice) => {
    setSelectedSeller(seller);
    setTradeOpen(true);
  };

  const handleViewChart = (sellerId: number, sellerName: string) => {
    setChartSeller({ id: sellerId, name: sellerName });
    setChartOpen(true);
  };

  const handleRechargeSuccess = (newBalance: number) => {
    setBalance(newBalance);
  };

  const handleTradeSuccess = (newBalance: number) => {
    setBalance(newBalance);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('buyer.dashboard')}
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        {t('common.welcomeBack', { username: user?.username })}
      </Typography>

      {/* Balance Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WalletIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                      {t('buyer.balance')}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 600 }}>
                      ${balance.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setRechargeOpen(true)}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                  }}
                >
                  {t('buyer.recharge')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Value Graph */}
        <Grid item xs={12}>
          <AccountValueGraph userRole="buyer" />
        </Grid>

        {/* Holdings Card with P&L */}
        <Grid item xs={12}>
          <HoldingsCard onViewChart={handleViewChart} refreshTrigger={refreshKey} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Seller List */}
        <Grid item xs={12} md={6}>
          <SellerList onSelectSeller={handleSelectSeller} onViewChart={handleViewChart} />
        </Grid>

        {/* Trade History */}
        <Grid item xs={12} md={6}>
          <TradeHistory refreshTrigger={refreshKey} />
        </Grid>
      </Grid>

      {/* Recharge Dialog */}
      <RechargeDialog
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        onSuccess={handleRechargeSuccess}
      />

      {/* Trade Dialog */}
      <TradeDialog
        open={tradeOpen}
        onClose={() => {
          setTradeOpen(false);
          setSelectedSeller(null);
        }}
        seller={selectedSeller}
        balance={balance}
        onSuccess={handleTradeSuccess}
      />

      {/* Chart Dialog */}
      <Dialog
        open={chartOpen}
        onClose={() => {
          setChartOpen(false);
          setChartSeller(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{chartSeller?.name}</Typography>
            <IconButton
              onClick={() => {
                setChartOpen(false);
                setChartSeller(null);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {chartSeller && <PriceChart sellerId={chartSeller.id} sellerName={chartSeller.name} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default BuyerDashboard;
