import { configureStore, createSlice } from '@reduxjs/toolkit';

const readStoredCart = () => {
  try {
    const storedItems = JSON.parse(localStorage.getItem('recordia_cart') || '[]');
    return Array.isArray(storedItems) ? storedItems : [];
  } catch {
    return [];
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('recordia_token'),
    loading: true,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.loading = false;
    },
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
    },
  },
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: readStoredCart() },
  reducers: {
    replaceItems(state, action) {
      state.items = action.payload;
    },
    clearItems(state) {
      state.items = [];
    },
  },
});

export const authActions = authSlice.actions;
export const cartActions = cartSlice.actions;

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
  },
});

export default store;
