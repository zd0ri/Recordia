import { useEffect, useMemo, useState } from 'react';
import { Alert, AppBar, Box, Button, FormControl, IconButton, InputBase, MenuItem, Popover, Select, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AlbumOutlinedIcon from '@mui/icons-material/AlbumOutlined';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [options, setOptions] = useState({ artists: [], genres: [], merchTypes: [] });
  const [filterError, setFilterError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const currentParams = new URLSearchParams(location.search);
    const params = {};
    ['genre', 'artist', 'merch_type'].forEach((key) => {
      const value = currentParams.get(key);
      if (value) params[key] = value;
    });
    api.get('/products/filter-options', { params }).then(({ data }) => {
      if (cancelled) return;
      setOptions({
        artists: data.artists || [],
        genres: data.genres || [],
        merchTypes: data.merchTypes || [],
      });
    }).catch((requestError) => {
      if (!cancelled) setFilterError(requestError.response?.data?.message || 'Unable to load filter options');
    });
    return () => { cancelled = true; };
  }, [location.search]);

  useEffect(() => {
    const query = search.trim();
    if (!query) {
      return undefined;
    }
    let cancelled = false;
    const currentParams = new URLSearchParams(location.search);
    const params = { keyword: query };
    ['genre', 'artist', 'merch_type'].forEach((key) => {
      const value = currentParams.get(key);
      if (value) params[key] = value;
    });
    const timer = setTimeout(() => {
      api.get('/products/suggestions', { params })
        .then(({ data }) => {
          if (!cancelled) setSuggestions(data.products || []);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [location.search, search]);

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    const productMatches = suggestions.filter((product) => [
      product.album_title,
      product.name,
      product.artist?.name,
      product.genre?.name,
    ].some((value) => value?.toLowerCase().includes(query))).map((product) => ({
      ...product,
      suggestionType: 'record',
    }));
    const genreMatches = options.genres.filter((genre) => genre.name?.toLowerCase().includes(query)).map((genre) => ({
      ...genre,
      suggestionType: 'genre',
    }));
    const artistMatches = options.artists.filter((artist) => artist.name?.toLowerCase().includes(query)).map((artist) => ({
      ...artist,
      suggestionType: 'artist',
    }));
    return [...genreMatches, ...artistMatches, ...productMatches].slice(0, 8);
  }, [options.artists, options.genres, search, suggestions]);

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams(location.search);
    params.delete('album');
    if (search.trim()) params.set('keyword', search.trim());
    else params.delete('keyword');
    navigate(`/?${params.toString()}`);
    setSearchOpen(true);
  };

  const chooseSuggestion = (product) => {
    const params = new URLSearchParams(location.search);
    params.delete('keyword');
    if (product.suggestionType === 'genre') {
      setSearch(product.name);
      setSearchOpen(false);
      params.set('genre', product._id);
      navigate(`/?${params.toString()}`);
      return;
    }
    if (product.suggestionType === 'artist') {
      setSearch(product.name);
      setSearchOpen(false);
      params.set('artist', product._id);
      navigate(`/?${params.toString()}`);
      return;
    }
    setSearch(product.album_title || product.name || '');
    setSearchOpen(false);
    navigate(`/products/${product._id}`);
  };

  const updateFilter = (name, value) => {
    const params = new URLSearchParams(location.search);
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete('page');
    navigate(`/?${params.toString()}`);
  };

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <AppBar className="recordia-navbar" position="static" color="primary" elevation={0}>
      <Toolbar className="recordia-toolbar" sx={{ flexWrap: 'wrap', gap: { xs: 0.5, sm: 2 }, justifyContent: 'space-between', py: 1 }}>
        <Button className="recordia-logo" color="inherit" component={RouterLink} startIcon={<AlbumOutlinedIcon />} to="/">
          <span>Recordia</span>
          <small>EST. 2024</small>
        </Button>
        <Stack className="recordia-nav-links" direction="row" alignItems="center" flexWrap="wrap" justifyContent="flex-end" spacing={{ xs: 0, sm: 1 }} sx={{ flex: 1, minWidth: 0 }}>
          <Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/">Home</Button>
          <Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/collections/accessories" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>Merch</Button>
          <Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/genres" sx={{ display: { xs: 'none', lg: 'inline-flex' } }}>Genres</Button>
          <Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/artists" sx={{ display: { xs: 'none', lg: 'inline-flex' } }}>Artists</Button>
          <Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/about" sx={{ display: { xs: 'none', md: 'inline-flex' } }}>About</Button>
          <Box component="form" className={`recordia-search ${searchOpen ? 'is-open' : ''}`} onSubmit={submitSearch}>
            <InputBase
              aria-label="Search records"
              className="recordia-search-input"
              placeholder="Search records"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setSearchOpen(true)}
            />
            <IconButton className="recordia-icon-link" color="inherit" onClick={() => setSearchOpen((open) => !open)} aria-label="Search records">
              <SearchIcon />
            </IconButton>
            {searchOpen && matches.length > 0 && <Box className="search-suggestions">
              {matches.map((product) => <Button key={`${product.suggestionType}-${product._id}`} onClick={() => chooseSuggestion(product)}>
                <span>{product.album_title || product.name}</span><small>{product.suggestionType === 'genre' ? 'Genre' : product.suggestionType === 'artist' ? 'Artist' : product.artist?.name || product.category || 'Recordia shelf'}</small>
              </Button>)}
            </Box>}
            {searchOpen && <IconButton className="recordia-filter-button" color="inherit" onClick={(event) => setFilterAnchor(event.currentTarget)} aria-label="Filter products">
              <TuneIcon />
            </IconButton>}
          </Box>
          {user?.role === 'admin' && (
            <Button className="recordia-nav-link control-room-link" color="inherit" component={RouterLink} to="/admin/dashboard">
              Control room
            </Button>
          )}
          {user?.role === 'user' && <Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/orders">Purchase history</Button>}
          {user?.role !== 'admin' && <Tooltip title={user ? 'Your profile' : 'Log in'}>
            <IconButton className="recordia-icon-link" color="inherit" component={RouterLink} to={user ? '/profile' : '/login'} aria-label={user ? 'Your profile' : 'Log in'}>
              <PersonOutlineIcon />
            </IconButton>
          </Tooltip>}
          {user?.role !== 'admin' && <Tooltip title="Shopping bag">
            <IconButton className="recordia-icon-link" color="inherit" component={RouterLink} to="/cart" aria-label="Shopping bag">
              <ShoppingBagOutlinedIcon /><span className="cart-badge">{user ? itemCount : 0}</span>
            </IconButton>
          </Tooltip>}
          {user?.role === 'admin' ? <Button className="recordia-nav-link" color="inherit" onClick={() => { logout(); navigate('/'); }}>Logout</Button>
            : user ? <Button className="recordia-nav-link" color="inherit" onClick={() => { logout(); navigate('/'); }}>Logout</Button>
              : <Stack className="auth-links" direction="row" flexWrap="nowrap"><Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/login">Login</Button><Button className="recordia-nav-link" color="inherit" component={RouterLink} to="/register">Register</Button></Stack>}
        </Stack>
      </Toolbar>
      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack className="navbar-filters" spacing={1.5}>
          <Typography className="eyebrow">REFINE THE CRATE</Typography>
          {filterError && <Alert severity="error">{filterError}</Alert>}
          <FormControl size="small"><Select displayEmpty value={new URLSearchParams(location.search).get('genre') || ''} onChange={(event) => updateFilter('genre', event.target.value)}><MenuItem value="">All genres</MenuItem>{options.genres.map((genre) => <MenuItem key={genre._id} value={genre._id}>{genre.name}</MenuItem>)}</Select></FormControl>
          <FormControl size="small"><Select displayEmpty value={new URLSearchParams(location.search).get('artist') || ''} onChange={(event) => updateFilter('artist', event.target.value)}><MenuItem value="">All artists</MenuItem>{options.artists.map((artist) => <MenuItem key={artist._id} value={artist._id}>{artist.name}</MenuItem>)}</Select></FormControl>
          <FormControl size="small"><Select displayEmpty value={new URLSearchParams(location.search).get('merch_type') || ''} onChange={(event) => updateFilter('merch_type', event.target.value)}><MenuItem value="">All formats</MenuItem>{options.merchTypes.map((merchType) => <MenuItem key={merchType} value={merchType}>{merchType}</MenuItem>)}</Select></FormControl>
          <FormControl size="small"><Select displayEmpty value={new URLSearchParams(location.search).get('reviews[gte]') || ''} onChange={(event) => updateFilter('reviews[gte]', event.target.value)}><MenuItem value="">Any reviews</MenuItem>{[1, 5, 10, 25].map((count) => <MenuItem key={count} value={count}>{count}+ reviews</MenuItem>)}</Select></FormControl>
          <Button onClick={() => { navigate('/'); setFilterAnchor(null); }}>Clear filters</Button>
        </Stack>
      </Popover>
    </AppBar>
  );
}
