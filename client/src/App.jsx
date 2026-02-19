import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { AdminProvider } from './context/AdminContext';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react'; 

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const AllProducts = lazy(() => import('./pages/AllProducts'));
const HotDeals = lazy(() => import('./pages/HotDeals'));
// Add these new pages
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <CartProvider>
          <AdminProvider>
            <Router>
              <div className="App">
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                  }}
                />
                
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/product/:id" element={<ProductPage />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/products" element={<AllProducts />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/hot-deals" element={<HotDeals />} />
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  </Routes>
                </Suspense>
              </div>
            </Router>
          </AdminProvider>
        </CartProvider>
      </CurrencyProvider> 
    </ThemeProvider>
  );
}

export default App;