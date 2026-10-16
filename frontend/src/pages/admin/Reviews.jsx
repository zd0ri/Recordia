import { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogTitle, MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../api/axios';

export default function Reviews() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', minRating: '', maxRating: '' });

  const loadReviews = async (nextFilters = filters) => {
    try {
      const { data } = await api.get('/admin/reviews', { params: nextFilters });
      setRows((data.reviews || []).map((review) => ({ ...review, id: review._id })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load reviews');
    }
  };

  useEffect(() => {
    // The async loader updates state after the request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReviews();
  }, []);

  const deleteReview = async () => {
    try {
      await api.delete('/reviews', { params: { productId: selected.product._id, id: selected._id } });
      setRows((current) => current.filter((row) => row._id !== selected._id));
      setSelected(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete review');
      setSelected(null);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h3">Reviews</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          size="small"
          label="Search review, product, or user"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        <Select
          size="small"
          displayEmpty
          value={filters.minRating}
          onChange={(event) => setFilters((current) => ({ ...current, minRating: event.target.value }))}
        >
          <MenuItem value="">Any rating</MenuItem>
          {[1, 2, 3, 4, 5].map((rating) => <MenuItem key={rating} value={rating}>{rating}+ stars</MenuItem>)}
        </Select>
        <Button variant="contained" onClick={() => loadReviews()}>Filter</Button>
      </Stack>
      <Box sx={{ height: 620, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={[
            { field: 'product', headerName: 'Product', flex: 1.2, minWidth: 180, valueGetter: (_, row) => row.product?.album_title || '-' },
            { field: 'user', headerName: 'User', flex: 1, minWidth: 180, valueGetter: (_, row) => row.user?.email || row.name || '-' },
            { field: 'rating', headerName: 'Rating', width: 90 },
            { field: 'comment', headerName: 'Comment', flex: 2, minWidth: 260 },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 110,
              sortable: false,
              renderCell: ({ row }) => <Button color="error" size="small" onClick={() => setSelected(row)}>Delete</Button>,
            },
          ]}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        />
      </Box>
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)}>
        <DialogTitle>Delete this review?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteReview}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
