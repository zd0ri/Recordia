import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Grid, Skeleton, Stack, Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

const collections = {
  'new-arrivals': {
    label: 'New arrivals',
    kicker: 'JUST IN / FRESH PRESSINGS',
    title: 'New to the bins.',
    description: 'The latest additions to the Recordia collection, pulled from our real inventory.',
    filter: () => true,
  },
  vinyl: {
    label: 'Vinyl',
    kicker: 'THE CORE COLLECTION',
    title: 'Round and round.',
    description: 'The records that make a room feel like home.',
    filter: (product) => product.merch_type === 'Vinyl',
  },
  'audio-gear': {
    label: 'Audio gear',
    kicker: 'LISTENING DESK / COMING SOON',
    title: 'Build your setup.',
    description: 'Turntables, speakers, and listening essentials are being tuned up for a future drop.',
  },
  accessories: {
    label: 'Accessories',
    kicker: 'THE RECORD-STORE EXTRAS',
    title: 'Carry the culture.',
    description: 'Posters, totes, and accessories from the current Recordia inventory.',
    filter: (product) => ['Accessory', 'Tote Bag', 'Poster'].includes(product.merch_type),
  },
  'pre-orders': {
    label: 'Pre-orders',
    kicker: 'FIRST PRESS / COMING SOON',
    title: 'Reserve the next spin.',
    description: 'Pre-orders will appear here when they are enabled in the collection.',
  },
  sale: {
    label: 'Sale',
    kicker: 'THE BARGAIN BIN / COMING SOON',
    title: 'Good records, better finds.',
    description: 'Sale pricing is not currently configured, so no products are being misrepresented here.',
  },
  journal: {
    label: 'Journal',
    kicker: 'THE RECORDIA JOURNAL',
    title: 'Notes from the listening room.',
    description: 'Stories, sleeve notes, and guides for people who still turn the record over.',
    journal: true,
  },
};

export default function CollectionLanding() {
  const { collection } = useParams();
  const section = collections[collection] || collections['new-arrivals'];
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!section.journal);

  useEffect(() => {
    if (section.journal) return undefined;
    let cancelled = false;
    api.get('/products', { params: { page: 1, limit: 100 } })
      .then(({ data }) => {
        if (cancelled) return;
        const items = (data.products || []).filter(section.filter || (() => false));
        setProducts(collection === 'new-arrivals'
          ? items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : items);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.response?.data?.message || 'Unable to load collection');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [collection, section]);

  const featured = useMemo(() => products[0], [products]);

  return (
    <Stack className="collection-page" spacing={4}>
      <Box className="collection-hero">
        <Box className="collection-copy">
          <Typography className="eyebrow">{section.kicker}</Typography>
          <Typography className="collection-title" variant="h1">{section.title}</Typography>
          <Typography className="collection-description">{section.description}</Typography>
          <Button component={RouterLink} to="/" variant="contained">Back to all records</Button>
        </Box>
        <Box className="collection-art" aria-hidden="true">
          <div className="collection-record"><span /></div>
          {featured && <Box component="img" src={featured.images?.[0]?.url} alt="" />}
        </Box>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {section.journal ? (
        <Box className="journal-feature">
          <Typography className="eyebrow">FIELD NOTES / 001</Typography>
          <Typography variant="h2">Why vinyl still matters.</Typography>
          <Typography>There is a ritual in choosing a side, lowering the needle, and letting a whole album take its time.</Typography>
        </Box>
      ) : loading ? (
        <Grid container spacing={2}>{[1, 2, 3].map((item) => <Grid key={item} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton height={340} variant="rectangular" /></Grid>)}</Grid>
      ) : products.length ? (
        <Grid container spacing={2}>{products.map((product) => <Grid key={product._id} size={{ xs: 12, sm: 6, md: 4 }}><ProductCard product={product} /></Grid>)}</Grid>
      ) : (
        <Box className="collection-empty">
          <Typography variant="h3">This shelf is being stocked.</Typography>
          <Typography>We only show products backed by the current Recordia inventory.</Typography>
        </Box>
      )}
    </Stack>
  );
}
