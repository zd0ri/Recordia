import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../api/axios';

const schema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
});

const resetSchema = Yup.object({
  code: Yup.string().matches(/^\d{6}$/, 'Enter the 6-digit code').required('Reset code is required'),
  password: Yup.string().min(6, 'Use at least 6 characters').required('New password is required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm your password'),
});

export default function ForgotPassword() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  const [resending, setResending] = useState(false);

  const resendCode = async () => {
    setMessage('');
    setError('');
    setResending(true);
    try {
      const { data } = await api.post('/password/forgot', { email: submittedEmail });
      setMessage(data.message || 'If an account exists, a new reset code has been sent.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send a new reset code');
    } finally {
      setResending(false);
    }
  };

  return (
    <Paper sx={{ maxWidth: 520, mx: 'auto', p: { xs: 3, md: 5 } }}>
      <Stack spacing={2}>
        <Typography variant="h3">{submittedEmail ? 'Enter your reset code' : 'Reset your password'}</Typography>
        <Typography color="text.secondary">
          {submittedEmail
            ? `Enter the one-time code sent to ${submittedEmail} and choose a new password.`
            : 'We’ll email a one-time reset code to the email address on your account.'}
        </Typography>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {!submittedEmail ? (
          <Formik
            initialValues={{ email: '' }}
            validationSchema={schema}
            onSubmit={async (values, { setSubmitting }) => {
              setMessage('');
              setError('');
              try {
                const email = values.email.trim().toLowerCase();
                const { data } = await api.post('/password/forgot', { email });
                setSubmittedEmail(email);
                setMessage(data.message || 'If an account exists, a reset code has been sent.');
              } catch (requestError) {
                setError(requestError.response?.data?.message || requestError.response?.data?.error || 'Unable to send a password reset code');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Stack spacing={2}>
                  <Field as={TextField} name="email" label="Account email" type="email" autoComplete="email" error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
                  <Button disabled={isSubmitting} type="submit" variant="contained">
                    {isSubmitting ? 'Sending code...' : 'Send reset code'}
                  </Button>
                  <Button component={RouterLink} to="/login">Back to login</Button>
                </Stack>
              </Form>
            )}
          </Formik>
        ) : !resetComplete ? (
          <Formik
            initialValues={{ code: '', password: '', confirmPassword: '' }}
            validationSchema={resetSchema}
            onSubmit={async (values, { setSubmitting }) => {
              setMessage('');
              setError('');
              try {
                const { data } = await api.put('/password/reset', {
                  ...values,
                  email: submittedEmail,
                });
                setResetComplete(true);
                setMessage(data.message || 'Password reset. You can now sign in.');
              } catch (requestError) {
                setError(requestError.response?.data?.message || 'Unable to reset your password');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Stack spacing={2}>
                  <Field
                    as={TextField}
                    name="code"
                    label="6-digit email code"
                    inputProps={{ inputMode: 'numeric', maxLength: 6, pattern: '[0-9]{6}' }}
                    error={touched.code && !!errors.code}
                    helperText={touched.code && errors.code}
                  />
                  <Field as={TextField} name="password" label="New password" type="password" autoComplete="new-password" error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
                  <Field as={TextField} name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" error={touched.confirmPassword && !!errors.confirmPassword} helperText={touched.confirmPassword && errors.confirmPassword} />
                  <Button disabled={isSubmitting} type="submit" variant="contained">
                    {isSubmitting ? 'Updating password...' : 'Reset password'}
                  </Button>
                  <Button disabled={resending} onClick={resendCode}>
                    {resending ? 'Sending new code...' : 'Send a new code'}
                  </Button>
                  <Button onClick={() => { setSubmittedEmail(''); setMessage(''); setError(''); }}>Use a different email</Button>
                </Stack>
              </Form>
            )}
          </Formik>
        ) : (
          <Button component={RouterLink} to="/login" variant="contained">Sign in</Button>
        )}
      </Stack>
    </Paper>
  );
}
