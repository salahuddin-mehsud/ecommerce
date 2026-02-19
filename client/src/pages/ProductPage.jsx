import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { Star } from 'lucide-react';
import { productAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { toast } from 'react-hot-toast';

const ProductPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { formatPrice, getNumericPrice } = useCurrency();
  const [newReview, setNewReview] = useState({
    name: '',
    rating: 0,
    comment: ''
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState({});

  // Memoized product data
  const productData = useMemo(() => product, [product]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Load reviews from localStorage on component mount
  useEffect(() => {
    if (productData) {
      const storedReviews = localStorage.getItem(`reviews-${productData._id}`);
      if (storedReviews) {
        setReviews(JSON.parse(storedReviews));
      }
    }
  }, [productData]);

  // Save reviews to localStorage whenever reviews change
  useEffect(() => {
    if (productData) {
      localStorage.setItem(`reviews-${productData._id}`, JSON.stringify(reviews));
    }
  }, [reviews, productData]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const productData = await productAPI.getById(id);
      setProduct(productData);
    } catch (err) {
      setError('Product not found');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  // Memoized handlers
  const isOutOfStock = useCallback((product) => {
    return product?.stockQuantity === 0;
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!productData || isOutOfStock(productData)) {
      toast.error('This product is currently out of stock');
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addToCart(productData);
    }
    toast.success(`Added ${quantity} ${productData.name} to cart!`);
  }, [productData, quantity, addToCart, isOutOfStock]);

  const handleBuyNow = useCallback(() => {
    if (!productData || isOutOfStock(productData)) {
      toast.error('This product is currently out of stock');
      return;
    }
    // Add product to cart first
    for (let i = 0; i < quantity; i++) {
      addToCart(productData);
    }
    // Then navigate directly to checkout
    navigate('/checkout');
  }, [productData, quantity, addToCart, navigate, isOutOfStock]);

  const handleStarClick = useCallback((rating) => {
    setNewReview(prev => ({ ...prev, rating }));
  }, []);

  const handleReviewSubmit = useCallback((e) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.comment.trim() || newReview.rating === 0) {
      toast.error('Please fill in all fields and select a rating');
      return;
    }

    const review = {
      id: Date.now(),
      name: newReview.name.trim(),
      rating: newReview.rating,
      comment: newReview.comment.trim(),
      date: new Date().toISOString().split('T')[0]
    };

    setReviews(prev => [review, ...prev]);
    setNewReview({ name: '', rating: 0, comment: '' });
    setShowReviewForm(false);
    toast.success('Thank you for your review!');
  }, [newReview]);

  const handleImageLoad = useCallback((index) => {
    setImagesLoaded(prev => ({ ...prev, [index]: true }));
  }, []);

  const handleThumbnailClick = useCallback((index) => {
    setCurrentImageIndex(index);
  }, []);

  const handleQuantityChange = useCallback((newQuantity) => {
    setQuantity(Math.max(1, newQuantity));
  }, []);

  // Memoized calculations
  const averageRating = useMemo(() => 
    reviews.length > 0 
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : 0,
    [reviews]
  );

  const outOfStock = useMemo(() => 
    productData ? isOutOfStock(productData) : true,
    [productData, isOutOfStock]
  );

  const productImages = useMemo(() => 
    productData?.images || [],
    [productData]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <div className="pt-32 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading product...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-2xl font-serif text-gray-900 dark:text-white">Product not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
          <Link to="/" className="text-amber-500 hover:text-amber-600 mt-4 inline-block">Back to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      
      {/* Product Section */}
      <section className="pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="relative bg-gray-100 dark:bg-black rounded-lg h-96 mb-4 flex items-center justify-center overflow-hidden">
                {productImages.length > 0 ? (
                  <>
                    <img 
                      src={productImages[currentImageIndex]} 
                      alt={productData.name}
                      className="w-full h-full object-cover"
                      onLoad={() => handleImageLoad(currentImageIndex)}
                      loading="lazy"
                    />
                    {!imagesLoaded[currentImageIndex] && (
                      <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">No image available</span>
                  </div>
                )}

                {productImages.length > 1 && (
                  <>
                    {/* Left Arrow */}
                    <button 
                      className="absolute cursor-pointer left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                      onClick={() => {
                        const prevIndex = currentImageIndex === 0 ? productImages.length - 1 : currentImageIndex - 1;
                        setCurrentImageIndex(prevIndex);
                      }}
                      aria-label="Previous image"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Right Arrow */}
                    <button 
                      className="absolute cursor-pointer right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                      onClick={() => {
                        const nextIndex = currentImageIndex === productImages.length - 1 ? 0 : currentImageIndex + 1;
                        setCurrentImageIndex(nextIndex);
                      }}
                      aria-label="Next image"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            
              {/* Thumbnail Images */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.map((image, index) => (
                    <div 
                      key={index} 
                      className={`bg-gray-100 dark:bg-gray-800 rounded-lg h-20 flex items-center justify-center overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                        index === currentImageIndex ? 'border-amber-500' : 'border-transparent hover:border-amber-300'
                      }`}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <img 
                        src={image} 
                        alt={`${productData.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                {productData.name}
              </h1>
              
              <div className="flex items-center mb-4">
                <div className="flex text-amber-500">
                  {[1,2,3,4,5].map((star) => (
                    <Star 
                      key={star} 
                      size={20} 
                      fill={star <= averageRating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <span className="text-gray-600 dark:text-gray-400 ml-2 text-sm">
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>

              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-6">
                {formatPrice(getNumericPrice(productData.price))}
              </p>

              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                {productData.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-medium w-32">Category:</span>
                  <span className="text-gray-900 dark:text-white text-sm capitalize"> {productData.category?.name || productData.category || 'perfume'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-medium w-32">Status:</span>
                  <span className={`text-sm font-semibold ${
                    outOfStock ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {outOfStock ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-medium w-32">Stock Quantity:</span>
                  <span className={`text-sm ${
                    outOfStock ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {productData.stockQuantity} units
                  </span>
                </div>
                {productData.featured && (
                  <div className="flex items-center">
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-medium w-32">Featured:</span>
                    <span className="text-amber-600 text-sm">Yes</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {!outOfStock && (
                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">Quantity:</span>
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded">
                    <button 
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-gray-900 dark:text-white min-w-8 text-center">{quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Out of Stock Message */}
              {outOfStock && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-red-700 dark:text-red-300 text-sm font-semibold text-center">
                    This product is currently out of stock. Please check back later.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className={`px-6 py-3 rounded-lg font-sans font-semibold flex-1 text-sm ${
                    outOfStock 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                  aria-label={outOfStock ? 'Product out of stock' : `Add ${productData.name} to cart`}
                >
                  {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button 
                  onClick={handleBuyNow}
                  disabled={outOfStock}
                  className={`bg-transparent border text-gray-900 dark:text-white px-6 py-3 rounded-lg font-sans font-semibold text-sm ${
                    outOfStock
                      ? 'border-gray-400 text-gray-400 cursor-not-allowed'
                      : 'border-gray-900 dark:border-white hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900'
                  }`}
                  aria-label={outOfStock ? 'Product out of stock' : `Buy ${productData.name} now`}
                >
                  Buy Now
                </button>
              </div>

              {/* Reviews Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-serif font-semibold text-gray-900 dark:text-white">
                    Customer Reviews
                  </h3>
                  <button 
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="text-amber-600 dark:text-amber-400 text-sm hover:text-amber-700 dark:hover:text-amber-300"
                    aria-label={showReviewForm ? 'Cancel review' : 'Write a review'}
                  >
                    {showReviewForm ? 'Cancel' : 'Write Review'}
                  </button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <form onSubmit={handleReviewSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Write Your Review</h4>
                    
                    <div className="mb-3">
                      <label className="block text-gray-700 dark:text-gray-300 text-xs mb-1">Your Name</label>
                      <input
                        type="text"
                        value={newReview.name}
                        onChange={(e) => setNewReview(prev => ({...prev, name: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:border-amber-500"
                        placeholder="Enter your name"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-gray-700 dark:text-gray-300 text-xs mb-1">Rating</label>
                      <div className="flex space-x-1">
                        {[1,2,3,4,5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleStarClick(star)}
                            className="text-amber-500 hover:text-amber-600"
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            <Star 
                              size={20} 
                              fill={star <= newReview.rating ? "currentColor" : "none"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-gray-700 dark:text-gray-300 text-xs mb-1">Your Review</label>
                      <textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview(prev => ({...prev, comment: e.target.value}))}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:border-amber-500"
                        placeholder="Share your experience with this product..."
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="bg-amber-500 text-white px-4 py-2 rounded text-sm hover:bg-amber-600 font-sans"
                    >
                      Submit Review
                    </button>
                  </form>
                )}

                {/* Reviews List */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {reviews.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                      No reviews yet. Be the first to review this product!
                    </p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{review.name}</span>
                          <div className="flex text-amber-500">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} size={12} fill="currentColor" />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">{review.comment}</p>
                        <p className="text-gray-500 dark:text-gray-500 text-xs">{review.date}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductPage;