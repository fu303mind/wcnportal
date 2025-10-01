import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper
} from '@mui/material';
import { useQuery } from 'react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { fetchDashboard } from '@/services/dashboardService';

dayjs.extend(relativeTime);

const StatCard: React.FC<{ title: string; value: string | number; accent?: string }> = ({ title, value, accent }) => (
  <Card sx={{ borderTop: `4px solid ${accent || '#1976d2'}` }}>
    <CardContent>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={600} mt={1}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery(['dashboard'], fetchDashboard, { staleTime: 1000 * 60 });

  const stats = data?.stats || {
    totalWorkflows: 0,
    inProgress: 0,
    completed: 0,
    archived: 0,
    unreadNotifications: 0
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="h4" fontWeight={700}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Workflows" value={stats.totalWorkflows} accent="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="In Progress" value={stats.inProgress} accent="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Completed" value={stats.completed} accent="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Unread Alerts" value={stats.unreadNotifications} accent="#d32f2f" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Workflows
            </Typography>
            <List>
              {(data?.recentWorkflows || []).map((workflow: any) => (
                <ListItem key={workflow._id} divider alignItems="flex-start">
                  <ListItemText
                    primary={workflow.title}
                    secondary={
                      <Box display="flex" gap={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Updated {dayjs(workflow.updatedAt).fromNow()}
                        </Typography>
                        <Chip size="small" label={workflow.status} color={workflow.status === 'completed' ? 'success' : workflow.status === 'in_progress' ? 'warning' : 'default'} />
                      </Box>
                    }
                  />
                  <Box minWidth={120} textAlign="center">
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                    <LinearProgress variant="determinate" value={workflow.progress || 0} sx={{ mt: 1, borderRadius: 4 }} />
                  </Box>
                </ListItem>
              ))}
              {!data?.recentWorkflows?.length && !isLoading && (
                <ListItem>
                  <ListItemText primary="No workflows yet." />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity Feed
            </Typography>
            <List>
              {(data?.recentActivity || []).map((activity: any) => (
                <ListItem key={activity._id} divider>
                  <ListItemText
                    primary={activity.action}
                    secondary={`${dayjs(activity.createdAt).fromNow()}${activity.metadata?.taskTitle ? ` • ${activity.metadata.taskTitle}` : ''}`}
                  />
                </ListItem>
              ))}
              {!data?.recentActivity?.length && !isLoading && (
                <ListItem>
                  <ListItemText primary="No recent activity." />
                </ListItem>
              )}
            </List>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Productivity
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {(data?.productivity || []).map((day: any) => (
                <Box key={day.date}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">{day.date}</Typography>
                    <Typography variant="body2">{day.completedTasks} tasks</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min(day.completedTasks * 20, 100)} sx={{ borderRadius: 4 }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
