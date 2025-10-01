import React from 'react';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery, useQueryClient } from 'react-query';
import { listUsers, updateUserRole } from '@/services/userService';

const roles = ['admin', 'manager', 'staff', 'client'];

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [role, setRole] = React.useState('');
  const [search, setSearch] = React.useState('');

  const { data, isLoading } = useQuery(['admin-users', page, pageSize, role, search], () =>
    listUsers({ page: page + 1, limit: pageSize, role: role || undefined, search: search || undefined })
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateUserRole(userId, newRole);
    await queryClient.invalidateQueries(['admin-users']);
  };

  const columns = React.useMemo<GridColDef[]>(() => [
    { field: 'firstName', headerName: 'First name', flex: 1 },
    { field: 'lastName', headerName: 'Last name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1.5 },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1,
      renderCell: (params) => (
        <TextField
          select
          size="small"
          value={params.value}
          onChange={(event) => handleRoleChange(params.row.id, event.target.value)}
        >
          {roles.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      )
    },
    { field: 'status', headerName: 'Status', width: 140 }
  ], []);

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="h4" fontWeight={700}>User Management</Typography>

      <Paper sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Role"
          select
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          {roles.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 240 }}
        />
      </Paper>

      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={(data?.items || []).map((user: any) => ({ id: user._id, ...user }))}
          columns={columns}
          pagination
          paginationMode="server"
          rowCount={data?.total || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50]}
          loading={isLoading}
          sx={{ backgroundColor: 'background.paper', borderRadius: 3 }}
        />
      </Box>
    </Box>
  );
};

export default AdminUsers;
