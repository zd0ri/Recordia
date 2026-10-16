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
    <AppBar className="recordia-navbar" position="static" color="primary" elevation={0}>
      <Toolbar className="recordia-toolbar" sx={{ flexWrap: 'wrap', gap: { xs: 0.5, sm: 2 }, justifyContent: 'space-between', py: 1 }}>
        <Button className="recordia-logo" color="inherit" component={RouterLink} startIcon={<AlbumOutlinedIcon />} to="/">
          <span>Recordia</span>
          <small>EST. 2024</small>
        </Button>
        <Stack className="recordia-nav-links" direction="row" alignItems="center" flexWrap="wrap" justifyContent="flex-end" spacing={{ xs: 0, sm: 1 }} sx={{ flex: 1, minWidth: 0 }}>
          <Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Home</Button>
          {user?.role !== 'admin' && <IconButton color="inherit" component={RouterLink} to="/cart" aria-label="Cart">
            <ShoppingCartOutlinedIcon /><span className="cart-badge">{itemCount || 0}</span>
          </IconButton>}
          {user?.role === 'admin' ? <Button className="recordia-nav-link" color="inherit" onClick={() => { logout(); navigate('/'); }}>Logout</Button>
            : user ? <><Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/profile">Profile</Button><Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/orders" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Orders</Button><Button className="recordia-nav-link" color="inherit" onClick={() => { logout(); navigate('/'); }}>Logout</Button></>
              : <><Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/login">Login</Button><Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/register" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Register</Button></>}
        </Stack>
        <Typography className="recordia-tagline" sx={{ display: { xs: 'none', md: 'block' } }} variant="caption">Curated sounds &amp; goods</Typography>
      </Toolbar>
    </AppBar>
  );
}
