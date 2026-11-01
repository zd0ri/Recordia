import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button,
  Grid,
  Slider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

const LIMIT = 12;

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [genreTiles, setGenreTiles] = useState([]);
  const [collectorReviews, setCollectorReviews] = useState([]);
  const [priceBounds, setPriceBounds] = useState([0, 500]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const sentinelRef = useRef(null);
  const requestPending = useRef(false);

  const filters = useMemo(() => ({
    keyword: searchParams.get('keyword') || '',
    genre: searchParams.get('genre') || '',
    artist: searchParams.get('artist') || '',
    rating: searchParams.has('ratings[gte]')
      ? String(Math.round(Number(searchParams.get('ratings[gte]'))))
      : '',
    reviewCount: searchParams.get('reviews[gte]') || '',
    price: [
      Number(searchParams.get('price[gte]') ?? priceBounds[0]),
      Number(searchParams.get('price[lte]') ?? priceBounds[1]),
    ],
  }), [priceBounds, searchParams]);
  const filterKey = [
    filters.keyword,
    filters.genre,
    filters.artist,
    searchParams.get('album') || '',
    searchParams.get('merch_type') || '',
    filters.rating,
    filters.reviewCount,
    filters.price.join(','),
  ].join('|');
  const [pagination, setPagination] = useState({ filterKey, page: 1 });
  const page = pagination.filterKey === filterKey ? pagination.page : 1;

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      requestPending.current = true;
      setLoading(true);
      setError('');
      try {
        const params = {
          page,
          limit: LIMIT,
          ...(filters.keyword && { keyword: filters.keyword }),
          ...(filters.genre && { genre: filters.genre }),
          ...(filters.artist && { artist: filters.artist }),
          ...(searchParams.get('album') && { album: searchParams.get('album') }),
          ...(searchParams.get('merch_type') && { merch_type: searchParams.get('merch_type') }),
          ...(filters.rating && { 'ratings[gte]': filters.rating }),
          ...(filters.reviewCount && { 'reviews[gte]': filters.reviewCount }),
          ...(filters.price[0] > priceBounds[0] && { 'price[gte]': filters.price[0] }),
          ...(filters.price[1] < priceBounds[1] && { 'price[lte]': filters.price[1] }),
        };
        const { data } = await api.get('/products', { params });
        if (!cancelled) {
          const nextProducts = data.products || [];
          setProducts((current) => page === 1 ? nextProducts : [...current, ...nextProducts]);
          setTotalPages(data.totalPages || 0);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.response?.data?.message || 'Unable to load products');
      } finally {
        if (!cancelled) {
          setLoading(false);
          requestPending.current = false;
        }
      }
    };
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [filterKey, filters.artist, filters.genre, filters.keyword, filters.price, filters.rating, filters.reviewCount, page, priceBounds, searchParams]);

  useEffect(() => {
    let cancelled = false;
    const loadGenreCounts = async () => {
      try {
        const [genresResponse, optionsResponse] = await Promise.all([
          api.get('/genres'),
          api.get('/products/filter-options'),
        ]);
        if (cancelled) return;
        if (optionsResponse.data.priceRange?.length === 2) {
          setPriceBounds(optionsResponse.data.priceRange);
        }
        const { data } = genresResponse;
        const genres = data.genres || [];
        const counts = await Promise.all(genres.map(async (genre) => {
          const response = await api.get('/products', {
            params: { genre: genre._id, page: 1, limit: 1 },
          });
          return { ...genre, count: response.data.filteredProductsCount || 0 };
        }));
        if (!cancelled) setGenreTiles(counts.slice(0, 7));
      } catch (requestError) {
        if (!cancelled) setError(requestError.response?.data?.message || 'Unable to load genre counts');
      }
    };
    loadGenreCounts();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get('/reviews/featured')
      .then(({ data }) => {
        if (!cancelled) setCollectorReviews(data.reviews || []);
      })
      .catch((requestError) => {
        if (!cancelled) setReviewError(requestError.response?.data?.message || 'Unable to load collector reviews');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || page >= totalPages) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !requestPending.current) {
        requestPending.current = true;
        setPagination({ filterKey, page: page + 1 });
      }
    }, { rootMargin: '240px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filterKey, loading, page, totalPages]);

  const updateFilter = (name, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name === 'rating' ? 'ratings[gte]' : name === 'reviewCount' ? 'reviews[gte]' : name, value);
    else next.delete(name === 'rating' ? 'ratings[gte]' : name === 'reviewCount' ? 'reviews[gte]' : name);
    setSearchParams(next);
  };

  const updatePriceRange = (_, range) => {
    const next = new URLSearchParams(searchParams);
    if (range[0] <= priceBounds[0]) next.delete('price[gte]');
    else next.set('price[gte]', String(range[0]));
    if (range[1] >= priceBounds[1]) next.delete('price[lte]');
    else next.set('price[lte]', String(range[1]));
    setSearchParams(next);
  };

  const featuredProduct = products[0];
  const featuredReleases = products.slice(0, 6);
  const gearProducts = products.slice(6, 11);

  return (
    <Stack className="home-page" spacing={5}>
      <Box className="recordia-hero">
        <Box className="hero-copy">
          <Typography className="eyebrow">THE ANALOG COLLECTION / EST. 2024</Typography>
          <Typography className="hero-title" variant="h1">Find your next<br /><em>favorite record.</em></Typography>
          <Typography className="hero-description">Curated sounds, timeless sleeves, and the warm crackle of music made tangible.</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            <Button className="hero-primary" component="a" href="#collection" variant="contained">Explore records</Button>
            <Button className="hero-secondary" component="a" href="#collection" variant="outlined">Browse collections</Button>
          </Stack>
        </Box>
        <Box className="hero-art">
          <span className="hero-sticker">PLAY<br />IT<br />LOUD</span>
          <div className="hero-record" aria-hidden="true"><span /></div>
          {featuredProduct && <Box component="img" className="hero-sleeve" src={featuredProduct.images?.[0]?.url} alt={featuredProduct.album_title} />}
        </Box>
      </Box>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      <Box className="genre-band" id="genres">
        <Box className="band-heading">
          <Typography className="eyebrow">SHOP BY GENRE</Typography>
          <Typography variant="h2">Find your sound.</Typography>
        </Box>
        <Button component={RouterLink} to="/genres" className="band-link">View all genres →</Button>
        <Box className="genre-tiles">
          {genreTiles.map((genre, index) => (
            <Button key={genre._id} className="genre-tile" component={RouterLink} to={`/genres?keyword=${encodeURIComponent(genre.name)}`}>
              <Box className="genre-image" sx={{ backgroundImage: `url(${products[index]?.images?.[0]?.url || 'https://placehold.co/160x160?text=Vinyl'})` }} />
              <strong>{genre.name}</strong>
              <small>{genre.count} {genre.count === 1 ? 'title' : 'titles'}</small>
            </Button>
          ))}
        </Box>
      </Box>
      <Box className="featured-band">
        <Box className="band-heading">
          <Typography className="eyebrow">FEATURED RELEASES</Typography>
          <Typography variant="h2">Handpicked heat.</Typography>
        </Box>
        <Button component="a" href="#collection" className="band-link">View all →</Button>
        <Grid container spacing={1.5} className="featured-grid">
          {featuredReleases.map((product) => (
            <Grid key={product._id} size={{ xs: 6, sm: 4, md: 2 }}>
              <Box className="featured-release">
                <Box component="img" src={product.images?.[0]?.url || 'https://placehold.co/300x300?text=Recordia'} alt={product.album_title} />
                <Typography className="release-name">{product.album_title}</Typography>
                <Typography className="release-artist">{product.artist?.name || product.merch_type}</Typography>
                <Typography className="release-price">₱{Number(product.price || 0).toFixed(2)}</Typography>
                <Button component={RouterLink} to={`/products/${product._id}`}>View record</Button>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box className="gear-band">
        <Box className="gear-intro">
          <Typography className="eyebrow">AUDIO GEAR & ACCESSORIES</Typography>
          <Typography variant="h2">Spin it right.</Typography>
          <Typography>Quality gear makes all the difference.</Typography>
          <Button component={RouterLink} to="/collections/accessories">Shop gear</Button>
        </Box>
        {gearProducts.map((product) => (
          <Box className="gear-item" key={product._id}>
            <Box component="img" src={product.images?.[0]?.url || 'https://placehold.co/300x220?text=Gear'} alt={product.name || product.album_title} />
            <Typography>{product.name || product.album_title}</Typography>
            <strong>₱{Number(product.price || 0).toFixed(2)}</strong>
          </Box>
        ))}
      </Box>
      <Box className="reviews-band">
        <Box className="band-heading">
          <Typography className="eyebrow">COLLECTOR FAVORITES</Typography>
          <Typography variant="h2">What our collectors say.</Typography>
        </Box>
        <Grid container spacing={2}>
          {reviewError && <Grid size={12}><Alert severity="error">{reviewError}</Alert></Grid>}
          {collectorReviews.length
            ? collectorReviews.map((review) => <Grid key={review._id} size={{ xs: 12, md: 4 }}><Box className="review-quote"><span>“</span><Typography>{review.comment}</Typography><strong>— {review.name}</strong><small>{review.product?.album_title} · {review.rating}/5 stars</small></Box></Grid>)
            : !reviewError && <Grid size={12}><Typography color="text.secondary">Collector reviews will appear here after customers share their experience.</Typography></Grid>}
        </Grid>
      </Box>
      <Box className="drops-band">
        <Box><Typography className="eyebrow">LIMITED PRESSINGS</Typography><Typography variant="h2">Limited drops.<br />Don’t miss out.</Typography></Box>
        <Box className="drop-count"><strong>03</strong><small>DAYS</small><strong>14</strong><small>HRS</small><strong>27</strong><small>MINS</small><strong>52</strong><small>SECS</small></Box>
        <Button component="a" href="#collection">Explore drops</Button>
      </Box>
      <Box className="section-heading" id="collection">
        <Box><Typography className="eyebrow">THE RECORD ROOM</Typography><Typography variant="h2">Browse the collection</Typography></Box>
        <Typography className="section-note">Handpicked for curious ears.</Typography>
      </Box>
      <Box className="home-filter-panel">
        <Typography className="eyebrow">TUNE YOUR CRATE</Typography>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography gutterBottom>Price range: ₱{filters.price[0]} – ₱{filters.price[1]}</Typography>
            <Slider
              key={`price-${filterKey}`}
              aria-label="Price range"
              min={priceBounds[0]}
              max={Math.max(priceBounds[1], priceBounds[0] + 1)}
              step={Math.max(0.01, Number(((priceBounds[1] - priceBounds[0]) / 100).toFixed(2)))}
              defaultValue={filters.price}
              onChangeCommitted={updatePriceRange}
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography gutterBottom>Minimum rating: {Number(filters.rating || 0)} stars</Typography>
            <Slider
              key={`rating-${filterKey}`}
              aria-label="Minimum rating"
              min={0}
              max={5}
              step={1}
              defaultValue={Number(filters.rating || 0)}
              onChangeCommitted={(_, rating) => updateFilter('rating', rating ? String(rating) : '')}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </Box>
      <Grid container spacing={3}>
        <Grid size={12}>
          {loading && !products.length ? (
            <Grid container spacing={2}>{Array.from({ length: 6 }).map((_, index) => <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}><Skeleton variant="rectangular" height={330} /><Skeleton width="70%" /><Skeleton width="45%" /></Grid>)}</Grid>
          ) : products.length ? (
            <Grid container spacing={2}>{products.map((product) => <Grid key={product._id} size={{ xs: 12, sm: 6, lg: 4 }}><ProductCard product={product} /></Grid>)}</Grid>
          ) : !loading && <Typography sx={{ py: 8, textAlign: 'center' }} variant="h5">No products match these filters.</Typography>}
          {products.length > 0 && page < totalPages && <Box ref={sentinelRef} sx={{ py: 3, textAlign: 'center' }}><Typography color="text.secondary">{loading ? 'Loading more records...' : 'Keep scrolling for more records'}</Typography></Box>}
        </Grid>
      </Grid>
    </Stack>
  );
}
