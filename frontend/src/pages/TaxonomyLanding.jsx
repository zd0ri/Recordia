import { useEffect, useState } from 'react';
import { Alert, Box, Button, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function TaxonomyLanding({ type }) {
  const [searchParams] = useSearchParams();
  const isArtist = type === 'artists';
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const requests = [api.get(isArtist ? '/artists' : '/genres')];
    if (!isArtist) requests.push(api.get('/products', { params: { page: 1, limit: 100 } }));

    Promise.all(requests).then((responses) => {
      const taxonomyResponse = responses[0];
      const taxonomyItems = isArtist ? taxonomyResponse.data.artists || [] : taxonomyResponse.data.genres || [];
      setItems(taxonomyItems);
      const requestedName = searchParams.get('keyword')?.toLowerCase();
      if (requestedName) {
        const requestedItem = taxonomyItems.find((item) => item.name?.toLowerCase() === requestedName);
        if (requestedItem) setSelected(requestedItem._id);
      }
      if (!isArtist) setProducts(responses[1].data.products || []);
    }).catch((requestError) => {
      setError(requestError.response?.data?.message || `Unable to load ${type}`);
    });
  }, [isArtist, searchParams, type]);

  const filteredProducts = selected
    ? products.filter((product) => (isArtist ? product.artist?._id : product.genre?._id) === selected)
    : products;
  const pageContent = isArtist
    ? {
      eyebrow: 'THE RECORDIA ARTIST INDEX',
      title: 'Voices worth returning to.',
      description: 'Discover the artists behind the sleeves and explore the records that shaped their sound.',
      directoryLabel: 'ARTISTS ON THE SHELF',
      allLabel: 'All artists',
    }
    : {
      eyebrow: 'THE RECORDIA GENRE INDEX',
      title: 'Find your sound.',
      description: 'Move through the shelves by mood, movement, and the sounds that keep a record spinning.',
      directoryLabel: 'EXPLORE BY GENRE',
      allLabel: 'All genres',
    };

  return (
    <Stack className={`taxonomy-page ${isArtist ? 'artists-page' : 'genres-page'}`} spacing={4}>
      <Box className="taxonomy-hero">
        <Typography className="eyebrow">{pageContent.eyebrow}</Typography>
        <Typography variant="h1">{pageContent.title}</Typography>
        <Typography>{pageContent.description}</Typography>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Box className="taxonomy-directory-heading">
        <Typography className="eyebrow">{pageContent.directoryLabel}</Typography>
        <Typography variant="h2">{isArtist ? 'The people behind the music.' : 'The shelves have a language.'}</Typography>
      </Box>
      <Box className={`taxonomy-directory ${isArtist ? 'artist-directory' : 'genre-directory'}`}>
        {items.map((item) => <Button key={item._id} className={selected === item._id ? 'is-selected' : ''} onClick={() => setSelected(item._id)}>
          {isArtist
            ? (item.image?.url
              ? <Box component="img" src={item.image.url} alt="" sx={{ borderRadius: '50%', height: 42, objectFit: 'cover', width: 42 }} />
              : <span className="taxonomy-card-mark">●</span>)
            : <span className="taxonomy-card-mark">●</span>}
          <span>{item.name}</span><small>{isArtist ? 'View discography →' : 'Browse shelf →'}</small>
        </Button>)}
      </Box>
      <Box className="taxonomy-results">
        {isArtist ? (
          <Grid className="artist-detail-grid" container spacing={2}>
            {(selected ? items.filter((item) => item._id === selected) : items).map((artist) => (
              <Grid key={artist._id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box className="artist-detail-card">
                  {artist.image?.url && <Box component="img" src={artist.image.url} alt={artist.name} />}
                  <Box className="artist-detail-copy">
                    <Typography className="eyebrow">ARTIST PROFILE</Typography>
                    <Typography variant="h3">{artist.name}</Typography>
                    <Typography>{artist.bio || 'No biography has been added yet.'}</Typography>
                    {selected === artist._id && <Button onClick={() => setSelected('')}>Show all artists</Button>}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <Box className="section-heading">
              <Box><Typography className="eyebrow">{selected ? 'SELECTED GENRE' : 'ALL SHELVES'}</Typography><Typography variant="h2">{selected ? items.find((item) => item._id === selected)?.name : pageContent.allLabel}</Typography></Box>
              {selected && <Button onClick={() => setSelected('')}>Show all</Button>}
            </Box>
            {products.length === 0 && !error && (
              <Grid container spacing={2}>
                {[1, 2, 3].map((item) => <Grid key={item} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton height={340} variant="rectangular" /></Grid>)}
              </Grid>
            )}
            {products.length > 0 && filteredProducts.length > 0 && (
              <Grid container spacing={2}>
                {filteredProducts.map((product) => <Grid key={product._id} size={{ xs: 12, sm: 6, md: 4 }}><ProductCard product={product} /></Grid>)}
              </Grid>
            )}
            {products.length > 0 && !filteredProducts.length && (
              <Box className="collection-empty"><Typography variant="h3">This shelf is being stocked.</Typography><Button component={RouterLink} to="/" variant="contained">Return to records</Button></Box>
            )}
          </>
        )}
      </Box>
    </Stack>
  );
}
