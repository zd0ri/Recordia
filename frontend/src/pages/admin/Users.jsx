import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'user', isActive: true });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadUsers = async (searchTerm = search) => {
    try {
      const { data } = await api.get('/admin/users', {
        params: searchTerm ? { search: searchTerm } : {},
      });
      setRows(data.users.map((item) => ({ ...item, id: item._id })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load users');
    }
  };

  useEffect(() => {
    // The async loader updates state after the request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [search]);

  const openEdit = (row) => {
    setSelectedUser(row);
    setForm({ role: row.role || 'user', isActive: row.isActive !== false });
  };

  const updateField = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: field === 'isActive' ? event.target.checked : event.target.value,
    }));
  };

  const saveUser = async () => {
    try {
      const { data } = await api.put(`/admin/user/${selectedUser._id}`, form);
      setRows((current) => current.map((row) => (
        row.id === data.user._id ? { ...data.user, id: data.user._id } : row
      )));
      setSelectedUser(null);
      setNotice('User updated');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update user');
    }
  };

  const editingSelf = selectedUser?._id === currentUser?._id;

  const toggleUser = async (row) => {
    try {
      const { data } = await api.put(`/admin/user/${row._id}`, {
        name: row.name,
        email: row.email,
        role: row.role,
        isActive: !row.isActive,
      });
      setRows((current) => current.map((item) => (
        item.id === data.user._id ? { ...data.user, id: data.user._id } : item
      )));
      setNotice(data.user.isActive ? 'User activated' : 'User deactivated');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update user');
    }
  };

  const columns = [
    {
      field: 'avatar',
      headerName: 'Avatar',
      width: 85,
      sortable: false,
      renderCell: ({ row }) => <Avatar src={row.avatar?.url} alt={row.name} />,
    },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1.3, minWidth: 220 },
    { field: 'role', headerName: 'Role', width: 110 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      valueGetter: (_, row) => (row.isActive ? 'Active' : 'Inactive'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => openEdit(row)}>Edit</Button>
          <Button
            disabled={row._id === currentUser?._id}
            color={row.isActive ? 'error' : 'success'}
            size="small"
            onClick={() => toggleUser(row)}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Typography gutterBottom variant="h3">User management</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
        />
        <Button variant="contained" onClick={() => loadUsers(search)}>Search</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>
      <Dialog open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl>
              <InputLabel id="user-role-label">Role</InputLabel>
              <Select
                labelId="user-role-label"
                label="Role"
                value={form.role}
                onChange={updateField('role')}
                disabled={editingSelf}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <Stack alignItems="center" direction="row" justifyContent="space-between">
              <Typography>{form.isActive ? 'Active' : 'Inactive'}</Typography>
              <Switch
                checked={form.isActive}
                onChange={updateField('isActive')}
                disabled={editingSelf}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedUser(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveUser}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={3000} message={notice} onClose={() => setNotice('')} />
    </Box>
  );
}
