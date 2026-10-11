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
  name: Yup.string().trim().required('Genre name is required'),
});

export default function Genres() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const loadGenres = async () => {
    try {
      const { data } = await api.get('/genres');
      setRows((data.genres || []).map((genre) => ({ ...genre, id: genre._id })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load genres');
    }
  };

  useEffect(() => {
    // The async loader updates state after the request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGenres();
  }, []);

  const deleteGenre = async (id) => {
    if (!window.confirm('Delete this genre?')) return;
    try {
      await api.delete(`/admin/genre/${id}`);
      setRows((current) => current.filter((row) => row._id !== id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete genre');
    }
  };

  return (
    <Box>
      <Stack alignItems={{ xs: 'stretch', sm: 'center' }} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h3">Genres</Typography>
        <Button variant="contained" onClick={() => setEditing({ _id: null, name: '' })}>Add genre</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={[
            { field: 'name', headerName: 'Name', flex: 1, minWidth: 220 },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 190,
              sortable: false,
              renderCell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => setEditing(row)}>Edit</Button>
                  <Button color="error" size="small" onClick={() => deleteGenre(row._id)}>Delete</Button>
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
        <DialogTitle>{editing?._id ? 'Edit genre' : 'Add genre'}</DialogTitle>
        <Formik
          enableReinitialize
          initialValues={{ name: editing?.name || '' }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting, setFieldError }) => {
            setError('');
            try {
              const response = editing._id
                ? await api.put(`/admin/genre/${editing._id}`, values)
                : await api.post('/admin/genre', values);
              const genre = { ...response.data.genre, id: response.data.genre._id };
              setRows((current) => editing._id
                ? current.map((row) => (row._id === genre._id ? genre : row))
                : [...current, genre]);
              setEditing(null);
            } catch (requestError) {
              const message = requestError.response?.data?.message || 'Unable to save genre';
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
                <Field
                  as={TextField}
                  autoFocus
                  fullWidth
                  name="name"
                  label="Genre name"
                  error={touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                />
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
