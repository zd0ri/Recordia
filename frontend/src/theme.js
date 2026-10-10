import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#263a32',
      contrastText: '#fffaf0',
    },
    secondary: {
      main: '#b48a43',
    },
    background: {
      default: '#f5efdf',
      paper: '#fffaf0',
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
  },
  shape: {
    borderRadius: 3,
  },
});

export default theme;
