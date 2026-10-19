import {
  Box, Button, Divider, IconButton, MenuItem, Paper, Select, Stack, Typography,
  Checkbox,
} from '@mui/material';
import { useState } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, changeQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState(() => items.map((item) => item.product));

  const activeSelectedIds = selectedIds.filter((id) => items.some((item) => item.product === id));
  const selectedItems = items.filter((item) => activeSelectedIds.includes(item.product));
  const selectedPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Number((selectedPrice * 0.12).toFixed(2));
  const allSelected = items.length > 0 && activeSelectedIds.length === items.length;

  const toggleSelected = (productId) => {
    setSelectedIds((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  };

  const toggleAll = () => setSelectedIds(allSelected ? [] : items.map((item) => item.product));

  if (!items.length) {
    return (
      <Paper className="retro-empty-state" sx={{ p: 5, textAlign: 'center' }}>
        <ShoppingBagOutlinedIcon className="retro-empty-icon" />
        <Typography gutterBottom variant="h3">Your cart is empty</Typography>
        <Button component={RouterLink} to="/" variant="contained">Browse collection</Button>
      </Paper>
    );
  }

  return (
    <Stack className="retro-cart-page" spacing={3}>
      <Box className="retro-cart-heading">
        <Box><Typography className="eyebrow">THE RECORDIA HOLDING BIN</Typography><Typography variant="h2">Your cart</Typography></Box>
        <Box className="retro-item-pill">{items.length} {items.length === 1 ? 'record' : 'records'}</Box>
      </Box>
      <Box className="retro-cart-layout">
        <Box>
          <Paper className="retro-cart-panel" sx={{ p: { xs: 1.5, md: 2 } }}>
            <Box className="retro-cart-table-heading"><Box><Checkbox checked={allSelected} indeterminate={activeSelectedIds.length > 0 && !allSelected} onChange={toggleAll} inputProps={{ 'aria-label': 'Select all records' }} /> <span>Record</span></Box><span>Price</span><span>Qty</span><span>Subtotal</span><span /></Box>
            {items.map((item) => (
              <Box className={`retro-cart-item ${activeSelectedIds.includes(item.product) ? 'is-selected' : ''}`} key={item.product}>
                <Box className="retro-record-cell">
                  <Checkbox checked={activeSelectedIds.includes(item.product)} onChange={() => toggleSelected(item.product)} inputProps={{ 'aria-label': `Select ${item.name}` }} />
                  <Box className="retro-cart-art"><Box component="img" src={item.image || 'https://placehold.co/100x100?text=Recordia'} alt={item.name} /></Box>
                  <Box><Typography className="retro-item-name">{item.name}</Typography><Typography className="retro-item-artist">Recordia shelf</Typography></Box>
                </Box>
                <Typography className="retro-item-price">₱{Number(item.price).toFixed(2)}</Typography>
                <Select className="retro-quantity" size="small" value={item.quantity} onChange={(event) => changeQuantity(item.product, event.target.value)} aria-label={`Quantity for ${item.name}`}>
                  {Array.from({ length: item.stocks }, (_, index) => <MenuItem key={index + 1} value={index + 1}>{index + 1}</MenuItem>)}
                </Select>
                <Typography className="retro-item-subtotal">₱{(item.price * item.quantity).toFixed(2)}</Typography>
                <IconButton className="retro-remove" aria-label={`Remove ${item.name}`} onClick={() => removeFromCart(item.product)}><DeleteOutlineIcon /></IconButton>
              </Box>
            ))}
          </Paper>
          <Button className="retro-continue-button" startIcon={<ArrowBackIcon />} component={RouterLink} to="/">Continue shopping</Button>
        </Box>
        <Paper className="retro-summary-panel">
          <Typography className="eyebrow">ORDER SUMMARY</Typography>
          <Box className="retro-voucher"><input aria-label="Discount voucher" placeholder="Discount voucher" /><Button>Apply</Button></Box>
          <Divider />
          <Stack className="retro-summary-lines" spacing={1.5}>
            <Typography><span>Selected records</span><strong>{selectedItems.length}</strong></Typography>
            <Typography><span>Subtotal</span><strong>₱{selectedPrice.toFixed(2)}</strong></Typography>
            <Typography><span>Tax</span><strong>₱{tax.toFixed(2)}</strong></Typography>
            <Typography className="retro-total"><span>Total</span><strong>₱{(selectedPrice + tax).toFixed(2)}</strong></Typography>
          </Stack>
          <Button className="retro-primary-button" disabled={!selectedItems.length} startIcon={<ShoppingBagOutlinedIcon />} variant="contained" onClick={() => navigate('/checkout', { state: { productIds: activeSelectedIds } })}>Checkout selected</Button>
          <Box className="retro-trust-note"><CheckCircleOutlineIcon /> Carefully packed and checked before dispatch.</Box>
          <Box className="retro-trust-chip"><LockOutlinedIcon /> Secure checkout</Box>
          <Box className="retro-trust-chip"><LocalShippingOutlinedIcon /> Insured shipping</Box>
        </Paper>
      </Box>
    </Stack>
  );
}
