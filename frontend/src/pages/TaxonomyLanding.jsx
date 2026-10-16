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
    Promise.all([
      api.get(isArtist ? '/artists' : '/genres'),
      api.get('/products', { params: { page: 1, limit: 100 } }),
    ]).then(([taxonomyResponse, productsResponse]) => {
      const taxonomyItems = isArtist ? taxonomyResponse.data.artists || [] : taxonomyResponse.data.genres || [];
      setItems(taxonomyItems);
      const requestedName = searchParams.get('keyword')?.toLowerCase();
      if (requestedName) {
        const requestedItem = taxonomyItems.find((item) => item.name?.toLowerCase() === requestedName);
        if (requestedItem) setSelected(requestedItem._id);
      }
      setProducts(productsResponse.data.products || []);
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
          {!isArtist && <span className="taxonomy-card-mark">●</span>}
          <span>{item.name}</span><small>{isArtist ? 'View discography →' : 'Browse shelf →'}</small>
        </Button>)}
      </Box>
      <Box className="taxonomy-results">
        <Box className="section-heading">
          <Box><Typography className="eyebrow">{selected ? (isArtist ? 'SELECTED ARTIST' : 'SELECTED GENRE') : 'ALL SHELVES'}</Typography><Typography variant="h2">{selected ? items.find((item) => item._id === selected)?.name : pageContent.allLabel}</Typography></Box>
          {selected && <Button onClick={() => setSelected('')}>Show all</Button>}
        </Box>
        {products.length === 0 && !error ? <Grid container spacing={2}>{[1, 2, 3].map((item) => <Grid key={item} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton height={340} variant="rectangular" /></Grid>)}</Grid>
          : filteredProducts.length ? <Grid container spacing={2}>{filteredProducts.map((product) => <Grid key={product._id} size={{ xs: 12, sm: 6, md: 4 }}><ProductCard product={product} /></Grid>)}</Grid>
            : <Box className="collection-empty"><Typography variant="h3">This shelf is being stocked.</Typography><Button component={RouterLink} to="/" variant="contained">Return to records</Button></Box>}
      </Box>
    </Stack>
  );
}
