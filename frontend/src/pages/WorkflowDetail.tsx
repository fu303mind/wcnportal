import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  getWorkflow,
  updateTaskStatus,
  addTaskComment,
  addTask
} from '@/services/workflowService';
import { useAuth } from '@/contexts/AuthContext';

dayjs.extend(relativeTime);

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' }
];

const WorkflowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [commentTaskId, setCommentTaskId] = React.useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false);
  const [comment, setComment] = React.useState('');
  const [taskForm, setTaskForm] = React.useState({ title: '', description: '' });

  const { data: workflow, isLoading } = useQuery(['workflow', id], () => getWorkflow(id!), {
    enabled: Boolean(id)
  });

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  const handleStatusChange = async (taskId: string, status: string) => {
    if (!id) return;
    await updateTaskStatus(id, taskId, status as any);
    await queryClient.invalidateQueries(['workflow', id]);
  };

  const handleAddComment = async () => {
    if (!id || !commentTaskId || !comment.trim()) return;
    await addTaskComment(id, commentTaskId, comment.trim());
    setComment('');
    setCommentTaskId(null);
    await queryClient.invalidateQueries(['workflow', id]);
  };

  const handleCreateTask = async () => {
    if (!id || !taskForm.title.trim()) return;
    await addTask(id, { title: taskForm.title, description: taskForm.description });
    setTaskForm({ title: '', description: '' });
    setTaskDialogOpen(false);
    await queryClient.invalidateQueries(['workflow', id]);
  };

  if (isLoading || !workflow) {
    return <Typography>Loading workflow…</Typography>;
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {workflow.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {workflow.description || 'No description provided.'}
          </Typography>
        </Box>
        {canEdit && (
          <Button variant="contained" onClick={() => setTaskDialogOpen(true)}>
            Add Task
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tasks
            </Typography>
            <List>
              {workflow.tasks?.map((task: any) => (
                <ListItem key={task._id} alignItems="flex-start" divider>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>{task.title}</Typography>
                          {task.description && <Typography variant="body2" color="text.secondary">{task.description}</Typography>}
                          <Typography variant="caption" color="text.secondary">
                            {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
                          </Typography>
                        </Box>
                        <TextField
                          select
                          size="small"
                          label="Status"
                          value={task.status}
                          onChange={(event) => handleStatusChange(task._id, event.target.value)}
                          disabled={!canEdit}
                          sx={{ minWidth: 160 }}
                        >
                          {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    }
                    secondary={
                      <Box mt={1} display="flex" flexDirection="column" gap={1}>
                        {task.comments?.map((comment: any, index: number) => (
                          <Paper key={index} variant="outlined" sx={{ p: 1.2 }}>
                            <Typography variant="body2">{comment.message}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dayjs(comment.createdAt).fromNow()}
                            </Typography>
                          </Paper>
                        ))}
                        <Box display="flex" gap={1}>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Add a comment"
                            value={commentTaskId === task._id ? comment : ''}
                            onChange={(event) => {
                              setCommentTaskId(task._id);
                              setComment(event.target.value);
                            }}
                          />
                          <Button variant="contained" size="small" onClick={handleAddComment} disabled={commentTaskId !== task._id || !comment.trim()}>
                            Post
                          </Button>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {!workflow.tasks?.length && (
                <ListItem>
                  <ListItemText primary="No tasks yet." />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Workflow Summary
            </Typography>
            <Box display="grid" gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="subtitle1" fontWeight={600}>{workflow.status}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Progress</Typography>
                <Typography variant="subtitle1" fontWeight={600}>{workflow.progress || 0}%</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Owner</Typography>
                <Typography variant="subtitle1" fontWeight={600}>{workflow.owner?.firstName} {workflow.owner?.lastName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Client</Typography>
                <Typography variant="subtitle1" fontWeight={600}>{workflow.clientAccount?.name || '—'}</Typography>
              </Box>
            </Box>
          </Paper>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              History
            </Typography>
            <List>
              {workflow.history?.slice(-10).reverse().map((entry: any, index: number) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={`Version ${entry.version}`}
                    secondary={`${entry.changes} • ${dayjs(entry.updatedAt).fromNow()}`}
                  />
                </ListItem>
              ))}
              {!workflow.history?.length && (
                <ListItem>
                  <ListItemText primary="No history records." />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add task</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Title"
              fullWidth
              value={taskForm.title}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              value={taskForm.description}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained" disabled={!taskForm.title.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowDetail;
