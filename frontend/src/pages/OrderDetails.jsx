import { useEffect, useState } from 'react';
import { Alert, Divider, Paper, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get(`/order/${id}`).then(({ data }) => setOrder(data.order)).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load order')); }, [id]);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!order) return <Typography>Loading order...</Typography>;
  return <Stack spacing={2}><Typography variant="h2">Order details</Typography><Paper sx={{ p: 3 }}><Stack spacing={1}><Typography>Status: {order.orderStatus}</Typography><Typography>Payment: {order.paymentInfo?.method}</Typography><Typography>Ship to: {order.shippingInfo.address}, {order.shippingInfo.city}</Typography><Divider sx={{ my: 1 }} />{order.orderItems.map((item) => <Stack key={item.product} direction="row" justifyContent="space-between"><Typography>{item.name} × {item.quantity}</Typography><Typography>${(item.price * item.quantity).toFixed(2)}</Typography></Stack>)}<Divider sx={{ my: 1 }} /><Typography>Items: ${order.itemsPrice.toFixed(2)}</Typography><Typography>Tax: ${order.taxPrice.toFixed(2)}</Typography><Typography variant="h5">Total: ${order.totalPrice.toFixed(2)}</Typography></Stack></Paper></Stack>;
}
