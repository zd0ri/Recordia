import { useEffect, useState } from 'react';
import {
  Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Link as RouterLink } from 'react-router-dom';
import api from '../../api/axios';

const statuses = ['All', 'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

export default function Orders() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('All');
  const [error, setError] = useState('');

  const loadOrders = async (selectedStatus = status) => {
    try {
      const { data } = await api.get('/admin/orders', {
        params: selectedStatus === 'All' ? {} : { status: selectedStatus },
      });
      setRows((data.orders || []).map((order) => ({ ...order, id: order._id })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load orders');
    }
  };

  useEffect(() => {
    loadOrders();
  }, [status]);

  const columns = [
    {
      field: 'orderId',
      headerName: 'Order ID',
      flex: 1,
      minWidth: 180,
      valueGetter: (_, row) => row._id,
      renderCell: ({ row }) => <Button component={RouterLink} to={`/admin/orders/${row._id}`}>{row._id.slice(-8)}</Button>,
    },
    { field: 'customer', headerName: 'Customer', flex: 1.2, minWidth: 180, valueGetter: (_, row) => row.user?.name || row.user?.email || 'Unknown' },
    { field: 'totalPrice', headerName: 'Total', width: 110, valueFormatter: (value) => `$${Number(value).toFixed(2)}` },
    { field: 'payment', headerName: 'Payment', width: 120, valueGetter: (_, row) => row.paymentInfo?.method || '-' },
    { field: 'orderStatus', headerName: 'Status', width: 130 },
    { field: 'createdAt', headerName: 'Date', width: 150, valueFormatter: (value) => new Date(value).toLocaleDateString() },
  ];

  return (
    <Box>
      <Stack alignItems={{ xs: 'stretch', sm: 'center' }} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h3">Orders</Typography>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel id="order-status-filter">Status</InputLabel>
          <Select labelId="order-status-filter" label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        />
      </Box>
    </Box>
  );
}
