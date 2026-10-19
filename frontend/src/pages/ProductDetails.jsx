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

  return (
    <Stack spacing={3}>
      <Button onClick={() => navigate(-1)} sx={{ alignSelf: 'flex-start' }}>Back to collection</Button>
      <Paper sx={{ p: { xs: 2, md: 4 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          <Box sx={{ position: 'relative', width: { xs: '100%', md: '48%' } }}>
            <Box component="img" src={images[imageIndex].url} alt={product.album_title} sx={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
            {images.length > 1 && <><IconButton onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)} sx={{ position: 'absolute', left: 8, top: '50%', bgcolor: 'background.paper' }}><ChevronLeft /></IconButton><IconButton onClick={() => setImageIndex((imageIndex + 1) % images.length)} sx={{ position: 'absolute', right: 8, top: '50%', bgcolor: 'background.paper' }}><ChevronRight /></IconButton></>}
          </Box>
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Typography variant="h2">{product.album_title}</Typography>
            <Typography color="text.secondary" variant="h6">{product.artist?.name} · {product.genre?.name}</Typography>
            <Typography color="primary" variant="h4">₱{Number(product.price).toFixed(2)}</Typography>
            <Typography>{product.description}</Typography>
            <Typography>Merchandise: {product.merch_type}</Typography>
            <Typography color={product.stocks > 0 ? 'success.main' : 'error.main'}>{product.stocks > 0 ? `${product.stocks} in stock` : 'Out of stock'}</Typography>
            <Stack direction="row" spacing={2}>
              <Select size="small" value={quantity} disabled={!product.stocks} onChange={(event) => setQuantity(event.target.value)}>
                {Array.from({ length: maxQuantity }, (_, index) => <MenuItem key={index + 1} value={index + 1}>{index + 1}</MenuItem>)}
              </Select>
              <Button disabled={!product.stocks} variant="contained" onClick={() => addToCart(product, quantity)}>
                Add to cart
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
      <Paper sx={{ p: 3 }}>
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
