import { Button, Paper, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function OrderSuccess() {
  const { id } = useParams();
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return <Paper sx={{ p: 5, textAlign: 'center' }}><Stack alignItems="center" spacing={2}><Typography variant="h2">Order placed</Typography><Typography>Your order #{id} is pending confirmation.</Typography><Button component={RouterLink} to={`/orders/${id}`} variant="contained">View order</Button><Button component={RouterLink} to="/" >Continue shopping</Button></Stack></Paper>;
}
