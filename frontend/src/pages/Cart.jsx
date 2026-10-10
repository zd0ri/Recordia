import {
  Box, Button, Divider, IconButton, MenuItem, Paper, Select, Stack, Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, itemsPrice, changeQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const tax = Number((itemsPrice * 0.12).toFixed(2));

  if (!items.length) {
    return (
      <Paper sx={{ p: 5, textAlign: 'center' }}>
        <Typography gutterBottom variant="h3">Your cart is empty</Typography>
        <Button component={RouterLink} to="/" variant="contained">Browse collection</Button>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h2">Your cart</Typography>
      <Paper sx={{ p: { xs: 2, md: 4 } }}>
        {items.map((item) => (
          <Stack key={item.product} alignItems="center" direction="row" spacing={2} sx={{ py: 2 }}>
            <Box component="img" src={item.image || 'https://placehold.co/100x100?text=Recordia'} alt={item.name} sx={{ height: 72, objectFit: 'cover', width: 72 }} />
            <Box sx={{ flex: 1 }}><Typography fontWeight={700}>{item.name}</Typography><Typography color="text.secondary">${Number(item.price).toFixed(2)}</Typography></Box>
            <Select size="small" value={item.quantity} onChange={(event) => changeQuantity(item.product, event.target.value)}>
              {Array.from({ length: item.stocks }, (_, index) => <MenuItem key={index + 1} value={index + 1}>{index + 1}</MenuItem>)}
            </Select>
            <Typography>${(item.price * item.quantity).toFixed(2)}</Typography>
            <IconButton aria-label={`Remove ${item.name}`} onClick={() => removeFromCart(item.product)}><DeleteOutlineIcon /></IconButton>
          </Stack>
        ))}
        <Divider />
        <Stack alignItems="flex-end" spacing={1} sx={{ mt: 3 }}>
          <Typography>Items: ${itemsPrice.toFixed(2)}</Typography>
          <Typography>Tax: ${tax.toFixed(2)}</Typography>
          <Typography variant="h5">Total: ${(itemsPrice + tax).toFixed(2)}</Typography>
          <Button variant="contained" onClick={() => navigate('/checkout')}>Proceed to checkout</Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
