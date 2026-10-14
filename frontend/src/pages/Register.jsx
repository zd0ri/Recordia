import { useRef, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Avatar,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  registerWithFirebaseEmail,
  signInWithFirebaseFacebook,
  signInWithFirebaseEmail,
  signInWithFirebaseGoogle,
  updateFirebaseUserProfile,
} from '../firebase';

const schema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'Use at least 6 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
});

export default function Register() {
  const { register, firebaseLogin } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  const continueWithGoogle = async () => {
    setError('');
    try {
      const result = await signInWithFirebaseGoogle();
      await firebaseLogin(await result.user.getIdToken());
      navigate('/profile');
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || 'Google registration failed');
    }
  };

  const continueWithFacebook = async () => {
    setError('');
    try {
      const result = await signInWithFirebaseFacebook();
      await firebaseLogin(await result.user.getIdToken());
      navigate('/profile');
    } catch (submitError) {
      setError(
        submitError.response?.data?.message
          || ({
            'auth/invalid-credential': 'Facebook rejected the Firebase credentials. Re-copy the current Facebook App ID and App Secret into Firebase, save, and try again.',
            'auth/popup-blocked': 'Facebook sign-in was blocked by the browser. Allow popups for this site and try again.',
            'auth/popup-closed-by-user': 'Facebook sign-in was cancelled.',
          }[submitError.code] || submitError.message || 'Facebook registration failed'),
      );
    }
  };

  return (
    <Paper sx={{ maxWidth: 520, mx: 'auto', p: { xs: 3, md: 5 } }}>
      <Typography gutterBottom variant="h3">Create your account</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Join the Recordia collection.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Formik
        initialValues={{ name: '', email: '', password: '', confirmPassword: '', avatar: null }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          setError('');
          try {
            try {
              const result = await registerWithFirebaseEmail(values.email, values.password);
              await updateFirebaseUserProfile(result.user, { displayName: values.name });
              await firebaseLogin(await result.user.getIdToken());
            } catch (firebaseError) {
              if (firebaseError.code === 'auth/email-already-in-use') {
                const result = await signInWithFirebaseEmail(values.email, values.password);
                await firebaseLogin(await result.user.getIdToken());
              } else if (firebaseError.response?.status !== 500) {
                const formData = new FormData();
                formData.append('name', values.name);
                formData.append('email', values.email);
                formData.append('password', values.password);
                if (values.avatar) formData.append('avatar', values.avatar);
                await register(formData);
              } else {
                throw firebaseError;
              }
            }
            navigate('/profile');
          } catch (submitError) {
            setError(
              submitError.response?.data?.message
                || submitError.response?.data?.error
                || submitError.message
                || 'Registration failed',
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting, setFieldValue }) => (
          <Form>
            <Stack spacing={2}>
              <Field as={TextField} name="name" label="Name" error={touched.name && !!errors.name} helperText={touched.name && errors.name} />
              <Field as={TextField} name="email" label="Email" type="email" error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
              <Field as={TextField} name="password" label="Password" type="password" error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
              <Field as={TextField} name="confirmPassword" label="Confirm password" type="password" error={touched.confirmPassword && !!errors.confirmPassword} helperText={touched.confirmPassword && errors.confirmPassword} />
              <Stack alignItems="center" spacing={1}>
                <Avatar src={preview || undefined} sx={{ height: 88, width: 88 }} />
                <Button component="label" variant="outlined">
                  Choose avatar
                  <input
                    ref={fileInput}
                    hidden
                    accept="image/jpeg,image/png"
                    type="file"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) {
                        setFieldValue('avatar', file);
                        setPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </Button>
              </Stack>
              <Button disabled={isSubmitting} type="submit" variant="contained">
                {isSubmitting ? 'Creating account...' : 'Register'}
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
