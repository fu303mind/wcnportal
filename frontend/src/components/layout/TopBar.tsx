import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  InputBase,
  Paper,
  Avatar,
  Typography,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationBell from '@/components/layout/NotificationBell';
import { useThemeMode } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggle } = useThemeMode();
  const { user, logout } = useAuth();
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('q') || '');
  }, [location.search]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U';

  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
      <Toolbar sx={{ gap: 2 }}>
        <Paper component="form" onSubmit={handleSubmit} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderRadius: 3, flexGrow: 1, maxWidth: 480 }}>
          <SearchIcon color="action" />
          <InputBase
            placeholder="Search users, workflows, documents..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ ml: 1, flex: 1 }}
          />
        </Paper>
        <NotificationBell />
        <Tooltip title="Toggle theme">
          <IconButton color="inherit" onClick={toggle}>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Logout">
          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
        <Box display="flex" alignItems="center" gap={1} ml={1}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>{initials}</Avatar>
          <Box>
            <Typography variant="subtitle2">{user?.firstName} {user?.lastName}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
