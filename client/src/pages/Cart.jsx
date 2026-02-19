import { Link } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { Plus, Minus, Trash2 } from 'lucide-react';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();

  // Memoized cart calculations
  const cartSummary = useMemo(() => {
    const subtotal = getCartTotal();
    const shipping = 5.00;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;
    
    return { subtotal, shipping, tax, total };
  }, [getCartTotal]);

  const memoizedCart = useMemo(() => cart, [cart]);

  // Memoized handlers
  const handleQuantityChange = useCallback((id, newQuantity) => {
    updateQuantity(id, newQuantity);
  }, [updateQuantity]);

  const handleRemoveItem = useCallback((id) => {
    removeFromCart(id);
  }, [removeFromCart]);

  const handleClearCart = useCallback(() => {
    clearCart();
  }, [clearCart]);

  if (memoizedCart.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <section className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-6">
              Your Cart is Empty
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              Discover our collection and find your perfect fragrance.
            </p>
            <Link
              to="/"
              className="bg-amber-500 text-white px-8 py-3 rounded-lg hover:bg-amber-600 font-sans font-semibold inline-block"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      
      <section className="pt-8 pb-20">
        <div className="max-w-6xl mx-auto px-4">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {memoizedCart.map((item) => (
                  <div key={item._id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
                    <img 
                      src={item.images && item.images[0] ? item.images[0] : '/placeholder-image.jpg'} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <h3 className="font-serif font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-amber-600 dark:text-amber-400 font-bold">{item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus className='text-white cursor-pointer' size={16} />
                      </button>
                      <span className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <Plus className='text-white cursor-pointer' size={16} />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(item._id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 className='cursor-pointer' size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleClearCart}
                className="mt-6 text-red-500 hover:text-red-600 font-sans cursor-pointer"
              >
                Clear Cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 h-fit">
              <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span>${cartSummary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Shipping</span>
                  <span>${cartSummary.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Tax</span>
                  <span>${cartSummary.tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>${cartSummary.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 font-sans font-semibold text-center block"
              >
                Proceed to Checkout
              </Link>
              
              <Link
                to="/"
                className="w-full bg-transparent border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white py-3 rounded-lg hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 font-sans font-semibold text-center block mt-3"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Cart;