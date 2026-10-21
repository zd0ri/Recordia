import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#542d2d',
      contrastText: '#fffaf0',
    },
    secondary: {
      main: '#d69a2d',
    },
    background: {
      default: '#f4ead2',
      paper: '#fff8e8',
    },
  },
  typography: {
    fontFamily: '"DM Mono", "Courier New", monospace',
    h1: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 700,
    },
    button: {
      fontFamily: '"DM Mono", "Courier New", monospace',
      fontWeight: 700,
      letterSpacing: '0.04em',
    },
  },
  shape: {
    borderRadius: 3,
  },
});

export default theme;
