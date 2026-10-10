import { useEffect, useState } from 'react';
import { Chip, Link, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api/axios';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/orders/me').then(({ data }) => setOrders(data.orders || [])).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load orders'));
  }, []);
  return <Stack spacing={2}><Typography variant="h2">My orders</Typography>{error && <Typography color="error">{error}</Typography>}{!orders.length && !error && <Typography>No orders yet.</Typography>}{orders.map((order) => <Paper key={order._id} sx={{ p: 2 }}><Stack alignItems="center" direction="row" justifyContent="space-between"><Link component={RouterLink} to={`/orders/${order._id}`}>Order #{order._id.slice(-8)}</Link><Chip label={order.orderStatus} color={order.orderStatus === 'Completed' ? 'success' : 'default'} /><Typography>{order.paymentInfo?.method}</Typography><Typography>${Number(order.totalPrice).toFixed(2)}</Typography></Stack></Paper>)}</Stack>;
}
