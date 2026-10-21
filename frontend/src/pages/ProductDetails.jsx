import { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Rating,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';

const reviewSchema = Yup.object({
  rating: Yup.number().min(1).max(5).required('Rating is required'),
  comment: Yup.string().trim().required('Comment is required'),
});

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewImage, setReviewImage] = useState(null);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showSuccess } = useSnackbar();

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const { data } = await api.get(`/product/${id}`);
        setProduct(data.product);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load product');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const { data } = await api.get('/reviews', { params: { productId: id } });
        setReviews(data.reviews || []);
      } catch {
        setReviews([]);
      }

      if (!user) {
        setCanReview(false);
        return;
      }
      try {
        const { data } = await api.get('/review/can-review', { params: { productId: id } });
        setCanReview(Boolean(data.canReview));
      } catch {
        setCanReview(false);
      }
    };
    loadReviews();
  }, [id, user]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (loading || !product) return <Typography>Loading product...</Typography>;

  const images = product.images?.length ? product.images : [{ url: 'https://placehold.co/800x800?text=Recordia' }];
  const maxQuantity = Math.max(1, product.stocks || 0);
  const ownReview = reviews.find((review) => review.user?._id === user?._id || review.user === user?._id);
  const refreshReviews = async () => {
    const { data } = await api.get('/reviews', { params: { productId: id } });
    setReviews(data.reviews || []);
  };
  const handleAddToCart = () => {
    if (addToCart(product, quantity)) {
      showSuccess(`${product.album_title} added to your cart`);
    }
  };

  return (
    <Stack className="product-page" spacing={3}>
      <Button className="product-back-link" onClick={() => navigate(-1)}><ChevronLeft /> Back to collection</Button>
      <Paper className="product-showcase">
        <Stack className="product-showcase-layout" direction={{ xs: 'column', md: 'row' }} spacing={4}>
          <Box className="product-gallery">
            <Box className="product-image-frame">
              <Box component="img" src={images[imageIndex].url} alt={product.album_title} />
              <span className="product-image-label">SIDE A / {String(imageIndex + 1).padStart(2, '0')}</span>
              {images.length > 1 && <><IconButton aria-label="Previous image" className="gallery-arrow gallery-arrow-left" onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)}><ChevronLeft /></IconButton><IconButton aria-label="Next image" className="gallery-arrow gallery-arrow-right" onClick={() => setImageIndex((imageIndex + 1) % images.length)}><ChevronRight /></IconButton></>}
            </Box>
            {images.length > 1 && <Stack className="product-thumbnails" direction="row">
              {images.map((image, index) => <button className={index === imageIndex ? 'is-active' : ''} key={image.url} type="button" onClick={() => setImageIndex(index)} aria-label={`View image ${index + 1}`}><img src={image.url} alt="" /></button>)}
            </Stack>}
          </Box>
          <Stack className="product-copy" spacing={2}>
            <Typography className="eyebrow">NOW SPINNING / CATALOGUE NO. {String(product._id).slice(-6).toUpperCase()}</Typography>
            <Typography className="product-title" variant="h2">{product.album_title}</Typography>
            <Typography className="product-artist" variant="h6">{product.artist?.name} <span>·</span> {product.genre?.name}</Typography>
            <Typography className="product-price">₱{Number(product.price).toFixed(2)}</Typography>
            <Box className="product-rule" />
            <Typography className="product-description">{product.description}</Typography>
            <Box className="product-facts">
              <span>FORMAT <strong>{product.merch_type}</strong></span>
              <span>CONDITION <strong>ARCHIVE READY</strong></span>
            </Box>
            <Typography className={`product-stock ${product.stocks > 0 ? 'in-stock' : 'out-stock'}`}>{product.stocks > 0 ? `${product.stocks} copies in the crate` : 'Out of stock'}</Typography>
            <Stack className="product-buy-row" direction="row" spacing={1.5}>
              <Select className="retro-quantity" size="small" value={quantity} disabled={!product.stocks} onChange={(event) => setQuantity(event.target.value)}>
                {Array.from({ length: maxQuantity }, (_, index) => <MenuItem key={index + 1} value={index + 1}>{index + 1}</MenuItem>)}
              </Select>
              <Button className="retro-add-button" disabled={!product.stocks} variant="contained" onClick={handleAddToCart}>
                Add to crate
              </Button>
            </Stack>
            <Typography className="product-note">Free shipping on orders over ₱3,000 <span>✦</span> Packed with care</Typography>
          </Stack>
        </Stack>
      </Paper>
      <Paper className="reviews-panel" sx={{ p: 3 }}>
        <Typography gutterBottom variant="h4">Reviews</Typography>
        {!reviews.length && <Typography color="text.secondary">No reviews yet.</Typography>}
        <Stack spacing={2}>
          {reviews.map((review) => (
            <Box key={review._id}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Typography fontWeight={700}>{review.name}</Typography>
                <Rating readOnly size="small" value={review.rating} />
                <Typography color="text.secondary" variant="caption">
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Date unavailable'}
                </Typography>
              </Stack>
              <Typography>{review.comment}</Typography>
            </Box>
          ))}
        </Stack>
        {user && canReview ? (
          <Formik
            enableReinitialize
            initialValues={{ rating: ownReview?.rating || 0, comment: ownReview?.comment || '' }}
            validationSchema={reviewSchema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              try {
                const formData = new FormData();
                formData.append('rating', values.rating);
                formData.append('comment', values.comment);
                formData.append('productId', id);
                if (reviewImage) formData.append('image', reviewImage);
                await api.put('/review', formData);
                await refreshReviews();
                setReviewImage(null);
                setStatus('');
              } catch (requestError) {
                setStatus(requestError.response?.data?.message || 'Unable to save review');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ errors, touched, isSubmitting, setFieldValue, values, status }) => (
              <Form>
                <Stack spacing={2} sx={{ mt: 3 }}>
                  {status && <Alert severity="error">{status}</Alert>}
                  <Typography variant="h6">{ownReview ? 'Edit your review' : 'Write a review'}</Typography>
                  <Rating value={values.rating} onChange={(_, value) => setFieldValue('rating', value || 0)} />
                  {touched.rating && errors.rating && <Typography color="error" variant="caption">{errors.rating}</Typography>}
                  <Field as={TextField} fullWidth multiline minRows={3} name="comment" label="Comment" error={touched.comment && !!errors.comment} helperText={touched.comment && errors.comment} />
                  <Button component="label" variant="outlined">
                    {reviewImage ? reviewImage.name : 'Add review image'}
                    <input hidden type="file" accept="image/png,image/jpeg" onChange={(event) => setReviewImage(event.target.files?.[0] || null)} />
                  </Button>
                  <Stack direction="row" spacing={1}>
                    <Button disabled={isSubmitting} type="submit" variant="contained">{ownReview ? 'Update review' : 'Submit review'}</Button>
                    {ownReview && <Button color="error" disabled={isSubmitting} onClick={async () => { await api.delete('/review/me', { params: { productId: id } }); await refreshReviews(); }}>Delete review</Button>}
                  </Stack>
                </Stack>
              </Form>
            )}
          </Formik>
        ) : (
          <Typography color="text.secondary" sx={{ mt: 3 }}>
            {user ? 'You can review this product after completing an order for it.' : 'Log in and complete an order to review this product.'}
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}
