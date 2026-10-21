import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Alert,
  Avatar,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const profileSchema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
});

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [selectedPreview, setSelectedPreview] = useState('');
  const preview = selectedPreview || user?.avatar?.url || '';
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const hasPassword = user?.hasPassword !== false;
  const passwordSchema = Yup.object({
    oldPassword: hasPassword
      ? Yup.string().required('Current password is required')
      : Yup.string(),
    password: hasPassword
      ? Yup.string().min(6, 'Use at least 6 characters').required('New password is required')
      : Yup.string().min(6, 'Use at least 6 characters'),
    confirmPassword: hasPassword
      ? Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm your password')
      : Yup.string(),
  }).test('optional-password-pair', function validateOptionalPassword(values) {
    if (hasPassword || (!values?.password && !values?.confirmPassword)) return true;
    if (!values.password) {
      return this.createError({ path: 'password', message: 'New password is required' });
    }
    if (!values.confirmPassword) {
      return this.createError({ path: 'confirmPassword', message: 'Confirm your password' });
    }
    if (values.password !== values.confirmPassword) {
      return this.createError({ path: 'confirmPassword', message: 'Passwords must match' });
    }
    return true;
  });

  return (
    <Stack spacing={3} sx={{ maxWidth: 680, mx: 'auto' }}>
      <Paper sx={{ p: { xs: 3, md: 5 } }}>
        <Typography gutterBottom variant="h3">Your profile</Typography>
        {profileMessage && <Alert sx={{ mb: 2 }} severity="success">{profileMessage}</Alert>}
        <Formik
          enableReinitialize
          initialValues={{ name: user?.name || '', email: user?.email || '', avatar: null }}
          validationSchema={profileSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setProfileMessage('');
            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('email', values.email);
            if (values.avatar) formData.append('avatar', values.avatar);
            try {
              await updateProfile(formData);
              setProfileMessage('Profile updated.');
            } catch (error) {
              setProfileMessage(error.response?.data?.message || 'Profile update failed');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ errors, touched, isSubmitting, setFieldValue }) => (
            <Form>
              <Stack spacing={2}>
                <Stack alignItems="center" spacing={1}>
                  <Avatar src={preview || undefined} sx={{ height: 96, width: 96 }} />
                  <Button component="label" variant="outlined">
                    Change avatar
                    <input
                      hidden
                      accept="image/jpeg,image/png"
                      type="file"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        if (file) {
                          setFieldValue('avatar', file);
                          setSelectedPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </Button>
                </Stack>
                <Field as={TextField} name="name" label="Name" error={touched.name && !!errors.name} helperText={touched.name && errors.name} />
                <Field as={TextField} name="email" label="Email" type="email" error={touched.email && !!errors.email} helperText={touched.email && errors.email} />
                <Button disabled={isSubmitting} type="submit" variant="contained">Save profile</Button>
              </Stack>
            </Form>
          )}
        </Formik>
      </Paper>

      <Paper sx={{ p: { xs: 3, md: 5 } }}>
        <Typography gutterBottom variant="h4">{hasPassword ? 'Change password' : 'Create a password'}</Typography>
        {!hasPassword && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            You signed in with Google. You can optionally create a Recordia password to also sign in with your email.
          </Typography>
        )}
        {passwordMessage && <Alert sx={{ mb: 2 }} severity={passwordMessage === 'Password updated.' ? 'success' : 'error'}>{passwordMessage}</Alert>}
        <Formik
          initialValues={{ oldPassword: '', password: '', confirmPassword: '' }}
          validationSchema={passwordSchema}
          onSubmit={async (values, { resetForm, setSubmitting }) => {
            setPasswordMessage('');
            try {
              await changePassword(values.oldPassword, values.password, values.confirmPassword);
              resetForm();
              setPasswordMessage('Password updated.');
            } catch (error) {
              setPasswordMessage(error.response?.data?.message || 'Password update failed');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ errors, touched, isSubmitting, values }) => (
            <Form>
              <Stack spacing={2}>
                {hasPassword && <Field as={TextField} name="oldPassword" label="Current password" type="password" error={touched.oldPassword && !!errors.oldPassword} helperText={touched.oldPassword && errors.oldPassword} />}
                <Field as={TextField} name="password" label={hasPassword ? 'New password' : 'Create password (optional)'} type="password" error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
                <Field as={TextField} name="confirmPassword" label="Confirm new password" type="password" error={touched.confirmPassword && !!errors.confirmPassword} helperText={touched.confirmPassword && errors.confirmPassword} />
                <Divider />
                <Button disabled={isSubmitting || !values.password || !values.confirmPassword} type="submit" variant="outlined">
                  {hasPassword ? 'Update password' : 'Create password'}
                </Button>
              </Stack>
            </Form>
          )}
        </Formik>
      </Paper>
    </Stack>
  );
}
