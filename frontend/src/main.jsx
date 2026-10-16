import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SnackbarProvider } from './context/SnackbarContext';
import theme from './theme';
import './index.css';
import './App.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <SnackbarProvider>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </SnackbarProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
