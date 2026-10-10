import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';

const links = [
  ['Dashboard', '/admin/dashboard'],
  ['Products', '/admin/products'],
  ['Genres', '/admin/genres'],
  ['Artists', '/admin/artists'],
  ['Orders', '/admin/orders'],
  ['Reviews', '/admin/reviews'],
  ['Users', '/admin/users'],
];

export default function AdminLayout() {
  const location = useLocation();
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
      <Box component="nav" sx={{ minWidth: { md: 190 }, border: 1, borderColor: 'divider', borderRadius: 1, p: 1, alignSelf: 'flex-start', width: { xs: '100%', md: 'auto' } }}>
        <Typography sx={{ px: 1, py: 1 }} variant="h6">Admin</Typography>
        <Divider />
        <Stack direction={{ xs: 'row', md: 'column' }} flexWrap="wrap" sx={{ pt: 1 }}>
          {links.map(([label, path]) => (
            <Button key={path} component={RouterLink} to={path} variant={location.pathname === path ? 'contained' : 'text'} sx={{ justifyContent: 'flex-start' }}>
              {label}
            </Button>
          ))}
        </Stack>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}><Outlet /></Box>
    </Stack>
  );
}
