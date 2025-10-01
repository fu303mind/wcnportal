import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FolderIcon from '@mui/icons-material/Folder';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  icon: React.ReactElement;
  path: string;
  roles?: string[];
}

const baseNavItems: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Workflows', icon: <AssignmentIcon />, path: '/workflows' },
  { label: 'Documents', icon: <FolderIcon />, path: '/documents' },
  { label: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { label: 'Search', icon: <SearchIcon />, path: '/search' },
  { label: 'Profile', icon: <AccountCircleIcon />, path: '/profile' }
];

const adminNavItems: NavItem[] = [
  { label: 'User Management', icon: <PeopleIcon />, path: '/admin/users', roles: ['admin'] },
  { label: 'Clients', icon: <BusinessIcon />, path: '/admin/clients', roles: ['admin', 'manager'] }
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const items = React.useMemo(() => {
    const allowed = [...baseNavItems];
    adminNavItems.forEach((item) => {
      if (!item.roles || (user && item.roles.includes(user.role))) {
        allowed.push(item);
      }
    });
    return allowed;
  }, [user]);

  return (
    <Box
      component="nav"
      sx={{
        width: 260,
        flexShrink: 0,
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: 'background.paper'
      }}
    >
      <Box px={3} py={4}>
        <Typography variant="h5" fontWeight={700} color="primary.main">
          Secure Portal
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back{user ? `, ${user.firstName}` : ''}
        </Typography>
      </Box>
      <Divider />
      <List>
        {items.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mx: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText'
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
};

export default Sidebar;
