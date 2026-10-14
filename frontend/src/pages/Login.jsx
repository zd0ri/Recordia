import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  signInWithFirebaseFacebook,
  signInWithFirebaseEmail,
  signInWithFirebaseGoogle,
} from '../firebase';

const schema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export default function Login() {
  const { login, firebaseLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  const continueWithGoogle = async () => {
    setError('');
    try {
      const result = await signInWithFirebaseGoogle();
      await firebaseLogin(await result.user.getIdToken());
      navigate(location.state?.from?.pathname || '/profile', { replace: true });
    } catch (submitError) {
      setError(
        submitError.response?.data?.message
          || ({
            'auth/configuration-not-found': 'Google sign-in is not enabled for this Firebase project. Enable Google in Firebase Authentication, then restart the frontend.',
            'auth/invalid-credential': 'Facebook rejected the Firebase credentials. Re-copy the current Facebook App ID and App Secret into Firebase, save, and try again.',
            'auth/popup-blocked': 'Google sign-in was blocked by the browser. Allow popups for this site and try again.',
            'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
            'auth/unauthorized-domain': 'This site is not authorized for Google sign-in in Firebase.',
          }[submitError.code] || submitError.message || 'Google login failed'),
      );
    }
  };

  const continueWithFacebook = async () => {
    setError('');
    try {
      const result = await signInWithFirebaseFacebook();
      await firebaseLogin(await result.user.getIdToken());
      navigate(location.state?.from?.pathname || '/profile', { replace: true });
    } catch (submitError) {
      setError(
        submitError.response?.data?.message
          || (submitError.code === 'auth/popup-blocked'
            ? 'Facebook sign-in was blocked by the browser. Allow popups for this site and try again.'
            : submitError.code === 'auth/popup-closed-by-user'
              ? 'Facebook sign-in was cancelled.'
              : submitError.message || 'Facebook login failed'),
      );
    }
  };

  return (
    <Paper sx={{ maxWidth: 440, mx: 'auto', p: { xs: 3, md: 5 } }}>
      <Typography gutterBottom variant="h3">Welcome back</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          setError('');
          try {
            try {
              const result = await signInWithFirebaseEmail(values.email, values.password);
              await firebaseLogin(await result.user.getIdToken());
            } catch (firebaseError) {
              if (firebaseError.response?.status === 403) throw firebaseError;
              await login(values.email, values.password);
            }
            navigate(location.state?.from?.pathname || '/profile', { replace: true });
          } catch (submitError) {
            setError(submitError.response?.data?.message || 'Login failed');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Stack spacing={2}>
              <Field as={TextField} name="email" label="Email" type="email" error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
              <Field as={TextField} name="password" label="Password" type="password" error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
              <Button disabled={isSubmitting} type="submit" variant="contained">
                {isSubmitting ? 'Signing in...' : 'Login'}
              </Button>
              <Button disabled={isSubmitting} onClick={continueWithGoogle} type="button" variant="outlined">
                Continue with Google
              </Button>
              <Button disabled={isSubmitting} onClick={continueWithFacebook} type="button" variant="outlined">
                Continue with Facebook
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </Paper>
  );
}
