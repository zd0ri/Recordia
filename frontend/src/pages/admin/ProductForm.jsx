import { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

const merchTypes = ['Vinyl', 'T-Shirt', 'Poster', 'Tote Bag', 'Accessory', 'Other'];

const schema = Yup.object({
  album_title: Yup.string().trim().required('Album title is required'),
  artist: Yup.string().required('Artist is required'),
  genre: Yup.string().required('Genre is required'),
  merch_type: Yup.string().oneOf(merchTypes).required('Merchandise type is required'),
  price: Yup.number().typeError('Price must be a number').min(0, 'Price cannot be negative').required('Price is required'),
  description: Yup.string().trim().required('Description is required'),
  stocks: Yup.number().typeError('Stocks must be a number').integer('Stocks must be a whole number').min(0, 'Stocks cannot be negative').required('Stocks are required'),
});

const emptyValues = {
  album_title: '',
  artist: '',
  genre: '',
  merch_type: '',
  price: '',
  description: '',
  stocks: '',
  images: [],
};

const readFilesAsBase64 = (files) => Promise.all(
  Array.from(files).map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })),
);

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [artists, setArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [initialValues, setInitialValues] = useState(emptyValues);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const requests = [api.get('/artists'), api.get('/genres')];
        if (editing) requests.push(api.get(`/product/${id}`));
        const responses = await Promise.all(requests);
        setArtists(responses[0].data.artists || []);
        setGenres(responses[1].data.genres || []);
        if (editing) {
          const product = responses[2].data.product;
          setInitialValues({
            album_title: product.album_title || '',
            artist: product.artist?._id || product.artist || '',
            genre: product.genre?._id || product.genre || '',
            merch_type: product.merch_type || '',
            price: product.price ?? '',
            description: product.description || '',
            stocks: product.stocks ?? '',
            images: [],
          });
          setPreviews((product.images || []).map((image) => image.url));
        }
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load product data');
      } finally {
        setLoading(false);
      }
    };
    loadOptions();
  }, [editing, id]);

  if (loading) return <Typography>Loading product...</Typography>;

  return (
    <Paper sx={{ maxWidth: 900, mx: 'auto', p: { xs: 3, md: 5 } }}>
      <Typography gutterBottom variant="h3">
        {editing ? 'Edit product' : 'Create product'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          setError('');
          try {
            const payload = { ...values };
            if (!payload.images.length) delete payload.images;
            const response = editing
              ? await api.put(`/admin/product/${id}`, payload)
              : await api.post('/admin/product/new', payload);
            if (response.data.success) navigate('/admin/products');
          } catch (submitError) {
            setError(submitError.response?.data?.message || 'Unable to save product');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting, setFieldValue, values }) => (
          <Form>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Field as={TextField} fullWidth name="album_title" label="Album title" error={touched.album_title && !!errors.album_title} helperText={touched.album_title && errors.album_title} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Field as={TextField} fullWidth select name="artist" label="Artist" error={touched.artist && !!errors.artist} helperText={touched.artist && errors.artist}>
                  {artists.map((artist) => <MenuItem key={artist._id} value={artist._id}>{artist.name}</MenuItem>)}
                </Field>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Field as={TextField} fullWidth select name="genre" label="Genre" error={touched.genre && !!errors.genre} helperText={touched.genre && errors.genre}>
                  {genres.map((genre) => <MenuItem key={genre._id} value={genre._id}>{genre.name}</MenuItem>)}
                </Field>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Field as={TextField} fullWidth select name="merch_type" label="Merchandise type" error={touched.merch_type && !!errors.merch_type} helperText={touched.merch_type && errors.merch_type}>
                  {merchTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Field>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Field as={TextField} fullWidth name="price" label="Price" type="number" inputProps={{ min: 0, step: '0.01' }} error={touched.price && !!errors.price} helperText={touched.price && errors.price} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Field as={TextField} fullWidth name="stocks" label="Stocks" type="number" inputProps={{ min: 0, step: 1 }} error={touched.stocks && !!errors.stocks} helperText={touched.stocks && errors.stocks} />
              </Grid>
              <Grid size={12}>
                <Field as={TextField} fullWidth multiline minRows={4} name="description" label="Description" error={touched.description && !!errors.description} helperText={touched.description && errors.description} />
              </Grid>
              <Grid size={12}>
                <Stack spacing={1}>
                  <Typography variant="subtitle1">
                    {editing ? 'Replace images (optional)' : 'Images (optional)'}
                  </Typography>
                  <Button component="label" variant="outlined">
                    Choose multiple images
                    <input
                      hidden
                      accept="image/jpeg,image/png"
                      type="file"
                      multiple
                      onChange={async (event) => {
                        const files = event.currentTarget.files;
                        if (!files?.length) return;
                        try {
                          const images = await readFilesAsBase64(files);
                          setFieldValue('images', images);
                          setPreviews(images);
                        } catch {
                          setError('Unable to read selected images');
                        }
                      }}
                    />
                  </Button>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {previews.map((preview, index) => (
                      <img key={`${preview}-${index}`} src={preview} alt={`Product preview ${index + 1}`} width="96" height="96" style={{ objectFit: 'cover' }} />
                    ))}
                  </Stack>
                  {editing && values.images.length > 0 && (
                    <Typography color="text.secondary" variant="caption">
                      Saving these new images will replace the existing image set.
                    </Typography>
                  )}
                </Stack>
              </Grid>
            </Grid>
            <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
              <Button onClick={() => navigate('/admin/products')}>Cancel</Button>
              <Button disabled={isSubmitting} type="submit" variant="contained">
                {isSubmitting ? 'Saving...' : 'Save product'}
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </Paper>
  );
}
