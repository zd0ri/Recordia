import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

/* eslint-disable react-refresh/only-export-components */
const SnackbarContext = createContext(null);

export function SnackbarProvider({ children }) {
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'success' });

  const show = useCallback((message, severity = 'success') => {
    setNotice({ open: true, message, severity });
  }, []);

  const value = useMemo(() => ({
    showSuccess: (message) => show(message, 'success'),
    showError: (message) => show(message, 'error'),
  }), [show]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={notice.open}
        autoHideDuration={4000}
        onClose={() => setNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          elevation={6}
          onClose={() => setNotice((current) => ({ ...current, open: false }))}
          severity={notice.severity}
          variant="filled"
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used within a SnackbarProvider');
  return context;
}

export { useSnackbar };
