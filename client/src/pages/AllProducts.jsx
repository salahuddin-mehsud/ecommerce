import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { Search, Filter, ChevronLeft, ChevronRight, Grid, List } from 'lucide-react';
import { productAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { toast } from 'react-hot-toast';
import ProductCard from '../components/ProductCard';

const AllProducts = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [priceFilter, setPriceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [productsPerPage, setProductsPerPage] = useState(9);

  const { formatPrice, getNumericPrice } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState('');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => { 
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const productsData = await productAPI.getAll();
      setProducts(productsData);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Extract categories from products (fallback if API route doesn't exist)
  const getCategoryName = useCallback((category) => {
    if (!category) return 'Uncategorized';
    
    // If category is an object with name (populated)
    if (typeof category === 'object' && category.name) {
      return category.name;
    }
    
    // If it's a string that's not a MongoDB ID (24 hex chars)
    if (typeof category === 'string' && !category.match(/^[0-9a-fA-F]{24}$/)) {
      return category;
    }
    
    // If it's a string ID or object with _id, we can't get the name without categories API
    // So we'll use a fallback mapping or just show "Uncategorized"
    return 'Uncategorized';
  }, []);

  // Build category filter list from products
  const categoryList = useMemo(() => {
    const categoryMap = {};
    
    // Count products in each category
    products.forEach(product => {
      const catName = getCategoryName(product.category);
      if (catName && catName !== 'Uncategorized') {
        categoryMap[catName] = (categoryMap[catName] || 0) + 1;
      }
    });
    
    // Create array and sort
    return Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, getCategoryName]);

  // Set category from URL
  useEffect(() => {
    if (categoryList.length === 0) {
      return;
    }
    const seg = location.pathname.split('/').filter(Boolean).pop();
    if (!seg) {
      setSelectedCategory('');
      return;
    }
    const label = decodeURIComponent(seg).replace(/[-_]/g, ' ').toLowerCase();

    const match = categoryList.find(c => c.name.toLowerCase() === label);
    if (match) {
      setSelectedCategory(match.name);
    } else {
      setSelectedCategory('');
    }
  }, [location.pathname, categoryList]);

  // Price range state
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  
  // Initialize price range from products
  useEffect(() => {
    if (!products || products.length === 0) return;
    
    const prices = products.map(p => {
      const price = getNumericPrice(p.price);
      return isNaN(price) ? 0 : price;
    }).filter(price => price > 0);
    
    if (prices.length === 0) return;
    
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    
    // Set the absolute min/max range
    setPriceRange([min, max]);
    // Set the current filter values
    setMinPrice(min);
    setMaxPrice(max);
  }, [products, getNumericPrice]);

  // helpers
  const isActiveHotDeal = useCallback((product) => {
    if (!product.hotDeal || !product.hotDealEnd) return false;
    const now = new Date();
    const dealEnd = new Date(product.hotDealEnd);
    return dealEnd > now;
  }, []);

  const isOutOfStock = useCallback((product) => product.stockQuantity === 0, []);

  // Filtering & sorting
  const filteredProducts = useMemo(() => {
    let filtered = (products || []).filter(product => {
      const name = (product.name || '').toLowerCase();
      const desc = (product.description || '').toLowerCase();
      return name.includes(debouncedSearch.toLowerCase()) || desc.includes(debouncedSearch.toLowerCase());
    });

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(p => {
        const catName = getCategoryName(p.category);
        return catName.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    // Price filter (categorical)
    if (priceFilter !== 'all' && priceFilter !== 'range') {
      filtered = filtered.filter(product => {
        const price = getNumericPrice(product.price) || 0;
        switch (priceFilter) {
          case 'under50': return price < 50;
          case '50to100': return price >= 50 && price <= 100;
          case 'over100': return price > 100;
          default: return true;
        }
      });
    }

    // Range slider filter if selected
    if (priceFilter === 'range') {
      filtered = filtered.filter(p => {
        const price = getNumericPrice(p.price) || 0;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': {
          const priceA = getNumericPrice(a.price) || 0;
          const priceB = getNumericPrice(b.price) || 0;
          return priceA - priceB;
        }
        case 'price-high': {
          const priceA = getNumericPrice(a.price) || 0;
          const priceB = getNumericPrice(b.price) || 0;
          return priceB - priceA;
        }
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return filtered;
  }, [products, debouncedSearch, sortBy, priceFilter, minPrice, maxPrice, selectedCategory, getNumericPrice, getCategoryName]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  useEffect(() => setCurrentPage(1), [debouncedSearch, sortBy, priceFilter, productsPerPage, selectedCategory, minPrice, maxPrice]);

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleProductsPerPageChange = useCallback((value) => {
    setProductsPerPage(parseInt(value, 10));
    setCurrentPage(1);
  }, []);

  // Handle range slider - SINGLE RANGE INPUT
  const handlePriceRangeChange = (e) => {
    const value = parseInt(e.target.value);
    setMaxPrice(value);
    setMinPrice(0);
    setPriceFilter('range');
  };

  // Reset price range
  const resetPriceRange = () => {
    setMinPrice(priceRange[0]);
    setMaxPrice(priceRange[1]);
    setPriceFilter('all');
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    return (
      <div className="flex justify-center items-center space-x-2 mt-12">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center px-3 py-2 rounded-lg text-sm font-sans ${
            currentPage === 1 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-amber-500'
          }`}
        >
          <ChevronLeft size={16} />
          <span className="ml-1">Prev</span>
        </button>

        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 rounded-lg cursor-pointer text-sm font-sans ${
              currentPage === page ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-amber-500 hover:text-white'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer font-sans ${
            currentPage === totalPages ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-amber-500'
          }`}
        >
          <span className="mr-1">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-24 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto" />
            <p className="mt-4 text-gray-400">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="pt-24 flex justify-center items-center">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
            <button onClick={fetchProducts} className="mt-4 bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-screen-2xl mx-auto px-4 py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Left sidebar */}
          <aside className="col-span-12 border border-gray-700/50 lg:col-span-3">
            <div className="sticky top-24">
              <div className="bg-black rounded-md p-6 space-y-6">
                {/* Search */}
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search products by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded bg-gray-900 text-gray-200 border border-gray-700 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase">Product Categories</h3>
                  <ul className="mt-4 space-y-2 text-gray-300">
                    {categoryList.length === 0 ? (
                      <li className="text-sm text-gray-400">No categories found</li>
                    ) : (
                      categoryList.map((c) => (
                        <li key={c.name} className="flex justify-between items-center">
                          <button
                            onClick={() => {
                              setSelectedCategory(prev => prev === c.name ? '' : c.name);
                              setCurrentPage(1);
                            }}
                            className={`text-left text-sm hover:text-white transition-all ${selectedCategory === c.name ? 'text-white font-semibold' : ''}`}
                          >
                            {c.name}
                          </button>
                          <span className="text-xs text-gray-400">({c.count})</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                {/* Price filter */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 uppercase mb-4">Filter by Price</h4>
                  
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2">
                      Up to: ${maxPrice}
                    </div>
                    <div className="text-xs text-gray-500">
                      Range: ${priceRange[0]} — ${priceRange[1]}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>${minPrice}</span>
                      <span>${maxPrice}</span>
                    </div>
                    <input
                      type="range"
                      min={priceRange[0]}
                      max={priceRange[1]}
                      value={maxPrice}
                      onChange={handlePriceRangeChange}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={() => { setPriceFilter('all'); setCurrentPage(1); }}
                      className={`px-3 py-2 text-sm rounded ${priceFilter === 'all' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    >
                      All Prices
                    </button>
                    <button
                      onClick={resetPriceRange}
                      className="px-3 py-2 text-sm rounded bg-gray-800 text-gray-300 hover:bg-gray-700"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => { setPriceFilter('under50'); setCurrentPage(1); }}
                      className={`px-2 py-2 text-xs rounded ${priceFilter === 'under50' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    >
                      Under $50
                    </button>
                    <button
                      onClick={() => { setPriceFilter('50to100'); setCurrentPage(1); }}
                      className={`px-2 py-2 text-xs rounded ${priceFilter === '50to100' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    >
                      $50-$100
                    </button>
                    <button
                      onClick={() => { setPriceFilter('over100'); setCurrentPage(1); }}
                      className={`px-2 py-2 text-xs rounded ${priceFilter === 'over100' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    >
                      Over $100
                    </button>
                  </div>
                </div>

                {/* Controls */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 uppercase">Controls</h4>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                        className="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-200 text-sm"
                      >
                        <option value="name">Sort by Name</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Products Per Page</label>
                      <select
                        value={productsPerPage}
                        onChange={(e) => handleProductsPerPageChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-200 text-sm"
                      >
                        <option value="9">9 per page</option>
                        <option value="13">13 per page</option>
                        <option value="19">19 per page</option>
                        <option value="25">25 per page</option>
                      </select>
                    </div>

                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${viewMode === 'grid' ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-300'} rounded hover:bg-gray-600`}
                        aria-label="Grid view"
                      >
                        <Grid size={16} />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 ${viewMode === 'list' ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-300'} rounded hover:bg-gray-600`}
                        aria-label="List view"
                      >
                        <List size={16} />
                      </button>
                      <div className="text-sm text-gray-400 ml-auto">{filteredProducts.length} items</div>
                    </div>
                  </div>
                </div>

                {/* Clear filters button */}
                <div>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPriceFilter('all');
                      setSortBy('name');
                      setSelectedCategory('');
                      setProductsPerPage(9);
                      setViewMode('grid');
                      setCurrentPage(1);
                      resetPriceRange();
                    }}
                    className="w-full bg-gray-800 text-gray-200 px-3 py-2 rounded hover:bg-amber-500 hover:text-black transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="col-span-12 lg:col-span-9">
            <div className="mb-6">
              <div className="text-gray-400 mb-2">
                Showing {indexOfFirstProduct + 1}–
                {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
                {debouncedSearch && <span> for <span className="text-amber-400">"{debouncedSearch}"</span></span>}
                {filteredProducts.length > 0 && <span> (Page {currentPage} of {totalPages})</span>}
              </div>
            </div>

            {currentProducts.length > 0 ? (
              <>
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                  {currentProducts.map(product => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      variant={isActiveHotDeal(product) ? "hot-deal" : "default"}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {renderPagination()}
              </>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Search size={64} className="mx-auto" />
                <h3 className="text-2xl font-semibold text-white mt-6">No products found</h3>
                <p className="mt-2">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </main>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AllProducts;