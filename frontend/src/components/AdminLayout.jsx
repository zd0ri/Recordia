import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import MicExternalOnRoundedIcon from '@mui/icons-material/MicExternalOnRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  ['Dashboard', '/admin/dashboard', DashboardRoundedIcon],
  ['Products', '/admin/products', Inventory2RoundedIcon],
  ['Genres', '/admin/genres', CategoryRoundedIcon],
  ['Artists', '/admin/artists', MicExternalOnRoundedIcon],
  ['Orders', '/admin/orders', LocalShippingRoundedIcon],
  ['Reviews', '/admin/reviews', RateReviewRoundedIcon],
  ['Users', '/admin/users', PeopleAltRoundedIcon],
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Stack className="admin-shell" direction={{ xs: 'column', md: 'row' }} spacing={3}>
      <Box className="admin-sidebar" component="nav">
        <Box className="admin-brand">
          <Typography className="admin-brand-mark">R</Typography>
          <Box>
            <Typography className="admin-brand-title">Recordia</Typography>
            <Typography className="admin-brand-subtitle">Control room</Typography>
          </Box>
        </Box>
        <Divider />
        <Typography className="admin-nav-label">Main menu</Typography>
        <Stack className="admin-nav-links" direction={{ xs: 'row', md: 'column' }} flexWrap="wrap">
          {links.map(([label, path, Icon]) => (
            <Button className="admin-nav-button" key={path} component={RouterLink} to={path} variant={location.pathname === path ? 'contained' : 'text'} startIcon={<Icon />}>
              {label}
            </Button>
          ))}
        </Stack>
        <Box className="admin-sidebar-note">
          <Typography variant="caption">ON AIR</Typography>
          <Typography>Backstage access enabled</Typography>
          <Button className="admin-home-button" component={RouterLink} to="/" variant="outlined">
            View homepage
          </Button>
          <Button className="admin-logout-button" onClick={handleLogout} startIcon={<LogoutRoundedIcon />} variant="outlined">
            Logout
          </Button>
        </Box>
      </Box>
      <Box className="admin-content" sx={{ flex: 1, minWidth: 0 }}><Outlet /></Box>
    </Stack>
  );
}
