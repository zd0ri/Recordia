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
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../api/axios';

const schema = Yup.object({
  name: Yup.string().trim().required('Artist name is required'),
  bio: Yup.string().max(2000, 'Bio cannot exceed 2000 characters'),
});

export default function Artists() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const loadArtists = async () => {
    try {
      const { data } = await api.get('/artists');
      setRows((data.artists || []).map((artist) => ({ ...artist, id: artist._id })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load artists');
    }
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
        <Button variant="contained" onClick={() => setEditing({ _id: null, name: '', bio: '' })}>Add artist</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={[
            { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
            { field: 'bio', headerName: 'Bio', flex: 2, minWidth: 260 },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 190,
              sortable: false,
              renderCell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => setEditing(row)}>Edit</Button>
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
          initialValues={{ name: editing?.name || '', bio: editing?.bio || '' }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting, setFieldError }) => {
            setError('');
            try {
              const response = editing._id
                ? await api.put(`/admin/artist/${editing._id}`, values)
                : await api.post('/admin/artist', values);
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
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
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
