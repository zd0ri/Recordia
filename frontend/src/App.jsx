import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Users from './pages/admin/Users';
import Products from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import Genres from './pages/admin/Genres';
import Artists from './pages/admin/Artists';
import AdminLayout from './components/AdminLayout';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminReviews from './pages/admin/Reviews';
import Dashboard from './pages/admin/Dashboard';
import CollectionLanding from './pages/CollectionLanding';
import TaxonomyLanding from './pages/TaxonomyLanding';
import About from './pages/About';

function NotFound() {
  return (
    <Page title="Page not found" description="The record you are looking for is not in this collection.">
      <Button component={RouterLink} to="/" variant="contained">Return home</Button>
    </Page>
  );
}

function Page({ title, description, children }) {
  return (
    <Paper sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
      <Stack alignItems="center" spacing={2}>
        <Typography variant="h2">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
        {children}
      </Stack>
    </Paper>
  );
}

export default function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 4, md: 8 } }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collections/:collection" element={<CollectionLanding />} />
          <Route path="/genres" element={<TaxonomyLanding type="genres" />} />
          <Route path="/artists" element={<TaxonomyLanding type="artists" />} />
          <Route path="/about" element={<About />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success/:id" element={<OrderSuccess />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/products" element={<Products />} />
                <Route path="/admin/products/new" element={<ProductForm />} />
                <Route path="/admin/products/:id/edit" element={<ProductForm />} />
                <Route path="/admin/genres" element={<Genres />} />
                <Route path="/admin/artists" element={<Artists />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <Footer />
    </Box>
  );
}
