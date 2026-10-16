import { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../api/axios';

const schema = Yup.object({
  name: Yup.string().trim().required('Artist name is required'),
  bio: Yup.string().max(2000, 'Bio cannot exceed 2000 characters'),
});

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function Artists() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const loadArtists = async () => {
    try {
      const { data } = await api.get('/artists');
      setRows((data.artists || []).map((artist) => ({ ...artist, id: artist._id })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load artists');
    }
  };

  const openArtistEditor = (artist) => {
    setSelectedFile(null);
    setEditing(artist);
  };

  useEffect(() => {
    // The async loader updates state after the request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadArtists();
  }, []);

  const deleteArtist = async (id) => {
    if (!window.confirm('Delete this artist?')) return;
    try {
      await api.delete(`/admin/artist/${id}`);
      setRows((current) => current.filter((row) => row._id !== id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete artist');
    }
  };

  return (
    <Box>
      <Stack alignItems={{ xs: 'stretch', sm: 'center' }} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h3">Artists</Typography>
        <Button variant="contained" onClick={() => openArtistEditor({ _id: null, name: '', bio: '' })}>Add artist</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={[
            {
              field: 'image',
              headerName: 'Image',
              width: 90,
              sortable: false,
              renderCell: ({ row }) => (
                row.image?.url
                  ? <Box component="img" src={row.image.url} alt={row.name} sx={{ height: 42, objectFit: 'cover', width: 42 }} />
                  : <Button size="small" onClick={() => openArtistEditor(row)}>Upload image</Button>
              ),
            },
            { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
            { field: 'bio', headerName: 'Bio', flex: 2, minWidth: 260 },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 190,
              sortable: false,
              renderCell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => openArtistEditor(row)}>Edit</Button>
                  <Button color="error" size="small" onClick={() => deleteArtist(row._id)}>Delete</Button>
                </Stack>
              ),
            },
          ]}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        />
      </Box>
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editing?._id ? 'Edit artist' : 'Add artist'}</DialogTitle>
        <Formik
          enableReinitialize
          initialValues={{ name: editing?.name || '', bio: editing?.bio || '', image: '', removeImage: false }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting, setFieldError }) => {
            setError('');
            try {
              const payload = new FormData();
              payload.append('name', values.name);
              payload.append('bio', values.bio);
              payload.append('removeImage', String(values.removeImage));
              if (selectedFile) payload.append('image', selectedFile);
              const response = editing._id
                ? await api.put(`/admin/artist/${editing._id}`, payload)
                : await api.post('/admin/artist', payload);
              const artist = { ...response.data.artist, id: response.data.artist._id };
              setRows((current) => editing._id
                ? current.map((row) => (row._id === artist._id ? artist : row))
                : [...current, artist]);
              setEditing(null);
            } catch (requestError) {
              const message = requestError.response?.data?.message || 'Unable to save artist';
              setError(message);
              setFieldError('name', message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ errors, touched, isSubmitting, setFieldValue, values }) => (
            <Form>
              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  {(editing?.image?.url && !values.removeImage && !values.image) && (
                    <Box sx={{ position: 'relative', width: 'fit-content' }}>
                      <Box component="img" src={editing.image.url} alt={`${editing.name} portrait`} sx={{ border: 2, borderColor: 'divider', borderRadius: 2, height: 120, objectFit: 'cover', width: 120 }} />
                      <IconButton
                        aria-label="Remove artist image"
                        onClick={() => setFieldValue('removeImage', true)}
                        size="small"
                        sx={{ bgcolor: 'background.paper', position: 'absolute', right: -10, top: -10 }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  {values.image && (
                    <Box sx={{ position: 'relative', width: 'fit-content' }}>
                      <Box component="img" src={values.image} alt="Selected artist preview" sx={{ border: 2, borderColor: 'primary.main', borderRadius: 2, height: 120, objectFit: 'cover', width: 120 }} />
                      <IconButton
                        aria-label="Remove selected artist image"
                        onClick={() => {
                          setSelectedFile(null);
                          setFieldValue('image', '');
                        }}
                        size="small"
                        sx={{ bgcolor: 'background.paper', position: 'absolute', right: -10, top: -10 }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  <Button component="label" variant="outlined">
                    {editing?.image && !values.image ? 'Replace artist image' : 'Choose artist image'}
                    <input
                      hidden
                      accept="image/jpeg,image/png"
                      type="file"
                      onChange={async (event) => {
                        const file = event.currentTarget.files?.[0];
                        if (!file) return;
                        try {
                          setSelectedFile(file);
                          setFieldValue('image', await readFileAsBase64(file));
                          setFieldValue('removeImage', false);
                        } catch {
                          setError('Unable to read artist image');
                        }
                      }}
                    />
                  </Button>
                  {values.image && <Typography color="text.secondary" variant="caption">Preview shown. Save to upload this image.</Typography>}
                  <Field
                    as={TextField}
                    autoFocus
                    fullWidth
                    name="name"
                    label="Artist name"
                    error={touched.name && !!errors.name}
                    helperText={touched.name && errors.name}
                  />
                  <Field
                    as={TextField}
                    fullWidth
                    multiline
                    minRows={4}
                    name="bio"
                    label="Bio"
                    error={touched.bio && !!errors.bio}
                    helperText={touched.bio && errors.bio}
                  />
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEditing(null)}>Cancel</Button>
                <Button disabled={isSubmitting} type="submit" variant="contained">Save</Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
}
