import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Link as RouterLink } from 'react-router-dom';
import api from '../../api/axios';

export default function Products() {
  const [rows, setRows] = useState([]);
  const [selection, setSelection] = useState({ type: 'include', ids: new Set() });
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/admin/products');
      setRows((data.products || []).map((product) => ({ ...product, id: product._id })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load products');
    }
  };

  useEffect(() => {
    // The async loader updates state after the request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => [
      row.album_title,
      row.artist?.name,
      row.genre?.name,
      row.merch_type,
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [rows, search]);

  const deleteSelected = async () => {
    const selectedIds = Array.from(selection.ids);
    try {
      await api.delete('/admin/products/bulk', { data: { ids: selectedIds } });
      setRows((current) => current.filter((row) => !selectedIds.includes(row._id)));
      setSelection({ type: 'include', ids: new Set() });
      setConfirmOpen(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete selected products');
    }
  };

  const deleteOne = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/admin/product/${id}`);
      setRows((current) => current.filter((row) => row._id !== id));
      setSelection((current) => {
        const ids = new Set(current.ids);
        ids.delete(id);
        return { ...current, ids };
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete product');
    }
  };

  const columns = [
    {
      field: 'image',
      headerName: 'Image',
      width: 90,
      sortable: false,
      renderCell: ({ row }) => <Avatar variant="rounded" src={row.images?.[0]?.url} alt={row.album_title} />,
    },
    { field: 'album_title', headerName: 'Album title', flex: 1.2, minWidth: 180 },
    { field: 'artist', headerName: 'Artist', flex: 1, minWidth: 130, valueGetter: (_, row) => row.artist?.name || '' },
    { field: 'genre', headerName: 'Genre', flex: 1, minWidth: 120, valueGetter: (_, row) => row.genre?.name || '' },
    { field: 'merch_type', headerName: 'Merchandise', width: 130 },
    { field: 'price', headerName: 'Price', width: 100, valueFormatter: (value) => Number(value).toFixed(2) },
    { field: 'stocks', headerName: 'Stocks', width: 90 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 170,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" component={RouterLink} to={`/admin/products/${row._id}/edit`}>Edit</Button>
          <Button size="small" color="error" onClick={() => deleteOne(row._id)}>Delete</Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Stack alignItems={{ xs: 'stretch', sm: 'center' }} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h3">Products</Typography>
        <Button component={RouterLink} to="/admin/products/new" variant="contained">Add product</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="Quick search" size="small" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Button color="error" disabled={!selection.ids.size} variant="outlined" onClick={() => setConfirmOpen(true)}>
          Delete selected ({selection.ids.size})
        </Button>
      </Stack>
      <Box sx={{ height: 650, width: '100%' }}>
        <DataGrid
          checkboxSelection
          rows={filteredRows}
          columns={columns}
          rowSelectionModel={selection}
          onRowSelectionModelChange={setSelection}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete {selection.ids.size} selected product(s)? This cannot be undone.</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteSelected}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
