import { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogTitle, Stack, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../api/axios';

export default function Reviews() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const loadReviews = async () => {
    try {
      const { data } = await api.get('/admin/reviews');
      setRows((data.reviews || []).map((review) => ({ ...review, id: review._id })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load reviews');
    }
  };

  useEffect(() => {
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
