import { Button, Card, CardActions, CardContent, CardMedia, Rating, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia component="img" height="220" image={product.images?.[0]?.url || 'https://placehold.co/500x500?text=Recordia'} alt={product.album_title} />
      <CardContent sx={{ flex: 1 }}>
        <Typography gutterBottom variant="h6">{product.album_title}</Typography>
        <Typography color="text.secondary">{product.artist?.name}</Typography>
        <Rating readOnly size="small" value={Number(product.ratings || 0)} precision={0.5} />
        <Typography color="primary" variant="h6">${Number(product.price || 0).toFixed(2)}</Typography>
      </CardContent>
      <CardActions>
        <Button component={RouterLink} to={`/products/${product._id}`}>Details</Button>
        <Button disabled={!product.stocks} onClick={() => addToCart(product)}>Add to cart</Button>
      </CardActions>
    </Card>
  );
}
