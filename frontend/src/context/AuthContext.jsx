import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useSnackbar } from './SnackbarContext';

const AuthContext = createContext(null);

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
      } catch (error) {
        localStorage.removeItem('recordia_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/login', { email, password });
      localStorage.setItem('recordia_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showSuccess('Welcome back.');
      return data;
    } catch (error) {
      showError(error.response?.data?.message || 'Login failed.');
      throw error;
    }
  };

  const firebaseLogin = async (idToken) => {
    try {
      const { data } = await api.post('/firebase-login', { idToken });
      localStorage.setItem('recordia_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showSuccess('Welcome to Recordia.');
      return data;
    } catch (error) {
      showError(error.response?.data?.message || 'Authentication failed.');
      throw error;
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await api.post('/register', formData);
      localStorage.setItem('recordia_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showSuccess('Account created successfully.');
      return data;
    } catch (error) {
      showError(error.response?.data?.message || 'Registration failed.');
      throw error;
    }
  };

  const updateProfile = async (formData) => {
    const { data } = await api.put('/me/update', formData);
    setUser(data.user);
    showSuccess('Profile updated.');
    return data;
  };

  const changePassword = async (oldPassword, password, confirmPassword) => {
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
  };

  const logout = () => {
    localStorage.removeItem('recordia_token');
    setToken(null);
    setUser(null);
  };

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
    [user, token, loading, showSuccess, showError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
