import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { Flame } from 'lucide-react';

const HotDeals = () => {
  const [hotDeals, setHotDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchHotDeals();
  }, []);

  const fetchHotDeals = async () => {
    try {
      setLoading(true);
      const dealsData = await productAPI.getHotDeals();
      setHotDeals(dealsData);
    } catch (err) {
      setError('Failed to load hot deals');
      console.error('Error fetching hot deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeLeft = useCallback((endDate) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const difference = end - now;

    if (difference <= 0) {
      return { expired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    return {
      days,
      hours,
      minutes,
      expired: false
    };
  }, []);

  // Check if product is out of stock
  const isOutOfStock = useCallback((product) => {
    return product.stockQuantity === 0;
  }, []);

  const handleAddToCart = useCallback((product) => {
    if (isOutOfStock(product)) {
      toast.error('This product is currently out of stock');
      return;
    }
    addToCart(product);
  }, [addToCart, isOutOfStock]);

  // Memoized hot deals
  const memoizedHotDeals = useMemo(() => hotDeals, [hotDeals]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-32 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading hot deals...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-32 flex justify-center items-center">
          <div className="text-center">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={fetchHotDeals}
              className="mt-4 bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <section className="pb-16 pt-4">
        <div className="px-4 sm:px-6 lg:px-20">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              HOT <span className="text-red-500">DEALS</span>
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-amber-500 mx-auto mb-6"></div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Limited time offers! Grab these exclusive deals before they're gone.
            </p>
          </div>

          {/* Hot Deals Grid */}
          {memoizedHotDeals.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-600 text-6xl mb-4">🔥</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Active Deals
              </h3>
              <p className="text-gray-400 mb-6">
                Check back later for exciting hot deals!
              </p>
              <Link 
                to="/products"
                className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600"
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {memoizedHotDeals.map((product) => {
                const timeLeft = calculateTimeLeft(product.hotDealEnd);
                const originalPrice = product.dealOriginalPrice || product.price;
                const outOfStock = isOutOfStock(product);
                
                return (
                  <div 
                    key={product._id} 
                    className={`bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl overflow-hidden hover:border-red-500/30 transition-all duration-300 ${
                      outOfStock ? 'opacity-80' : ''
                    }`}
                  >
                    {/* Hot Deal Badge - Compact */}
                    <div className={`flex items-center justify-center py-1.5 px-3 ${
                      outOfStock 
                        ? 'bg-gray-700' 
                        : 'bg-gradient-to-r from-red-600 to-red-500'
                    }`}>
                      <span className="font-semibold text-sm flex items-center">
                        {outOfStock ? (
                          'OUT OF STOCK'
                        ) : (
                          <>
                            <Flame size={14} className="mr-1" />
                            -{product.dealPercentage}% OFF
                          </>
                        )}
                      </span>
                    </div>

                    {/* Image - Reduced height */}
                    <div className="h-48 bg-gray-800 flex items-center justify-center overflow-hidden relative">
                      <img 
                        src={product.images && product.images[0] ? product.images[0] : '/placeholder-image.jpg'} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Countdown Timer - Overlay on image */}
                      {!timeLeft.expired && !outOfStock && (
                        <div className="absolute bottom-2 left-0 right-0">
                          <div className="bg-black/80 backdrop-blur-sm mx-2 p-2 rounded-lg">
                            <p className="text-white text-xs text-center font-semibold mb-1">
                              Ends in:
                            </p>
                            <div className="flex justify-center space-x-2">
                              <div className="text-center">
                                <div className="bg-red-600 text-white text-xs font-bold py-0.5 px-1 rounded">
                                  {timeLeft.days}
                                </div>
                                <div className="text-[10px] text-gray-300 mt-0.5">D</div>
                              </div>
                              <div className="text-center">
                                <div className="bg-red-600 text-white text-xs font-bold py-0.5 px-1 rounded">
                                  {timeLeft.hours}
                                </div>
                                <div className="text-[10px] text-gray-300 mt-0.5">H</div>
                              </div>
                              <div className="text-center">
                                <div className="bg-red-600 text-white text-xs font-bold py-0.5 px-1 rounded">
                                  {timeLeft.minutes}
                                </div>
                                <div className="text-[10px] text-gray-300 mt-0.5">M</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content - Compact */}
                    <div className="p-4">
                      {/* Product Name */}
                      <h3 className="font-serif font-semibold text-white mb-1.5 line-clamp-1 text-base">
                        {product.name}
                      </h3>
                      
                      {/* Description - Smaller */}
                      <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Pricing - Compact */}
                      <div className="mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 line-through text-sm">
                            {originalPrice}
                          </span>
                          <span className={`font-bold ${
                            outOfStock ? 'text-gray-500' : 'text-red-500'
                          }`}>
                            {product.price}
                          </span>
                        </div>
                        {!outOfStock && (
                          <div className="text-green-400 text-xs font-semibold">
                            Save {product.dealPercentage}%
                          </div>
                        )}
                      </div>

                      {/* Stock Status - Compact */}
                      {outOfStock && (
                        <div className="bg-gray-800/50 p-2 rounded-lg mb-3">
                          <p className="text-red-400 text-xs font-semibold text-center">
                            Out of stock
                          </p>
                        </div>
                      )}

                      {/* Actions - More compact */}
                      <div className="flex space-x-2">
                        <Link 
                          to={`/product/${product._id}`}
                          className="flex-1 bg-transparent border border-gray-600 text-white text-center py-1.5 rounded text-xs hover:bg-gray-800"
                          aria-label={`View details for ${product.name}`}
                        >
                          View
                        </Link>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          disabled={outOfStock}
                          className={`flex-1 text-center py-1.5 rounded text-xs ${
                            outOfStock
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-amber-500 text-white hover:bg-amber-600'
                          }`}
                          aria-label={outOfStock ? 'Product out of stock' : `Add ${product.name} to cart`}
                        >
                          {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HotDeals;