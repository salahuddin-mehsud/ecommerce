import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { Flame } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { memo, useMemo, useCallback, useState } from 'react';

const ProductCard = memo(({ 
  product, 
  variant = 'default',
  viewMode = 'grid',
  onAddToCart 
}) => {
  const { formatPrice, getNumericPrice } = useCurrency();
  const { addToCart } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isOutOfStock = useMemo(() => product.stockQuantity === 0, [product.stockQuantity]);

  const isActiveHotDeal = useMemo(() => {
    if (!product.hotDeal || !product.hotDealEnd) return false;
    const now = new Date();
    const dealEnd = new Date(product.hotDealEnd);
    return dealEnd > now;
  }, [product.hotDeal, product.hotDealEnd]);

  const handleAddToCartClick = useCallback(() => {
    if (isOutOfStock) {
      toast.error('This product is currently out of stock');
      return;
    }
    
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addToCart(product);
    }
  }, [isOutOfStock, onAddToCart, product, addToCart]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  // Memoized product image source
  const productImageSrc = useMemo(() => {
    if (Array.isArray(product.images)) {
      return product.images[0] || '/placeholder-image.jpg';
    }
    return product.images?.main?.url || '/placeholder-image.jpg';
  }, [product.images]);

  // Memoized card classes - FULLY TRANSPARENT with fixed height
const cardClasses = useMemo(() => {
  const baseClasses = "rounded-lg overflow-hidden text-gray-900 dark:text-white transition-all duration-300 bg-transparent";
  
  // Fixed height for all cards - adjust these values as needed
  const heightClasses = viewMode === 'list' 
    ? "min-h-[200px]" 
    : "h-[500px]"; // Fixed total height for grid cards
  
  // Common border for all cards
  const borderClass = "border border-gray-200/30 dark:border-gray-700/30";
  
  switch (variant) {
    case 'featured':
      return `${baseClasses} ${heightClasses} ${borderClass} ${
        isOutOfStock 
          ? 'border-gray-300/50 dark:border-gray-600/50 opacity-80' 
          : 'border-amber-200/50 dark:border-amber-800/50'
      }`;
    
    case 'hot-deal':
      return `${baseClasses} ${heightClasses} ${borderClass} ${isOutOfStock ? 'opacity-80' : ''}`;
    
    default:
      return `${baseClasses} ${heightClasses} ${borderClass} ${isOutOfStock ? 'opacity-80' : ''}`;
  }
}, [variant, isOutOfStock, viewMode]);

  // Memoized image classes - FIXED HEIGHT for grid, relative for list
  const imageClasses = useMemo(() => {
    if (viewMode === 'list') {
      return "md:w-48 h-48 bg-transparent flex items-center justify-center overflow-hidden relative flex-shrink-0";
    }
    
    // Fixed height for grid view images
    return "h-64 bg-transparent flex items-center justify-center overflow-hidden relative";
  }, [viewMode]);

  // Memoized badges - Make backgrounds semi-transparent
  const badges = useMemo(() => {
    const badgesArray = [];

    if (isOutOfStock) {
      badgesArray.push(
        <div 
          key="out-of-stock" 
          className="absolute top-3 right-3 font-[Inter] z-10 bg-red-500/80 text-white px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm"
          aria-label="Out of Stock"
        >
          Out of Stock
        </div>
      );
    }

    if (variant === 'hot-deal' && isActiveHotDeal && !isOutOfStock) {
      badgesArray.push(
        <div 
          key="hot-deal" 
          className="absolute top-3 left-3 z-10 bg-red-500/80 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1 backdrop-blur-sm"
          aria-label={`Hot Deal - ${product.dealPercentage}% OFF`}
        >
          <Flame size={14} aria-hidden="true" />
          <span>-{product.dealPercentage}% OFF</span>
        </div>
      );
    }

    if (variant === 'featured') {
      badgesArray.push(
        <div 
          key="featured-header" 
          className={`text-center py-1 text-sm font-semibold ${
            isOutOfStock ? 'bg-gray-500/80' : 'bg-amber-500/80'
          } text-white backdrop-blur-sm`}
          aria-label={isOutOfStock ? 'Out of Stock Featured Product' : 'Featured Product'}
        >
          {isOutOfStock ? 'OUT OF STOCK' : 'FEATURED'}
        </div>
      );
    }

    return badgesArray;
  }, [isOutOfStock, variant, isActiveHotDeal, product.dealPercentage]);

  // Memoized content - FIXED STRUCTURE with consistent spacing
  const content = useMemo(() => {
    const priceClass = isOutOfStock && variant === 'featured' 
      ? 'text-gray-500' 
      : 'text-amber-600 dark:text-amber-400';

    // For grid view - use fixed heights for each section
    if (viewMode === 'grid') {
      return (
        <div className="p-6 font-[Inter]  bg-transparent flex flex-col h-[calc(500px-16rem)]"> {/* 500px total - 16rem image = content height */}
          {/* Product Name - Fixed 2 lines max */}
          <div className="h-[3.5rem] mb-3">
            <h3 className={`${
              variant === 'featured' ? 'text-xl' : 'text-lg'
            } line-clamp-2`}>
              {product.name}
            </h3>
          </div>
          
          {/* Description - Fixed 3 lines max */}
          <div className="h-[4.5rem] mb-4 flex-grow-0">
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
              {product.description}
            </p>
          </div>
          
          {/* Price and Buttons - Fixed at bottom */}
          <div className="flex justify-between items-center mt-auto">
            <span className={`${
              variant === 'featured' ? 'text-lg' : 'text-base md:text-lg'
            } ${priceClass}`}>
              {formatPrice(getNumericPrice(product.price))}
            </span>
            
            <div className="flex space-x-2">
              <Link 
                to={`/product/${product._id}`}
                className="bg-transparent border border-gray-700/50 dark:border-white/50 text-gray-900 dark:text-white px-4 py-2 rounded text-sm hover:bg-gray-900/10 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white font-[Inter]  transition-colors duration-200 whitespace-nowrap"
                aria-label={`View details for ${product.name}`}
              >
                View
              </Link>
              <button 
                onClick={handleAddToCartClick}
                disabled={isOutOfStock}
                className={`px-4 py-2 rounded text-sm font-[Inter]  transition-colors duration-200 whitespace-nowrap ${
                  isOutOfStock
                    ? 'bg-gray-400/80 text-gray-200 cursor-not-allowed'
                    : 'bg-amber-500/80 text-white hover:bg-amber-600/80 cursor-pointer'
                } backdrop-blur-sm`}
                aria-label={isOutOfStock ? 'Product out of stock' : `Add ${product.name} to cart`}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // For list view - different layout
    return (
      <div className="flex-1 p-6 bg-transparent flex flex-col">
        <h3 className={`font-[Inter] font-semibold mb-2 ${
          variant === 'featured' ? 'text-xl' : 'text-lg'
        }`}>
          {product.name}
        </h3>
        
        <p className={`text-gray-600 dark:text-gray-400 mb-4 font-[Inter]  ${
          variant === 'featured' 
            ? 'text-sm line-clamp-2' 
            : 'text-sm line-clamp-3'
        }`}>
          {product.description}
        </p>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mt-auto">
          <span className={`font-bold font-[Inter]  ${
            variant === 'featured' ? 'text-lg' : 'text-base md:text-lg'
          } ${priceClass}`}>
            {formatPrice(getNumericPrice(product.price))}
          </span>
          
          <div className="flex space-x-2">
            <Link 
              to={`/product/${product._id}`}
              className="bg-transparent border border-gray-700/50 dark:border-white/50 text-gray-900 dark:text-white px-4 py-2 rounded text-sm hover:bg-gray-900/10 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white font-[Inter]  transition-colors duration-200 whitespace-nowrap"
              aria-label={`View details for ${product.name}`}
            >
              View Details
            </Link>
            <button 
              onClick={handleAddToCartClick}
              disabled={isOutOfStock}
              className={`px-4 py-2 rounded text-sm font-sans transition-colors duration-200 whitespace-nowrap ${
                isOutOfStock
                  ? 'bg-gray-400/80 text-gray-200 cursor-not-allowed'
                  : 'bg-amber-500/80 text-white hover:bg-amber-600/80 cursor-pointer'
              } backdrop-blur-sm`}
              aria-label={isOutOfStock ? 'Product out of stock' : `Add ${product.name} to cart`}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    );
  }, [product, variant, viewMode, isOutOfStock, formatPrice, getNumericPrice, handleAddToCartClick]);

  // Image component with loading state
  const ImageComponent = useMemo(() => (
    <div className={imageClasses}>
      <img 
        src={imageError ? '/placeholder-image.jpg' : productImageSrc}
        alt={product.name}
        className={`w-full h-full object-cover transition-opacity duration-300 rounded-lg ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 font-[Inter]  bg-transparent flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500/50 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {badges}
    </div>
  ), [imageClasses, productImageSrc, product.name, imageLoaded, imageError, handleImageLoad, handleImageError, badges]);

  // For list view
  if (viewMode === 'list') {
    return (
      <div className={cardClasses}>
        <div className="flex flex-col md:flex-row bg-transparent">
          {ImageComponent}
          {content}
        </div>
      </div>
    );
  }

  // For grid view - Fixed height column layout
  return (
    <div className={`${cardClasses} flex flex-col`}>
      {variant === 'featured' && badges}
      {ImageComponent}
      {content}
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;