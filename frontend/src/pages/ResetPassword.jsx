import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import api from '../api/axios';

const schema = Yup.object({
  password: Yup.string().min(6, 'Use at least 6 characters').required('New password is required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm your password'),
});

export default function ResetPassword() {
  const { token } = useParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  return (
    <Paper sx={{ maxWidth: 520, mx: 'auto', p: { xs: 3, md: 5 } }}>
      <Stack spacing={2}>
        <Typography variant="h3">Choose a new password</Typography>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Formik
          initialValues={{ password: '', confirmPassword: '' }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting }) => {
            setMessage('');
            setError('');
            try {
              await api.put(`/password/reset/${token}`, values);
              setMessage('Your password has been updated. You can now sign in.');
            } catch (requestError) {
              setError(requestError.response?.data?.message || requestError.response?.data?.error || 'Unable to reset your password');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Stack spacing={2}>
                <Field as={TextField} name="password" label="New password" type="password" error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
                <Field as={TextField} name="confirmPassword" label="Confirm new password" type="password" error={touched.confirmPassword && !!errors.confirmPassword} helperText={touched.confirmPassword && errors.confirmPassword} />
                <Button disabled={isSubmitting} type="submit" variant="contained">
                  {isSubmitting ? 'Updating password...' : 'Update password'}
                </Button>
                {message && <Button component={RouterLink} to="/login">Sign in</Button>}
              </Stack>
            </Form>
          )}
        </Formik>
      </Stack>
    </Paper>
  );
}
