import React from 'react';
import { useQuery, useQueryClient } from 'react-query';
import {
  Badge,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  Typography,
  Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { listNotifications, markNotificationsRead } from '@/services/notificationService';

dayjs.extend(relativeTime);

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery(['notifications'], listNotifications, {
    staleTime: 1000 * 30
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleMarkAllRead = async () => {
    if (!notifications.length) return;
    await markNotificationsRead();
    await queryClient.invalidateQueries(['notifications']);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} size="large">
        <Badge color="error" badgeContent={unreadCount}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { width: 360, maxHeight: 420 } }}
      >
        <Box px={2} py={1} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1">Notifications</Typography>
          <Button size="small" onClick={handleMarkAllRead} disabled={!notifications.length}>
            Mark all read
          </Button>
        </Box>
        <List dense disablePadding>
          {notifications.length === 0 && (
            <ListItem>
              <ListItemText primary="You're all caught up!" />
            </ListItem>
          )}
          {notifications.map((notification: any) => (
            <ListItem key={notification.id || notification._id} alignItems="flex-start" sx={{ opacity: notification.read ? 0.6 : 1 }}>
              <ListItemText
                primary={notification.title}
                secondary={
                  <>
                    <Typography variant="body2" color="text.primary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(notification.createdAt).fromNow()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Menu>
    </>
  );
};

export default NotificationBell;
