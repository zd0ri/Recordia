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

const passwordSchema = Yup.object({
  oldPassword: Yup.string().required('Current password is required'),
  password: Yup.string().min(6, 'Use at least 6 characters').required('New password is required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm your password'),
});

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [selectedPreview, setSelectedPreview] = useState('');
  const preview = selectedPreview || user?.avatar?.url || '';
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

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
        <Typography gutterBottom variant="h4">Change password</Typography>
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
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Stack spacing={2}>
                <Field as={TextField} name="oldPassword" label="Current password" type="password" error={touched.oldPassword && !!errors.oldPassword} helperText={touched.oldPassword && errors.oldPassword} />
                <Field as={TextField} name="password" label="New password" type="password" error={touched.password && !!errors.password} helperText={touched.password && errors.password} />
                <Field as={TextField} name="confirmPassword" label="Confirm new password" type="password" error={touched.confirmPassword && !!errors.confirmPassword} helperText={touched.confirmPassword && errors.confirmPassword} />
                <Divider />
                <Button disabled={isSubmitting} type="submit" variant="outlined">Update password</Button>
              </Stack>
            </Form>
          )}
        </Formik>
      </Paper>
    </Stack>
  );
}
