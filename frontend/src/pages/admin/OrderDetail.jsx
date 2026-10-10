import { useEffect, useState } from 'react';
import {
  Alert, Button, Divider, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

const statuses = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/order/${id}`)
      .then(({ data }) => {
        setOrder(data.order);
        setStatus(data.order.orderStatus);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load order'));
  }, [id]);

  const updateStatus = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put(`/admin/order/${id}`, { status });
      setOrder(data.order);
      setWarning(data.warning || '');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update order');
    } finally {
      setSaving(false);
    }
  };

  if (error && !order) return <Alert severity="error">{error}</Alert>;
  if (!order) return <Typography>Loading order...</Typography>;

  const locked = ['Completed', 'Cancelled'].includes(order.orderStatus);
  return (
    <Stack spacing={2}>
      <Button onClick={() => navigate('/admin/orders')} sx={{ alignSelf: 'flex-start' }}>Back to orders</Button>
      {error && <Alert severity="error">{error}</Alert>}
      {warning && <Alert severity="warning">{warning}</Alert>}
      <Paper sx={{ p: { xs: 2, md: 4 } }}>
        <Stack spacing={2}>
          <Typography variant="h3">Order #{order._id.slice(-8)}</Typography>
          <Typography variant="h6">Customer</Typography>
          <Typography>{order.user?.name || 'Unknown'} · {order.user?.email || 'No email'}</Typography>
          <Typography>{order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.postalCode}, {order.shippingInfo.country}</Typography>
          <Typography>Phone: {order.shippingInfo.phoneNo}</Typography>
          <Divider />
          <Typography variant="h6">Items</Typography>
          {order.orderItems.map((item) => (
            <Stack key={item.product} direction="row" justifyContent="space-between">
              <Typography>{item.name} × {item.quantity}</Typography>
              <Typography>${(item.price * item.quantity).toFixed(2)}</Typography>
            </Stack>
          ))}
          <Divider />
          <Typography>Payment method: {order.paymentInfo?.method}</Typography>
          <Typography>Total: ${Number(order.totalPrice).toFixed(2)}</Typography>
          <FormControl disabled={locked} sx={{ maxWidth: 260 }}>
            <InputLabel id="admin-order-status">Status</InputLabel>
            <Select labelId="admin-order-status" label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
              {statuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </Select>
          </FormControl>
          <Button disabled={locked || saving || status === order.orderStatus} onClick={updateStatus} variant="contained">
            {saving ? 'Updating...' : 'Update status'}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
