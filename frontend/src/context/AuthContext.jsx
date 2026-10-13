import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useSnackbar } from './SnackbarContext';

/* eslint-disable react-refresh/only-export-components */
const AuthContext = createContext(null);

function getAuthErrorMessage(error, fallback) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Unable to connect to the Recordia server. Start the backend on port 4001 and try again.';
  }
  return fallback;
}

export function AuthProvider({ children }) {
  const { showSuccess, showError } = useSnackbar();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('recordia_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/me');
        setUser(data.user);
      } catch {
        localStorage.removeItem('recordia_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/login', { email, password });
      localStorage.setItem('recordia_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showSuccess('Welcome back.');
      return data;
    } catch (error) {
      showError(getAuthErrorMessage(error, 'Login failed.'));
      throw error;
    }
  }, [showError, showSuccess]);

  const firebaseLogin = useCallback(async (idToken) => {
    try {
      const { data } = await api.post('/firebase-login', { idToken });
      localStorage.setItem('recordia_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showSuccess('Welcome to Recordia.');
      return data;
    } catch (error) {
      showError(getAuthErrorMessage(error, 'Authentication failed.'));
      throw error;
    }
  }, [showError, showSuccess]);

  const register = useCallback(async (formData) => {
    try {
      const { data } = await api.post('/register', formData);
      localStorage.setItem('recordia_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showSuccess('Account created successfully.');
      return data;
    } catch (error) {
      showError(getAuthErrorMessage(error, 'Registration failed.'));
      throw error;
    }
  }, [showError, showSuccess]);

  const updateProfile = useCallback(async (formData) => {
    const { data } = await api.put('/me/update', formData);
    setUser(data.user);
    showSuccess('Profile updated.');
    return data;
  }, [showSuccess]);

  const changePassword = useCallback(async (oldPassword, password, confirmPassword) => {
    const { data } = await api.put('/password/update', {
      oldPassword,
      password,
      confirmPassword,
    });
    localStorage.setItem('recordia_token', data.token);
    setToken(data.token);
    setUser(data.user);
    showSuccess('Password updated.');
    return data;
  }, [showSuccess]);

  const logout = useCallback(() => {
    localStorage.removeItem('recordia_token');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      firebaseLogin,
      register,
      updateProfile,
      changePassword,
      logout,
      loading,
    }),
    [user, token, loading, login, firebaseLogin, register, updateProfile, changePassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { useAuth };
