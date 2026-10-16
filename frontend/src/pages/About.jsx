import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function About() {
  return (
    <Stack className="about-page" spacing={4}>
      <Box className="about-hero">
        <Box className="about-hero-copy">
          <Typography className="eyebrow">ABOUT RECORDIA</Typography>
          <Typography variant="h1">The record shop for people who still listen all the way through.</Typography>
          <Typography>Recordia is an independent online record shop built around the ritual of choosing a side, dropping the needle, and giving an album the time it deserves.</Typography>
        </Box>
        <Box className="about-hero-art"><span>RECORDIA<br />EST. 2024</span></Box>
      </Box>
      <Box className="about-intro">
        <Typography className="eyebrow">THE SHOP</Typography>
        <Typography variant="h2">A small shop with a deep love for analog.</Typography>
        <Typography>We curate records, listening-room gear, and accessories for curious ears. Every item in the shop is selected for its sound, story, and ability to become part of someone’s everyday ritual.</Typography>
      </Box>
      <Box className="about-cards">
        <Box className="about-card"><Box className="about-card-art about-card-art--listening" /><Box><Typography variant="h3">Why Recordia?</Typography><Typography>We believe a great record can change the atmosphere of a whole room. Our shelves are chosen with care, not filled for the sake of filling space.</Typography><Button component={RouterLink} to="/collections/new-arrivals">Explore new arrivals →</Button></Box></Box>
        <Box className="about-card about-card--reverse"><Box className="about-card-art about-card-art--gear" /><Box><Typography variant="h3">The listening room.</Typography><Typography>From turntable essentials to small accessories, we help make the space around your records feel as good as the music itself.</Typography><Button component={RouterLink} to="/collections/accessories">Shop the gear →</Button></Box></Box>
        <Box className="about-card"><Box className="about-card-art about-card-art--records" /><Box><Typography variant="h3">The records.</Typography><Typography>New pressings, timeless classics, and unexpected finds—carefully curated for the raw, real, and resonant sounds that stay with you.</Typography><Button component={RouterLink} to="/">Shop records →</Button></Box></Box>
      </Box>
    </Stack>
  );
}
