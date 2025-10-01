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
  MenuItem,
  TextField,
  Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { listWorkflows, createWorkflow } from '@/services/workflowService';
import { listClients } from '@/services/clientService';
import { useAuth } from '@/contexts/AuthContext';

const createWorkflowSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  clientAccount: z.string().min(1, 'Select a client')
});

type CreateWorkflowForm = z.infer<typeof createWorkflowSchema>;

const Workflows: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManageClients = user?.role === 'admin' || user?.role === 'manager';
  const canCreateWorkflow = canManageClients;

  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [status, setStatus] = React.useState<string>('');
  const [search, setSearch] = React.useState('');
  const [openDialog, setOpenDialog] = React.useState(false);

  const form = useForm<CreateWorkflowForm>({ resolver: zodResolver(createWorkflowSchema) });

  const { data: clients = [] } = useQuery(['clients'], listClients, {
    staleTime: 1000 * 60 * 5,
    enabled: canManageClients
  });

  const { data, isLoading } = useQuery(['workflows', page, pageSize, status, search], () =>
    listWorkflows({ page: page + 1, limit: pageSize, status: status || undefined, search: search || undefined })
  );

  const columns = React.useMemo<GridColDef[]>(() => [
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
    {
      field: 'clientAccount',
      headerName: 'Client',
      flex: 1,
      valueGetter: (params) => params.row.clientAccount?.name || '—'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => <Chip label={params.value} color={params.value === 'completed' ? 'success' : params.value === 'in_progress' ? 'warning' : 'default'} size="small" />
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 130,
      valueFormatter: (params) => `${params.value || 0}%`
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString()
    }
  ], []);

  const handleCreateWorkflow = async (values: CreateWorkflowForm) => {
    await createWorkflow(values);
    setOpenDialog(false);
    form.reset();
    await queryClient.invalidateQueries(['workflows']);
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Workflows
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track progress across client engagements and collaborative tasks.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => setOpenDialog(true)} disabled={!canCreateWorkflow}>
          New Workflow
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4} md={3}>
          <TextField
            fullWidth
            label="Status"
            select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={8} md={5}>
          <TextField
            fullWidth
            label="Search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
          />
        </Grid>
      </Grid>

      <Box sx={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={(data?.items || []).map((item: any) => ({ id: item._id, ...item }))}
          columns={columns}
          pagination
          paginationMode="server"
          rowCount={data?.total || 0}
          pageSizeOptions={[10, 20, 50]}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={isLoading}
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/workflows/${params.id}`)}
          sx={{ borderRadius: 3, backgroundColor: 'background.paper' }}
        />
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create workflow</DialogTitle>
        <DialogContent>
          <Box component="form" display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Title"
              fullWidth
              {...form.register('title')}
              error={!!form.formState.errors.title}
              helperText={form.formState.errors.title?.message}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              {...form.register('description')}
            />
            <TextField
              label="Client"
              select
              fullWidth
              {...form.register('clientAccount')}
              error={!!form.formState.errors.clientAccount}
              helperText={form.formState.errors.clientAccount?.message}
            >
              {(clients as any[]).map((client: any) => (
                <MenuItem key={client._id} value={client._id}>
                  {client.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={form.handleSubmit(handleCreateWorkflow)} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Workflows;
