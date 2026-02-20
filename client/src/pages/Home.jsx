import { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { toast } from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import { ChevronRight, ArrowRight, Search, Eye } from 'lucide-react';

// Import hero background images from src/assets
import hero1 from '../assets/hero.webp';
import hero2 from '../assets/hero2.webp';
import hero3 from '../assets/hero3.webp';
import hero4 from '../assets/hero4.webp';
import hero5 from '../assets/hero5.webp';
import hero7 from '../assets/hero7.webp';
import hero8 from '../assets/hero8.webp';
import hero9 from '../assets/hero9.webp';

const Home = () => {
  const [email, setEmail] = useState('');
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const displayedProducts = useMemo(() => products.slice(0, 8), [products]);
  const featuredProductsMemo = useMemo(() => featuredProducts.slice(0, 4), [featuredProducts]);

  // Extract unique categories from products - UPDATED TO HANDLE POPULATED CATEGORY
  const categories = useMemo(() => {
    const allCategories = new Set();
    
    // Always include 'All' and 'Collection'
    const categoriesList = ['All', 'Collection'];
    
    // Extract unique categories from products
    products.forEach(product => {
      if (product.category) {
        // If category is populated (has name property), use the name
        if (product.category.name) {
          allCategories.add(product.category.name);
        } 
        // If it's a string (old format or fallback)
        else if (typeof product.category === 'string') {
          allCategories.add(product.category);
        }
        // If it's an ObjectId but not populated
        else if (typeof product.category === 'object' && product.category._id) {
          // We have the ID but not the name, we'll fetch category names separately
          // For now, we can skip or show placeholder
          console.log('Category not populated:', product.category._id);
        }
      }
    });
    
    // Add all unique categories
    const sortedCategories = Array.from(allCategories).sort();
    return [...categoriesList, ...sortedCategories];
  }, [products, featuredProducts]);

  // Hero background images - using imported variables
  const heroBackgrounds = useMemo(() => [
    hero1,
    hero2,
    hero3,
    hero4,
    hero5,
    hero7,
    hero8,
    hero9
  ], []);

  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto-scroll hero backgrounds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % heroBackgrounds.length);
    }, 4000); // Change background every 4 seconds

    return () => clearInterval(interval);
  }, [heroBackgrounds.length]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsData = await productAPI.getAll();
      setProducts(productsData);

      // Get featured products - assuming some products have a featured flag
      // If your API doesn't have featured flag, you can use the first 4
      const featured = productsData.slice(0, 4);
      setFeaturedProducts(featured);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const isOutOfStock = useCallback((product) => {
    return product.stockQuantity === 0;
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      toast.success(`Thank you! We'll notify you at ${email} when we launch.`);
      setEmail('');
    },
    [email]
  );

  // Get first 4-6 products for the hero carousel
  const productCarousel = useMemo(() => {
    return products.slice(0, 6).map(product => ({
      ...product,
      // Assuming product has an images array, use the first image
      image: product.images?.[0] || product.imageUrl || '/placeholder-product.jpg'
    }));
  }, [products]);

  const [currentProductIdx, setCurrentProductIdx] = useState(0);
  const totalProducts = productCarousel.length;

  // Auto-scroll product carousel
  useEffect(() => {
    if (totalProducts > 0) {
      const interval = setInterval(() => {
        setCurrentProductIdx((p) => (p + 1) % totalProducts);
      }, 4500);
      return () => clearInterval(interval);
    }
  }, [totalProducts]);

  const prevProductSlide = () => setCurrentProductIdx((p) => (p - 1 + totalProducts) % totalProducts);
  const nextProductSlide = () => setCurrentProductIdx((p) => (p + 1) % totalProducts);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prevProductSlide();
      if (e.key === 'ArrowRight') nextProductSlide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [totalProducts]);

  // Filter products based on active tab - UPDATED TO HANDLE POPULATED CATEGORY
  const filteredProducts = useMemo(() => {
    switch (activeFilter) {
      case 'All':
        return products; // All products
      case 'Collection':
        return displayedProducts; // First 8 products for collection
      default:
        // Filter by category name (since we're using category names in the filter)
        return products.filter(product => {
          if (product.category) {
            // If category is populated with name
            if (product.category.name) {
              return product.category.name === activeFilter;
            }
            // If category is a string (fallback)
            else if (typeof product.category === 'string') {
              return product.category === activeFilter;
            }
          }
          return false;
        });
    }
  }, [activeFilter, products, displayedProducts, featuredProductsMemo]);

  // Safe price formatting function
  const safeFormatPrice = (price) => {
    try {
      // Check if price exists
      if (price === undefined || price === null) {
        return 'Price not available';
      }
      
      // If price is already a string with currency symbol, return it as is
      if (typeof price === 'string' && (price.includes('$') || price.includes('€') || price.includes('£') || price.includes('₹'))) {
        return price;
      }
      
      // Try to convert to number
      const numPrice = typeof price === 'number' ? price : parseFloat(price);
      
      // Check if conversion was successful
      if (isNaN(numPrice)) {
        // Try alternative parsing - remove any non-numeric characters except decimal point
        const cleanedPrice = String(price).replace(/[^\d.-]/g, '');
        const cleanedNum = parseFloat(cleanedPrice);
        
        if (isNaN(cleanedNum)) {
          return 'Price not available';
        }
        
        // Format the cleaned number
        return formatPrice(cleanedNum);
      }
      
      // Format the valid number
      return formatPrice(numPrice);
    } catch (error) {
      console.error('Error formatting price:', error, 'Price value:', price);
      return 'Price not available';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <div className="pt-32 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <div className="pt-32 flex justify-center items-center">
          <div className="text-center">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button 
              onClick={fetchProducts} 
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />

      {/* Hero Section with Background Transition */}
      <section 
        id="home" 
        className="pt-2 pb-0 relative min-h-[65vh] flex items-center overflow-hidden"
      >
        {/* Background Images with Transition */}
        <div className="absolute inset-0 z-0 bg-black">
          {heroBackgrounds.map((bg, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentBgIndex 
                  ? 'opacity-100 z-10' 
                  : 'opacity-0 z-0'
              }`}
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)), url(${bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          ))}
          
          {/* Dark Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40 z-20" />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-transparent to-black/50 z-20" />
        </div>

        {/* Content */}
        <div className="relative z-30 w-full px-4 sm:px-6 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-center">
            {/* LEFT CONTENT */}
            <div className="lg:col-span-7 pl-4 sm:pl-6">
              <h1
                className="font-[Inter] font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-white"
                style={{ letterSpacing: '-0.02em' }}
              >
                EVERYDAY STYLE
                <br />
                ENDLESS COMFORT.
              </h1>

              <p className="mt-3 ml-1 text-md text-gray-400 max-w-sm">
                Get exclusive updates and monthly picks
              </p>

              {/* EMAIL FORM */}
              <form onSubmit={handleSubmit} className="mt-10">
                <div className="relative max-w-sm group">
                  <div className="flex items-center bg-black/50 border border-gray-600 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-amber-500 focus-within:border-amber-500 backdrop-blur-sm">
                    <div className="pl-4">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      className="flex-1 bg-transparent border-0 text-gray-200 placeholder-gray-400 px-3 py-3 text-sm focus:outline-none focus:ring-0"
                    />
                    <button
                      type="submit"
                      className="px-4 py-3 cursor-pointer bg-amber-500 hover:bg-amber-600 text-black font-medium text-sm transition-colors duration-300"
                    >
                      Subscribe
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* RIGHT PRODUCTS GALLERY */}
            <div className="lg:col-span-5 pr-4 sm:pr-6">
              <div className="w-full mx-auto lg:mx-0">
                <div className="relative h-[45vh] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl backdrop-blur-sm">
                  {/* Products Carousel */}
                  <div
                    className="flex transition-transform duration-700 ease-in-out h-full"
                    style={{
                      width: `${productCarousel.length * 100}%`,
                      transform: `translateX(-${(100 / productCarousel.length) * currentProductIdx}%)`,
                    }}
                  >
                    {productCarousel.map((product, i) => (
                      <div
                        key={product._id || i}
                        className="flex-shrink-0 h-full relative group"
                        style={{ width: `${100 / productCarousel.length}%` }}
                      >
                        <div className="w-full h-full relative overflow-hidden">
                          {/* Product Image */}
                          <div 
                            className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                            style={{ 
                              backgroundImage: `url(${product.image})`,
                              backgroundPosition: 'center center'
                            }}
                          />
                          
                          {/* Hover Overlay with View Button */}
                          <Link 
                            to={`/product/${product._id}`}
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center"
                          >
                            <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                              <div className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105">
                                <Eye size={18} />
                                View Product
                              </div>
                              <p className="mt-3 text-white text-sm max-w-xs px-4">
                                {product.name || 'Product Name'}
                              </p>
                              <p className="text-amber-400 font-bold mt-1">
                                {safeFormatPrice(product.price)}
                              </p>
                            </div>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <button
                    onClick={prevProductSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full z-10 transition-all duration-300 hover:scale-110"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextProductSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full z-10 transition-all duration-300 hover:scale-110"
                  >
                    ›
                  </button>

                  {/* Product Counter */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                      <span className="text-amber-400 font-bold">{currentProductIdx + 1}</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-gray-300">{productCarousel.length}</span>
                      <span className="text-gray-400 ml-2">Featured Products</span>
                    </div>
                  </div>

                  {/* Product Indicator Dots */}
                  {productCarousel.length > 0 && (
                    <div className="absolute bottom-4 right-4 flex gap-1">
                      {productCarousel.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentProductIdx(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentProductIdx 
                              ? 'bg-amber-500 w-4' 
                              : 'bg-gray-600 hover:bg-gray-400'
                          }`}
                          aria-label={`Go to product ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Products Section */}
      <section className="pt-6 mt-0 pb-4 md:pb-0 bg-white dark:bg-black">
        <div className="px-4 sm:px-6 lg:px-20">
          {/* Filter Tabs with Items Selected on right side */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-gray-300 dark:border-gray-800">
            {/* Filter Buttons with horizontal scroll for mobile */}
            <div className="flex flex-nowrap overflow-x-auto pb-2 mb-4 md:mb-0 md:pb-0 md:overflow-visible scrollbar-hide">
              <div className="flex gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveFilter(category)}
                    className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === category
                        ? 'bg-amber-500 text-black'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Items Selected Counter */}
            <div className="flex items-center">
              <span className="text-amber-500 text-xl font-bold">= {filteredProducts.length}</span>
              <span className="text-gray-600 dark:text-gray-400 ml-2 text-sm">items selected</span>
            </div>
          </div>

          {/* Show message if no products in selected category */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">No products found in the "{activeFilter}" category.</p>
              <button
                onClick={() => setActiveFilter('All')}
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded-lg font-medium transition-colors"
              >
                View All Products
              </button>
            </div>
          ) : (
            /* Products Grid - Changes based on active tab */
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  variant="minimal" 
                  viewMode="grid" 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;