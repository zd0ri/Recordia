import { Alert, Box, Button, Divider, Paper, Stack, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import api from '../api/axios';

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/order/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load your receipt'));
  }, [id]);

  if (error) return <Paper className="retro-receipt-error"><Typography>{error}</Typography></Paper>;
  if (!order) return <Paper className="retro-receipt-loading"><Typography>Printing your receipt...</Typography></Paper>;

  return (
    <Stack className="retro-receipt-page" spacing={2}>
      <Paper className="retro-receipt">
        {location.state?.emailWarning && <Alert severity="warning">{location.state.emailWarning}</Alert>}
        <Box className="retro-receipt-header">
          <Box className="retro-receipt-mark"><CheckCircleOutlinedIcon /></Box>
          <Typography className="eyebrow">RECORDIA / SALES SLIP</Typography>
          <Typography variant="h1">Order placed</Typography>
          <Typography className="retro-receipt-message">Your records are reserved and waiting to be packed.</Typography>
          <Box className="retro-receipt-stamp">PAID<br />IN FULL</Box>
        </Box>
        <Box className="retro-receipt-meta">
          <span>ORDER #{id.slice(-10).toUpperCase()}</span>
          <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'DATE PENDING'}</span>
          <span>{order.paymentInfo?.method || 'COD'}</span>
        </Box>
        <Box className="retro-receipt-body">
          <Typography className="retro-receipt-section-label">PURCHASED RECORDS</Typography>
          <Stack className="retro-receipt-items" spacing={1}>
            {order.orderItems.map((item) => (
              <Box className="retro-receipt-item" key={item.product}>
                <Box><Typography>{item.name}</Typography><small>{item.quantity} × ₱{Number(item.price).toFixed(2)}</small></Box>
                <strong>₱{(item.price * item.quantity).toFixed(2)}</strong>
              </Box>
            ))}
          </Stack>
          <Divider />
          <Stack className="retro-receipt-totals" spacing={.8}>
            <Typography><span>Items</span><strong>₱{Number(order.itemsPrice).toFixed(2)}</strong></Typography>
            <Typography><span>Tax</span><strong>₱{Number(order.taxPrice).toFixed(2)}</strong></Typography>
            <Typography className="grand-total"><span>Total paid</span><strong>₱{Number(order.totalPrice).toFixed(2)}</strong></Typography>
          </Stack>
          <Box className="retro-receipt-delivery">
            <LocalShippingOutlinedIcon />
            <Box><Typography>Shipping to</Typography><small>{order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.country}</small></Box>
          </Box>
        </Box>
        <Box className="retro-receipt-footer">THANK YOU FOR KEEPING THE MUSIC SPINNING / RECORDIA</Box>
      </Paper>
      <Stack className="retro-receipt-actions" alignItems="center" direction="row" justifyContent="center" spacing={1.5}>
        <Button component={RouterLink} to={`/orders/${id}`} variant="contained">View order</Button>
        <Button component={RouterLink} to="/">Continue shopping</Button>
      </Stack>
    </Stack>
  );
}
