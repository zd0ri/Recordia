import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Drawer,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Slider,
  Stack, 
  TextField,
  Typography,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

const LIMIT = 12;
const DEFAULT_RANGE = [0, 500];

function FilterFields({ filters, artists, genres, updateFilter, resetFilters }) {
  return (
    <Stack spacing={2}>
      <TextField
        fullWidth
        label="Search albums"
        value={filters.keyword}
        onChange={(event) => updateFilter('keyword', event.target.value)}
      />
      <Box>
        <Typography gutterBottom>Price: ${filters.price[0]} - ${filters.price[1]}</Typography>
        <Slider
          min={0}
          max={500}
          step={5}
          value={filters.price}
          onChange={(_, value) => updateFilter('price', value)}
          valueLabelDisplay="auto"
        />
      </Box>
      <FormControl fullWidth>
        <InputLabel id="genre-filter-label">Genre</InputLabel>
        <Select labelId="genre-filter-label" label="Genre" value={filters.genre} onChange={(event) => updateFilter('genre', event.target.value)}>
          <MenuItem value="">All genres</MenuItem>
          {genres.map((genre) => <MenuItem key={genre._id} value={genre._id}>{genre.name}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel id="artist-filter-label">Artist</InputLabel>
        <Select labelId="artist-filter-label" label="Artist" value={filters.artist} onChange={(event) => updateFilter('artist', event.target.value)}>
          <MenuItem value="">All artists</MenuItem>
          {artists.map((artist) => <MenuItem key={artist._id} value={artist._id}>{artist.name}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel id="rating-filter-label">Minimum rating</InputLabel>
        <Select labelId="rating-filter-label" label="Minimum rating" value={filters.rating} onChange={(event) => updateFilter('rating', event.target.value)}>
          <MenuItem value="">Any rating</MenuItem>
          {[4, 3, 2, 1].map((rating) => <MenuItem key={rating} value={rating}>{rating}+ stars</MenuItem>)}
        </Select>
      </FormControl>
      <Button onClick={resetFilters}>Clear filters</Button>
    </Stack>
  );
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [artists, setArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filters = useMemo(() => ({
    keyword: searchParams.get('keyword') || '',
    genre: searchParams.get('genre') || '',
    artist: searchParams.get('artist') || '',
    rating: searchParams.get('ratings[gte]') || '',
    price: [
      Number(searchParams.get('price[gte]') || DEFAULT_RANGE[0]),
      Number(searchParams.get('price[lte]') || DEFAULT_RANGE[1]),
    ],
    mode: searchParams.get('view') === 'infinite' ? 'infinite' : 'pagination',
    page: Number(searchParams.get('page') || 1),
  }), [searchParams]);
  const sentinelRef = useRef(null);
  const filterKey = [
    filters.keyword,
    filters.genre,
    filters.artist,
    filters.rating,
    filters.price.join(','),
  ].join('|');

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [artistResponse, genreResponse] = await Promise.all([api.get('/artists'), api.get('/genres')]);
        setArtists(artistResponse.data.artists || []);
        setGenres(genreResponse.data.genres || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load filters');
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      if (filters.mode === 'infinite' && filters.page > 1) setLoadingMore(true);
      else setLoading(true);
      try {
        const params = {
          page: filters.page,
          limit: LIMIT,
          ...(filters.keyword && { keyword: filters.keyword }),
          ...(filters.genre && { genre: filters.genre }),
          ...(filters.artist && { artist: filters.artist }),
          ...(filters.rating && { 'ratings[gte]': filters.rating }),
          ...(filters.price[0] > DEFAULT_RANGE[0] && { 'price[gte]': filters.price[0] }),
          ...(filters.price[1] < DEFAULT_RANGE[1] && { 'price[lte]': filters.price[1] }),
        };
        const { data } = await api.get('/products', { params });
        if (!cancelled) {
          setProducts((current) => (
            filters.mode === 'infinite' && filters.page > 1
              ? [...current, ...(data.products || [])]
              : data.products || []
          ));
          setTotalPages(data.totalPages || 0);
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.response?.data?.message || 'Unable to load products');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [filterKey, filters.mode, filters.page, filters.artist, filters.genre, filters.keyword, filters.price, filters.rating]);

  useEffect(() => {
    if (filters.mode !== 'infinite' || !sentinelRef.current || loading || loadingMore || filters.page >= totalPages) {
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const next = new URLSearchParams(searchParams);
      next.set('page', String(filters.page + 1));
      setSearchParams(next);
    }, { rootMargin: '300px' });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filters.mode, filters.page, loading, loadingMore, totalPages, searchParams, setSearchParams]);

  const updateFilter = (name, value) => {
    const next = new URLSearchParams(searchParams);
    if (name === 'price') {
      if (value[0] > DEFAULT_RANGE[0]) next.set('price[gte]', value[0]);
      else next.delete('price[gte]');
      if (value[1] < DEFAULT_RANGE[1]) next.set('price[lte]', value[1]);
      else next.delete('price[lte]');
    } else if (value) next.set(name === 'rating' ? 'ratings[gte]' : name, value);
    else next.delete(name === 'rating' ? 'ratings[gte]' : name);
    next.set('page', '1');
    setSearchParams(next);
  };

  const resetFilters = () => setSearchParams(
    filters.mode === 'infinite'
      ? { page: '1', view: 'infinite' }
      : { page: '1' },
  );

  const changeMode = (event) => {
    const next = new URLSearchParams(searchParams);
    const mode = event.target.value;
    if (mode === 'infinite') next.set('view', 'infinite');
    else next.delete('view');
    next.set('page', '1');
    setSearchParams(next);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">Find your next favorite record</Typography>
        <Typography color="text.secondary">Where Music Meets Nostalgia</Typography>
      </Box>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      <FormControl size="small" sx={{ maxWidth: 220 }}>
        <InputLabel id="display-mode-label">Display mode</InputLabel>
        <Select labelId="display-mode-label" label="Display mode" value={filters.mode} onChange={changeMode}>
          <MenuItem value="pagination">Pagination</MenuItem>
          <MenuItem value="infinite">Infinite scroll</MenuItem>
        </Select>
      </FormControl>
      <Button startIcon={<FilterListIcon />} sx={{ alignSelf: 'flex-start', display: { md: 'none' } }} variant="outlined" onClick={() => setDrawerOpen(true)}>
        Filters
      </Button>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Card sx={{ p: 2 }}><CardContent><Typography gutterBottom variant="h5">Filters</Typography><FilterFields filters={filters} artists={artists} genres={genres} updateFilter={updateFilter} resetFilters={resetFilters} /></CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 9 }}>
          {loading ? (
            <Grid container spacing={2}>{Array.from({ length: 6 }).map((_, index) => <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}><Skeleton variant="rectangular" height={330} /><Skeleton width="70%" /><Skeleton width="45%" /></Grid>)}</Grid>
          ) : products.length ? (
            <>
              <Grid container spacing={2}>{products.map((product) => <Grid key={product._id} size={{ xs: 12, sm: 6, lg: 4 }}><ProductCard product={product} /></Grid>)}</Grid>
              {filters.mode === 'pagination' && totalPages > 1 && <Pagination count={totalPages} page={filters.page} onChange={(_, page) => updateFilter('page', page)} sx={{ display: 'flex', justifyContent: 'center', mt: 4 }} />}
              {filters.mode === 'infinite' && (
                <Box ref={sentinelRef} sx={{ minHeight: 56, py: 2, textAlign: 'center' }}>
                  {loadingMore && <Typography color="text.secondary">Loading more products...</Typography>}
                  {!loadingMore && filters.page >= totalPages && <Typography color="text.secondary">You have reached the end of the collection.</Typography>}
                </Box>
              )}
            </>
          ) : <Typography sx={{ py: 8, textAlign: 'center' }} variant="h5">No products match these filters.</Typography>}
        </Grid>
      </Grid>
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ p: 3, width: 300 }}><Typography gutterBottom variant="h5">Filters</Typography><FilterFields filters={filters} artists={artists} genres={genres} updateFilter={updateFilter} resetFilters={() => { resetFilters(); setDrawerOpen(false); }} /></Box>
      </Drawer>
    </Stack>
  );
}
