import { AppBar, Button, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AlbumOutlinedIcon from '@mui/icons-material/AlbumOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar sx={{ flexWrap: 'wrap', gap: { xs: 0.5, sm: 2 }, justifyContent: 'space-between', py: 1 }}>
        <Button color="inherit" component={RouterLink} startIcon={<AlbumOutlinedIcon />} to="/" sx={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '.08em' }}>Recordia</Button>
        <Stack direction="row" alignItems="center" flexWrap="wrap" justifyContent="flex-end" spacing={{ xs: 0, sm: 1 }} sx={{ flex: 1, minWidth: 0 }}>
          <Button color="inherit" component={RouterLink} to="/" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Home</Button>
          <IconButton color="inherit" component={RouterLink} to="/cart" aria-label="Cart">
            <ShoppingCartOutlinedIcon />{itemCount > 0 && <Typography component="span" sx={{ fontSize: '.75rem', ml: -0.5 }}>{itemCount}</Typography>}
          </IconButton>
          {user?.role === 'admin' && <><Button color="inherit" component={RouterLink} to="/admin/dashboard">Admin</Button><Button color="inherit" component={RouterLink} to="/admin/users" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>Users</Button><Button color="inherit" component={RouterLink} to="/admin/products" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>Products</Button></>}
          {user ? <><Button color="inherit" component={RouterLink} to="/profile">Profile</Button><Button color="inherit" component={RouterLink} to="/orders" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Orders</Button><Button color="inherit" onClick={() => { logout(); navigate('/'); }}>Logout</Button></> : <><Button color="inherit" component={RouterLink} to="/login">Login</Button><Button color="inherit" component={RouterLink} to="/register" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Register</Button></>}
        </Stack>
        <Typography sx={{ display: { xs: 'none', md: 'block' }, opacity: .75 }} variant="caption">Curated sounds &amp; goods</Typography>
      </Toolbar>
    </AppBar>
  );
}
