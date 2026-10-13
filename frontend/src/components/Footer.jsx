import { Box, Container, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', py: 3, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Typography color="text.secondary" variant="body2">
          © {new Date().getFullYear()} Recordia. Where Music Comes with Nostalgia.
        </Typography>
      </Container>
    </Box>
  );
}
