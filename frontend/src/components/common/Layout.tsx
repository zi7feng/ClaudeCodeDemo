import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Container,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [langAnchorEl, setLangAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLangAnchorEl(null);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    handleLanguageClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              {t('common.appName')}
            </Typography>

            {user && (
              <>
                <Button
                  color="inherit"
                  startIcon={!isMobile && <DashboardIcon />}
                  onClick={() => navigate('/dashboard')}
                  sx={{ mr: 1 }}
                >
                  {!isMobile && t('nav.dashboard')}
                  {isMobile && <DashboardIcon />}
                </Button>
                <Typography
                  variant="body2"
                  sx={{
                    mr: 2,
                    fontWeight: 500,
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  {t('common.welcomeBack', { username: user.username })}
                </Typography>
              </>
            )}

            <IconButton color="inherit" onClick={handleLanguageClick}>
              <LanguageIcon />
            </IconButton>
            <Menu
              anchorEl={langAnchorEl}
              open={Boolean(langAnchorEl)}
              onClose={handleLanguageClose}
            >
              <MenuItem onClick={() => changeLanguage('en')}>{t('common.english')}</MenuItem>
              <MenuItem onClick={() => changeLanguage('zh')}>{t('common.chinese')}</MenuItem>
            </Menu>

            {user ? (
              <Button
                color="inherit"
                startIcon={!isMobile && <LogoutIcon />}
                onClick={handleLogout}
              >
                {!isMobile && t('auth.logout')}
                {isMobile && <LogoutIcon />}
              </Button>
            ) : (
              <Button color="inherit" onClick={() => navigate('/login')}>
                {t('auth.login')}
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
