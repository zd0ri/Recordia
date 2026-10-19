import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Alert, Box, Button, Divider, FormControl, FormControlLabel, FormLabel, Paper, Radio, RadioGroup, Stack, TextField, Typography,
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';

const schema = Yup.object({
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  postalCode: Yup.string().required('Postal code is required'),
  country: Yup.string().required('Country is required'),
  phoneNo: Yup.string().required('Phone number is required'),
  method: Yup.string().oneOf(['GCash', 'COD']).required('Payment method is required'),
});

export default function Checkout() {
  const { items, removeItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const selectedIds = location.state?.productIds;
  const checkoutItems = selectedIds?.length
    ? items.filter((item) => selectedIds.includes(item.product))
    : items;
  const itemsPrice = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Number((itemsPrice * 0.12).toFixed(2));

  if (!checkoutItems.length) return <Alert severity="info">Choose at least one record before checkout.</Alert>;

  return (
    <Paper className="retro-checkout-panel" sx={{ maxWidth: 1040, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Box className="retro-page-heading"><Typography className="eyebrow">LAST STOP BEFORE THE NEEDLE DROPS</Typography><Typography gutterBottom variant="h2">Checkout</Typography><Typography>Pack your records carefully. We will handle the rest.</Typography></Box>
      <Formik
        initialValues={{ address: '', city: '', postalCode: '', country: '', phoneNo: '', method: 'COD' }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          try {
            const { data } = await api.post('/order/new', {
              orderItems: checkoutItems.map((item) => ({ product: item.product, quantity: item.quantity })),
              shippingInfo: {
                address: values.address,
                city: values.city,
                postalCode: values.postalCode,
                country: values.country,
                phoneNo: values.phoneNo,
              },
              paymentInfo: { method: values.method },
            });
            removeItems(checkoutItems.map((item) => item.product));
            navigate(`/order-success/${data.order._id}`, {
              state: { emailWarning: data.warning },
            });
          } catch (error) {
            setStatus(error.response?.data?.message || 'Unable to place order');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting, status, values, setFieldValue }) => (
          <Form>
            <Box className="retro-checkout-grid">
              <Stack className="retro-checkout-form" spacing={2}>
              {status && <Alert severity="error">{status}</Alert>}
              <Typography className="retro-form-heading"><LocalShippingOutlinedIcon /> Shipping details</Typography>
              <Box className="retro-shipping-fields">
                {['address', 'city', 'postalCode', 'country', 'phoneNo'].map((name) => (
                  <Field key={name} as={TextField} name={name} label={name === 'phoneNo' ? 'Phone number' : name.replace(/^./, (letter) => letter.toUpperCase())} error={touched[name] && !!errors[name]} helperText={touched[name] && errors[name]} />
                ))}
              </Box>
              <FormControl className="retro-payment-card">
                <FormLabel><PaymentOutlinedIcon /> Payment method</FormLabel>
                <RadioGroup value={values.method} onChange={(event) => setFieldValue('method', event.target.value)}>
                  <FormControlLabel value="COD" control={<Radio />} label="Cash on delivery" />
                  <FormControlLabel value="GCash" control={<Radio />} label="GCash" />
                </RadioGroup>
              </FormControl>
              <Button className="retro-confirm-button" disabled={isSubmitting} type="submit" variant="contained">{isSubmitting ? 'Placing order...' : 'Confirm order'}</Button>
            </Stack>
            <Box className="retro-checkout-aside">
              <Typography className="eyebrow">YOUR RECORDS</Typography>
              <Box className="retro-checkout-items">
                {checkoutItems.map((item) => (
                  <Box className="retro-checkout-item" key={item.product}>
                    <Box component="img" src={item.image || 'https://placehold.co/64x64?text=Vinyl'} alt={item.name} />
                    <Box><Typography>{item.name}</Typography><small>{item.quantity} × ₱{Number(item.price).toFixed(2)}</small></Box>
                    <strong>₱{(item.price * item.quantity).toFixed(2)}</strong>
                  </Box>
                ))}
              </Box>
              <Divider />
              <Box className="retro-checkout-totals">
                <Typography><span>Items</span><strong>₱{itemsPrice.toFixed(2)}</strong></Typography>
                <Typography><span>Tax</span><strong>₱{tax.toFixed(2)}</strong></Typography>
                <Typography className="retro-checkout-total"><span>Total</span><strong>₱{(itemsPrice + tax).toFixed(2)}</strong></Typography>
              </Box>
              <Typography className="retro-checkout-note">Your order will be checked, packed, and sent with care.</Typography>
            </Box>
            </Box>
          </Form>
        )}
      </Formik>
    </Paper>
  );
}
