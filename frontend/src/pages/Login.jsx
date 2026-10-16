import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Alert, Box, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
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

const getPostLoginPath = (location, user) => (
  user.role === 'admin'
    ? '/admin/dashboard'
    : location.state?.from?.pathname || '/profile'
);

export default function Login() {
  const { login, firebaseLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  const continueWithGoogle = async () => {
    setError('');
    try {
      const result = await signInWithFirebaseGoogle();
      const authData = await firebaseLogin(await result.user.getIdToken());
      navigate(getPostLoginPath(location, authData.user), { replace: true });
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
      const authData = await firebaseLogin(await result.user.getIdToken());
      navigate(getPostLoginPath(location, authData.user), { replace: true });
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
    <Paper className="auth-card" sx={{ maxWidth: 920, mx: 'auto' }}>
      <Box className="auth-art" aria-hidden="true">
        <div className="auth-art-record" />
        <Typography className="auth-art-label">RECORDIA<br /><small>THE ANALOG COLLECTION</small></Typography>
      </Box>
      <Box className="auth-form-panel">
      <Typography className="auth-eyebrow">WELCOME BACK</Typography>
      <Typography className="auth-title" gutterBottom variant="h3">Drop the needle.</Typography>
      <Typography className="auth-subtitle">Sign in and keep exploring the collection.</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          setError('');
          try {
            try {
              const result = await signInWithFirebaseEmail(values.email, values.password);
              const authData = await firebaseLogin(await result.user.getIdToken());
              navigate(getPostLoginPath(location, authData.user), { replace: true });
              return;
            } catch (firebaseError) {
              if (firebaseError.response?.status === 403) throw firebaseError;
              const authData = await login(values.email, values.password);
              navigate(getPostLoginPath(location, authData.user), { replace: true });
            }
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
              <Divider className="auth-divider">or continue with</Divider>
              <Button className="social-button google-button" disabled={isSubmitting} onClick={continueWithGoogle} startIcon={<GoogleIcon />} type="button" variant="outlined">
                Google
              </Button>
              <Button className="social-button facebook-button" disabled={isSubmitting} onClick={continueWithFacebook} startIcon={<FacebookIcon />} type="button" variant="outlined">
                Facebook
              </Button>
              <Typography className="auth-switch">New to Recordia? <RouterLink to="/register">Create an account</RouterLink></Typography>
            </Stack>
          </Form>
        )}
      </Formik>
      </Box>
    </Paper>
  );
}
