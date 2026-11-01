import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, Link, Paper, Stack, Tab, Tabs, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState({});
  const [unavailableProducts, setUnavailableProducts] = useState({});
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      try {
        const { data } = await api.get('/orders/me');
        const customerOrders = data.orders || [];
        if (cancelled) return;
        setOrders(customerOrders);
        const productIds = [...new Set(customerOrders.flatMap((order) => order.orderItems.map((item) => String(item.product))))];
        const results = await Promise.allSettled(productIds.map((productId) => (
          api.get('/reviews', { params: { productId } })
        )));
        const reviewEntries = [];
        const missingProducts = {};
        const reviewErrors = [];

        results.forEach((result, index) => {
          const productId = productIds[index];
          if (result.status === 'fulfilled') {
            reviewEntries.push(...(result.value.data.reviews || [])
              .filter((review) => String(review.user?._id || review.user) === String(user?._id))
              .map((review) => [`${review.order?._id || review.order}:${productId}`, review]));
          } else if (result.reason.response?.status === 404
            && result.reason.response?.data?.message === 'Product not found') {
            missingProducts[productId] = true;
          } else {
            reviewErrors.push(
              result.reason.response?.data?.message || 'Unable to load your review history',
            );
          }
        });

        if (!cancelled) {
          setReviews(Object.fromEntries(reviewEntries));
          setUnavailableProducts(missingProducts);
          if (reviewErrors.length) setReviewError([...new Set(reviewErrors)].join('. '));
        }
      } catch (requestError) {
        if (!cancelled) setError(requestError.response?.data?.message || 'Unable to load orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadHistory();
    return () => { cancelled = true; };
  }, [user?._id]);

  const purchases = useMemo(() => orders.flatMap((order) => order.orderItems.map((item) => ({
    ...item,
    orderId: order._id,
    orderStatus: order.orderStatus,
  }))), [orders]);

  return (
    <Stack className="account-page purchase-history-page" spacing={2}>
      <Box className="account-page-heading">
        <Box>
          <Typography className="account-eyebrow">RECORDIA / YOUR ARCHIVE</Typography>
          <Typography className="account-page-title" variant="h2">Purchase history</Typography>
          <Typography className="account-page-subtitle">Every good find has a story. Revisit your orders and reviews.</Typography>
        </Box>
        <Box className="account-record-mark" aria-hidden="true"><span /></Box>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {reviewError && <Alert severity="error">{reviewError}</Alert>}
      {loading && <Typography>Loading purchase history...</Typography>}
      <Tabs className="account-tabs" value={tab} onChange={(_, value) => setTab(value)} aria-label="Purchase history tabs">
        <Tab label="Orders" />
        <Tab label="Purchases & reviews" />
      </Tabs>
      {tab === 0 && (
        <Stack spacing={2}>
          {!loading && !orders.length && !error && <Typography>No orders yet.</Typography>}
          {orders.map((order) => (
            <Paper className="account-order-card" key={order._id}>
              <Box className="account-order-stamp" aria-hidden="true">R</Box>
              <Stack className="account-order-content" alignItems="center" direction="row" flexWrap="wrap" gap={2} justifyContent="space-between">
                <Box className="account-order-id">
                  <Typography className="account-panel-kicker">ORDER SLIP</Typography>
                  <Link component={RouterLink} to={`/orders/${order._id}`}>#{order._id.slice(-8)}</Link>
                </Box>
                <Chip className={`account-status-chip status-${order.orderStatus?.toLowerCase()}`} label={order.orderStatus} />
                <Box className="account-order-meta">
                  <Typography className="account-panel-kicker">PAYMENT</Typography>
                  <Typography>{order.paymentInfo?.method || '—'}</Typography>
                </Box>
                <Box className="account-order-total">
                  <Typography className="account-panel-kicker">TOTAL</Typography>
                  <Typography>₱{Number(order.totalPrice).toFixed(2)}</Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
      {tab === 1 && (
        <Stack spacing={2}>
          {!loading && !purchases.length && !error && <Typography>No purchases yet.</Typography>}
          {purchases.map((item, index) => {
            const productId = String(item.product);
            const review = reviews[`${item.orderId}:${productId}`];
            const completed = item.orderStatus === 'Completed';
            const unavailable = unavailableProducts[productId];
            return (
              <Paper className="account-purchase-card" key={`${item.orderId}-${productId}-${index}`}>
                <Box className="account-purchase-art" aria-hidden="true"><span /></Box>
                <Stack className="account-purchase-copy">
                    <Typography fontWeight={700}>{item.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      Order #{item.orderId.slice(-8)} · {item.orderStatus}
                    </Typography>
                </Stack>
                <Chip className={`account-status-chip status-${item.orderStatus?.toLowerCase()}`} label={item.orderStatus} />
                  <Button
                    className={review ? 'account-outline-button' : 'account-primary-button'}
                    component={RouterLink}
                    to={`/products/${productId}?review=1&orderId=${item.orderId}`}
                    disabled={!completed || unavailable}
                    variant={review ? 'outlined' : 'contained'}
                  >
                    {unavailable
                      ? 'Product unavailable'
                      : review                       ? 'View review' : completed ? 'Give review' : 'Review after completion'}
                  </Button>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
