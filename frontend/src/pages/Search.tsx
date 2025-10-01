import React from 'react';
import {
  Box,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { searchAll } from '@/services/searchService';

const SearchPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState(params.get('q') || '');

  const { data } = useQuery(['search', params.get('q')], () => searchAll(params.get('q') || ''), {
    enabled: Boolean(params.get('q'))
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setParams({ q: query });
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="h4" fontWeight={700}>Global Search</Typography>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          placeholder="Search users, workflows, or documents"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Paper>

      {params.get('q') && !data && (
        <Typography variant="body2">Searching for "{params.get('q')}"…</Typography>
      )}

      {data && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Users</Typography>
              <List>
                {data.users.map((user: any) => (
                  <ListItem key={user._id} divider>
                    <ListItemText primary={`${user.firstName} ${user.lastName}`} secondary={user.email} />
                  </ListItem>
                ))}
                {!data.users.length && <Typography variant="body2">No users found.</Typography>}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Workflows</Typography>
              <List>
                {data.workflows.map((workflow: any) => (
                  <ListItem key={workflow._id} disablePadding>
                    <ListItemButton onClick={() => navigate(`/workflows/${workflow._id}`)} divider>
                      <ListItemText primary={workflow.title} secondary={workflow.status} />
                    </ListItemButton>
                  </ListItem>
                ))}
                {!data.workflows.length && <Typography variant="body2">No workflows found.</Typography>}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Documents</Typography>
              <List>
                {data.documents.map((doc: any) => (
                  <ListItem key={doc._id} divider>
                    <ListItemText primary={doc.originalName} secondary={`${(doc.size / 1024).toFixed(1)} KB`} />
                  </ListItem>
                ))}
                {!data.documents.length && <Typography variant="body2">No documents found.</Typography>}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default SearchPage;
