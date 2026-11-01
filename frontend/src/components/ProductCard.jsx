import { Button, Card, CardActions, CardContent, CardMedia, Rating, Typography } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showSuccess } = useSnackbar();
  const reviewCount = product.numOfReviews ?? product.reviews?.length ?? 0;

  const handleAddToCart = () => {
    if (addToCart(product)) {
      showSuccess(`${product.album_title} added to your cart`);
    }
  };

  return (
    <Card className="vinyl-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="vinyl-artwork">
        <div className="vinyl-disc" aria-hidden="true" />
        <CardMedia component="img" height="220" image={product.images?.[0]?.url || 'https://placehold.co/500x500?text=Recordia'} alt={product.album_title} />
      </div>
      <CardContent sx={{ flex: 1 }}>
        <Typography className="vinyl-card-title" gutterBottom variant="h6">{product.album_title}</Typography>
        <Typography color="text.secondary">{product.artist?.name || product.merch_type}</Typography>
        {reviewCount > 0
          ? <Rating readOnly size="small" value={Number(product.ratings || 0)} precision={0.5} />
          : <Typography color="text.secondary" variant="body2">No reviews yet</Typography>}
        <Typography className="vinyl-card-price" color="primary" variant="h6">₱{Number(product.price || 0).toFixed(2)}</Typography>
      </CardContent>
      <CardActions>
        <Button startIcon={<InfoOutlinedIcon />} component={RouterLink} to={`/products/${product._id}`}>Details</Button>
        {user?.role !== 'admin' && <Button startIcon={<AddShoppingCartIcon />} disabled={!product.stocks} onClick={handleAddToCart}>Add to cart</Button>}
      </CardActions>
    </Card>
  );
}
