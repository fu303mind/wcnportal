import React from 'react';
import { Box, Button, Paper, Typography, Chip, Grid } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { listNotifications, markNotificationsRead } from '@/services/notificationService';

dayjs.extend(relativeTime);

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: notifications = [], isFetching } = useQuery(['notifications'], listNotifications, {
    staleTime: 1000 * 30
  });

  const handleMarkAllRead = async () => {
    await markNotificationsRead();
    await queryClient.invalidateQueries(['notifications']);
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700}>Notifications</Typography>
          <Typography variant="body2" color="text.secondary">Review system alerts and workflow updates.</Typography>
        </Box>
        <Button variant="outlined" onClick={handleMarkAllRead} disabled={!notifications.some((n: any) => !n.read) || isFetching}>
          Mark all as read
        </Button>
      </Box>

      <Grid container spacing={2}>
        {notifications.map((notification: any) => (
          <Grid item xs={12} md={6} key={notification._id || notification.id}>
            <Paper sx={{ p: 2.5, borderLeft: (theme) => `4px solid ${theme.palette.primary.main}` }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={600}>{notification.title}</Typography>
                <Chip size="small" label={notification.type} color={notification.type === 'error' ? 'error' : notification.type === 'warning' ? 'warning' : notification.type === 'success' ? 'success' : 'default'} />
              </Box>
              <Typography variant="body2">{notification.message}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                {dayjs(notification.createdAt).fromNow()}
              </Typography>
            </Paper>
          </Grid>
        ))}
        {!notifications.length && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No notifications yet.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default NotificationsPage;
