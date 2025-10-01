import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery, useQueryClient } from 'react-query';
import { listClients, createClient, updateClient } from '@/services/clientService';

const AdminClients: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: clients = [], isLoading } = useQuery(['clients'], listClients);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', industry: '', status: 'active', primaryContactEmail: '' });

  const columns = React.useMemo<GridColDef[]>(() => [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'industry', headerName: 'Industry', flex: 1 },
    { field: 'primaryContactEmail', headerName: 'Primary Contact', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      renderCell: (params) => (
        <TextField
          select
          size="small"
          value={params.value}
          onChange={async (event) => {
            await updateClient(params.row.id, { status: event.target.value });
            await queryClient.invalidateQueries(['clients']);
          }}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="onboarding">Onboarding</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    }
  ], [queryClient]);

  const handleSubmit = async () => {
    await createClient(form);
    setOpen(false);
    setForm({ name: '', industry: '', status: 'active', primaryContactEmail: '' });
    await queryClient.invalidateQueries(['clients']);
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={700}>Clients</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Add client</Button>
      </Box>

      <Paper sx={{ height: 520 }}>
        <DataGrid
          rows={clients.map((client: any) => ({ id: client._id, ...client }))}
          columns={columns}
          loading={isLoading}
          autoHeight={false}
          pageSizeOptions={[10, 20, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{ backgroundColor: 'background.paper', borderRadius: 3 }}
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New client</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}>
              <TextField
                label="Organization name"
                fullWidth
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Industry"
                fullWidth
                value={form.industry}
                onChange={(event) => setForm((prev) => ({ ...prev, industry: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Status"
                select
                fullWidth
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="onboarding">Onboarding</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Primary contact email"
                fullWidth
                value={form.primaryContactEmail}
                onChange={(event) => setForm((prev) => ({ ...prev, primaryContactEmail: event.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!form.name.trim()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminClients;
