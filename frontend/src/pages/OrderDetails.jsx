import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get(`/order/${id}`).then(({ data }) => setOrder(data.order)).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load order')); }, [id]);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!order) return <Typography>Loading order...</Typography>;
  return (
    <Stack className="account-page order-detail-page" spacing={2.5}>
      <Box className="account-page-heading">
        <Box>
          <Typography className="account-eyebrow">RECORDIA / ORDER SLIP</Typography>
          <Typography className="account-page-title" variant="h2">Order details</Typography>
          <Typography className="account-page-subtitle">
            Order #{order._id.slice(-8)} · Placed {new Date(order.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <Box className="account-record-mark" aria-hidden="true"><span /></Box>
      </Box>
      <Paper className="account-panel order-detail-panel">
        <Stack spacing={2.5}>
          <Stack className="order-detail-status" alignItems="center" direction="row" flexWrap="wrap" gap={1.5} justifyContent="space-between">
            <Box>
              <Typography className="account-panel-kicker">CURRENT STATUS</Typography>
              <Chip className={`account-status-chip status-${order.orderStatus?.toLowerCase()}`} label={order.orderStatus} />
            </Box>
            <Box className="order-payment-note">
              <Typography className="account-panel-kicker">PAYMENT METHOD</Typography>
              <Typography>{order.paymentInfo?.method || '—'}</Typography>
            </Box>
          </Stack>
          <Box className="order-shipping-note">
            <Typography className="account-panel-kicker">DELIVER TO</Typography>
            <Typography>{order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.postalCode}, {order.shippingInfo.country}</Typography>
          </Box>
          <Box className="order-items-list">
            <Typography className="account-panel-kicker">IN THE CRATE / {order.orderItems.length} {order.orderItems.length === 1 ? 'ITEM' : 'ITEMS'}</Typography>
            {order.orderItems.map((item) => (
              <Stack className="order-detail-item" key={item.product} alignItems="center" direction="row" justifyContent="space-between">
                <Box>
                  <Typography>{item.name}</Typography>
                  <Typography color="text.secondary" variant="body2">{item.quantity} × ₱{Number(item.price).toFixed(2)}</Typography>
                </Box>
                <Typography>₱{(item.price * item.quantity).toFixed(2)}</Typography>
              </Stack>
            ))}
          </Box>
          <Box className="order-detail-totals">
            <Typography><span>Items</span><strong>₱{Number(order.itemsPrice).toFixed(2)}</strong></Typography>
            <Typography><span>Tax</span><strong>₱{Number(order.taxPrice).toFixed(2)}</strong></Typography>
            <Typography><span>Shipping</span><strong>₱{Number(order.shippingPrice || 0).toFixed(2)}</strong></Typography>
            <Divider />
            <Typography className="order-grand-total"><span>Total</span><strong>₱{Number(order.totalPrice).toFixed(2)}</strong></Typography>
          </Box>
          {order.orderStatus === 'Completed' && (
            <Box className="order-review-section">
              <Typography className="account-panel-kicker">PASS IT ON / LEAVE A REVIEW</Typography>
              <Typography className="order-review-heading" variant="h5">How did it sound?</Typography>
              <Stack spacing={1}>
                {order.orderItems.map((item) => (
                  <Button
                    className="account-outline-button"
                    key={item.product}
                    component={RouterLink}
                    to={`/products/${item.product}?review=1&orderId=${order._id}`}
                    variant="outlined"
                  >
                    Review {item.name}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
