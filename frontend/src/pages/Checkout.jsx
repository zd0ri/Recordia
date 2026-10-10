import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Alert, Button, FormControl, FormControlLabel, FormLabel, Paper, Radio, RadioGroup, Stack, TextField, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
  const { items, itemsPrice } = useCart();
  const navigate = useNavigate();
  const tax = Number((itemsPrice * 0.12).toFixed(2));

  if (!items.length) return <Alert severity="info">Your cart is empty.</Alert>;

  return (
    <Paper sx={{ maxWidth: 850, mx: 'auto', p: { xs: 3, md: 5 } }}>
      <Typography gutterBottom variant="h2">Checkout</Typography>
      <Formik
        initialValues={{ address: '', city: '', postalCode: '', country: '', phoneNo: '', method: 'COD' }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          try {
            const { data } = await api.post('/order/new', {
              orderItems: items.map((item) => ({ product: item.product, quantity: item.quantity })),
              shippingInfo: {
                address: values.address,
                city: values.city,
                postalCode: values.postalCode,
                country: values.country,
                phoneNo: values.phoneNo,
              },
              paymentInfo: { method: values.method },
            });
            navigate(`/order-success/${data.order._id}`);
          } catch (error) {
            setStatus(error.response?.data?.message || 'Unable to place order');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting, status, values, setFieldValue }) => (
          <Form>
            <Stack spacing={2}>
              {status && <Alert severity="error">{status}</Alert>}
              {['address', 'city', 'postalCode', 'country', 'phoneNo'].map((name) => (
                <Field key={name} as={TextField} name={name} label={name === 'phoneNo' ? 'Phone number' : name.replace(/^./, (letter) => letter.toUpperCase())} error={touched[name] && !!errors[name]} helperText={touched[name] && errors[name]} />
              ))}
              <FormControl>
                <FormLabel>Payment method</FormLabel>
                <RadioGroup row value={values.method} onChange={(event) => setFieldValue('method', event.target.value)}>
                  <FormControlLabel value="COD" control={<Radio />} label="Cash on delivery" />
                  <FormControlLabel value="GCash" control={<Radio />} label="GCash" />
                </RadioGroup>
              </FormControl>
              <Typography>Items: ${itemsPrice.toFixed(2)}</Typography>
              <Typography>Tax: ${tax.toFixed(2)}</Typography>
              <Typography variant="h5">Estimated total: ${(itemsPrice + tax).toFixed(2)}</Typography>
              <Button disabled={isSubmitting} type="submit" variant="contained">{isSubmitting ? 'Placing order...' : 'Confirm order'}</Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </Paper>
  );
}
