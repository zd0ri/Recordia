import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { CircularProgress, Stack } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ customerOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress aria-label="Loading account" /></Stack>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (customerOnly && user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
}
