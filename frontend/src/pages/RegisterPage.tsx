import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { RegisterForm } from '../components/auth';

const RegisterPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <RegisterForm />
      </Paper>
    </Box>
  );
};

export default RegisterPage;
