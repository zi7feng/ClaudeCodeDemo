import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SellerDashboard from './SellerDashboard';
import BuyerDashboard from './BuyerDashboard';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'seller') {
    return <SellerDashboard />;
  }

  return <BuyerDashboard />;
};

export default DashboardPage;
