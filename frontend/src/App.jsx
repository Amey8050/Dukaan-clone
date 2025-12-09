import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Stores = lazy(() => import('./pages/Stores'));
const CreateStore = lazy(() => import('./pages/CreateStore'));
const Products = lazy(() => import('./pages/Products'));
const ProductForm = lazy(() => import('./pages/ProductForm'));
const Cart = lazy(() => import('./pages/Cart'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Inventory = lazy(() => import('./pages/Inventory'));
const StoreHomepage = lazy(() => import('./pages/StoreHomepage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const EditStore = lazy(() => import('./pages/EditStore'));
const BulkUpload = lazy(() => import('./pages/BulkUpload'));
const StoreLocation = lazy(() => import('./pages/StoreLocation'));
const LandingPage = lazy(() => import('./components/LandingPage/LandingPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Pricing = lazy(() => import('./pages/Pricing'));

// Component to conditionally show theme toggle
const ConditionalThemeToggle = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
  if (isLandingPage) {
    return null;
  }
  
  return (
    <div className="theme-toggle-container">
      <ThemeToggle />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <ConditionalThemeToggle />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores"
                element={
                  <ProtectedRoute>
                    <Stores />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/create"
                element={
                  <ProtectedRoute>
                    <CreateStore />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId/edit"
                element={
                  <ProtectedRoute>
                    <EditStore />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId/products"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId/products/create"
                element={
                  <ProtectedRoute>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId/products/:productId/edit"
                element={
                  <ProtectedRoute>
                    <ProductForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId/products/bulk-upload"
                element={
                  <ProtectedRoute>
                    <BulkUpload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId/cart"
                element={<Cart />}
              />
              <Route
                path="/stores/:storeId/products/:productId"
                element={<ProductDetail />}
              />
              <Route
                path="/stores/:storeId/checkout"
                element={<Checkout />}
              />
              <Route
                path="/stores/:storeId/orders/:orderId/confirmation"
                element={<OrderConfirmation />}
              />
              <Route
                path="/stores/:storeId/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId/orders/:orderId"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId/location"
                element={<StoreLocation />}
              />
              <Route
                path="/stores/:storeId/inventory"
                element={
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/stores/:storeId"
                element={<StoreHomepage />}
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminPanel />
                  </AdminProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </CartProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
