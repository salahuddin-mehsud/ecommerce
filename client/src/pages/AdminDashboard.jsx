import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { toast } from 'react-hot-toast';
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  X,
  Save,
  ArrowLeft,
  Folder,
  Truck,
  Settings,
  Layers
} from 'lucide-react';
import { adminAPI } from '../services/adminApi';
import logo from '../assets/logo.webp';



const AdminDashboard = () => {
  const { admin, logout, isAuthenticated } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(null);
  const [categories, setCategories] = useState([]);
  const [deliveryRules, setDeliveryRules] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showDeliveryRuleForm, setShowDeliveryRuleForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingDeliveryRule, setEditingDeliveryRule] = useState(null);
  const [activeDeliveryTab, setActiveDeliveryTab] = useState('rules');
  // Add this with your other state variables
const [showAllLowStock, setShowAllLowStock] = useState(false);
const [countries, setCountries] = useState([]);
const [showCountryForm, setShowCountryForm] = useState(false);
const [editingCountry, setEditingCountry] = useState(null);

// Add with other form states
const [countryForm, setCountryForm] = useState({
  countryCode: '',
  countryName: '',
  cost: 0,
  taxPercentage: 8,
  isActive: true
});
  // Product form state
  const [productForm, setProductForm] = useState({
  name: '',
  price: '',
  description: '',
  category: '',
  stockQuantity: 0,
  featured: false,
  hotDeal: false,
  hotDealEnd: '',
  dealPercentage: 0,
  images: [],
  existingImages: [] // Add this
});

  // Order update state
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const [categoryForm, setCategoryForm] = useState({
  name: '',
  description: '',
  sortOrder: 0,
  image: null,
  imagePreview: null
});

// Delivery rule form state
const [deliveryRuleForm, setDeliveryRuleForm] = useState({
  minPieces: 1,
  maxPieces: 1,
  deliveryCost: 0,
  description: '',
  country: 'ALL',
  isActive: true
});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    } else {
      fetchDashboardData();
    }
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
  setLoading(true);
  try {
    const [statsRes, ordersRes, productsRes, categoriesRes, deliveryRulesRes, countriesRes] = await Promise.all([
      adminAPI.getDashboardStats().catch(() => ({ success: false, data: null })),
      adminAPI.getOrders().catch(() => ({ success: false, data: [] })),
      adminAPI.getProducts().catch(() => ({ success: false, data: [] })),
      adminAPI.getCategories().catch(() => ({ success: false, data: [] })),
      adminAPI.getDeliveryRules().catch(() => ({ success: false, data: [] })),
      adminAPI.getCountries().catch(() => ({ success: false, data: [] }))
    ]);

    if (statsRes?.success) setStats(statsRes.data);
    if (ordersRes?.success) setOrders(ordersRes.data || []);
    if (productsRes?.success) setProducts(productsRes.data || []);
    if (categoriesRes?.success) setCategories(categoriesRes.data || []);
    if (deliveryRulesRes?.success) setDeliveryRules(deliveryRulesRes.data || []);
    if (countriesRes?.success) setCountries(countriesRes.data || []);
  } catch (error) {
    toast.error('Error fetching dashboard data');
    console.error(error);
    // Initialize with empty arrays to prevent undefined errors
    setOrders([]);
    setProducts([]);
    setCategories([]);
    setDeliveryRules([]);
    setCountries([]);
  } finally {
    setLoading(false);
  }
};


// Add this function after your state declarations
const getCategoryName = (categoryId) => {
  if (!categoryId) return 'Uncategorized';
  
  // If category is already a name (string), return it
  if (typeof categoryId === 'string' && !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
    return categoryId;
  }
  
  // Find category by ID in categories array
  const category = categories.find(cat => 
    cat._id === categoryId || 
    (typeof categoryId === 'object' && categoryId._id && cat._id === categoryId._id)
  );
  
  return category ? category.name : 'Uncategorized';
};

useEffect(() => {
  if (showProductForm && categories.length === 0) {
    // Fetch categories if not loaded
    const fetchCategories = async () => {
      try {
        const result = await adminAPI.getCategories();
        if (result.success) {
          setCategories(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }
}, [showProductForm, categories.length]);

const handleAddCountry = () => {
  setEditingCountry(null);
  setCountryForm({
    countryCode: '',
    countryName: '',
    cost: 0,
    taxPercentage: 8,
    isActive: true
  });
  setShowCountryForm(true);
};

const handleRemoveExistingImage = (index) => {
  setProductForm(prev => ({
    ...prev,
    existingImages: prev.existingImages.filter((_, i) => i !== index)
  }));
};

const handleRemoveNewImage = (index) => {
  setProductForm(prev => ({
    ...prev,
    images: prev.images.filter((_, i) => i !== index)
  }));
};

const handleEditCountry = (country) => {
  setEditingCountry(country);
  setCountryForm({
    countryCode: country.country,
    countryName: country.countryName,
    cost: country.cost,
    taxPercentage: country.taxPercentage,
    isActive: country.isActive
  });
  setShowCountryForm(true);
};

const handleDeleteCountry = async (id) => {
  if (!window.confirm('Are you sure you want to delete this country?')) return;
  
  try {
    const result = await adminAPI.deleteCountry(id);
    if (result.success) {
      toast.success('Country deleted successfully');
      fetchDashboardData();
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    toast.error('Error deleting country');
    console.error(error);
  }
};

const handleCountryFormChange = (e) => {
  const { name, value, type, checked } = e.target;
  setCountryForm(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : 
            name === 'taxPercentage' ? parseFloat(value) || 0 :
            name === 'cost' ? parseFloat(value) || 0 :
            value
  }));
};

const handleCountrySubmit = async (e) => {
  e.preventDefault();
  
  try {
    let result;
    if (editingCountry) {
      result = await adminAPI.updateCountry(editingCountry._id, countryForm);
    } else {
      result = await adminAPI.createCountry(countryForm);
    }

    if (result.success) {
      toast.success(`Country ${editingCountry ? 'updated' : 'added'} successfully`);
      setShowCountryForm(false);
      setEditingCountry(null);
      fetchDashboardData();
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    toast.error('Error saving country');
    console.error(error);
  }
};

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Product Management Functions
  const handleAddProduct = () => {
  setEditingProduct(null);
  setProductForm({
    name: '',
    price: '',
    description: '',
    category: categories && categories.length > 0 ? categories.find(c => c.name === 'perfume')?._id || 'perfume' : 'perfume',
    stockQuantity: 0,
    featured: false,
    hotDeal: false,
    hotDealEnd: '',
    dealPercentage: 0,
    images: [],
    existingImages: []
  });
  setShowProductForm(true);
};

  const handleEditProduct = (product) => {
  setEditingProduct(product);
  setProductForm({
    name: product.name,
    price: product.price.replace('$', '').replace('USD', ''),
    description: product.description,
    category: product.category || (categories && categories.length > 0 ? categories.find(c => c.name === 'perfume')?._id || 'perfume' : 'perfume'),
    stockQuantity: product.stockQuantity || 0,
    featured: product.featured || false,
    hotDeal: product.hotDeal || false,
    hotDealEnd: product.hotDealEnd ? new Date(product.hotDealEnd).toISOString().split('T')[0] : '',
    dealPercentage: product.dealPercentage || 0,
    images: [],
    existingImages: product.images || []
  });
  setShowProductForm(true);
};

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const result = await adminAPI.deleteProduct(id);
      if (result.success) {
        toast.success('Product deleted successfully');
        fetchDashboardData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error deleting product');
      console.error(error);
    }
  };

  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setProductForm(prev => ({
      ...prev,
      images: files
    }));
  };

 const handleProductSubmit = async (e) => {
  e.preventDefault();
  
  // Validate total images count
  const totalImages = productForm.existingImages.length + productForm.images.length;
  if (totalImages > 4) {
    toast.error('Maximum 4 images allowed');
    return;
  }

  const formData = new FormData();
  formData.append('name', productForm.name);
  formData.append('price', productForm.price);
  formData.append('description', productForm.description);
  formData.append('category', productForm.category);
  formData.append('stockQuantity', productForm.stockQuantity);
  formData.append('featured', productForm.featured);
  formData.append('hotDeal', productForm.hotDeal);
  
  if (productForm.hotDeal) {
    formData.append('hotDealEnd', productForm.hotDealEnd);
    formData.append('dealPercentage', productForm.dealPercentage);
  }
  
  // For editing, send existing images that should be kept
  if (editingProduct) {
    formData.append('keepExistingImages', JSON.stringify(productForm.existingImages));
  }
  
  // Add new images
  productForm.images.forEach((file, index) => {
    formData.append('images', file);
  });

  try {
    let result;
    if (editingProduct) {
      result = await adminAPI.updateProduct(editingProduct._id, formData);
    } else {
      result = await adminAPI.createProduct(formData);
    }

    if (result.success) {
      toast.success(`Product ${editingProduct ? 'updated' : 'created'} successfully`);
      setShowProductForm(false);
      setEditingProduct(null);
      fetchDashboardData();
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    toast.error('Error saving product');
    console.error(error);
  }
};

  // Order Management Functions
  const handleUpdateOrderStatus = async (order) => {
    if (!orderStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      const result = await adminAPI.updateOrderStatus(order._id, orderStatus);
      if (result.success) {
        toast.success('Order status updated successfully');
        setUpdatingOrder(null);
        setOrderStatus('');
        fetchDashboardData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error updating order status');
      console.error(error);
    }
  };

  const handleUpdatePaymentStatus = async (order) => {
    if (!paymentStatus) {
      toast.error('Please select a payment status');
      return;
    }

    try {
      const result = await adminAPI.updatePaymentStatus(order._id, paymentStatus);
      if (result.success) {
        toast.success('Payment status updated successfully');
        setUpdatingOrder(null);
        setPaymentStatus('');
        fetchDashboardData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error updating payment status');
      console.error(error);
    }
  };

  const handleViewOrder = (order) => {
    setShowOrderDetail(order);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const handleAddCategory = () => {
  setEditingCategory(null);
  setCategoryForm({
    name: '',
    description: '',
    sortOrder: 0,
    image: null,
    imagePreview: null
  });
  setShowCategoryForm(true);
};

const handleEditCategory = (category) => {
  setEditingCategory(category);
  setCategoryForm({
    name: category.name,
    description: category.description || '',
    sortOrder: category.sortOrder || 0,
    image: null,
    imagePreview: category.image?.url || null
  });
  setShowCategoryForm(true);
};

const handleDeleteCategory = async (id) => {
  if (!window.confirm('Are you sure you want to delete this category?')) return;
  
  try {
    const result = await adminAPI.deleteCategory(id);
    if (result.success) {
      toast.success('Category deleted successfully');
      fetchDashboardData();
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    toast.error('Error deleting category');
    console.error(error);
  }
};

const handleCategoryFormChange = (e) => {
  const { name, value } = e.target;
  setCategoryForm(prev => ({
    ...prev,
    [name]: name === 'sortOrder' ? parseInt(value) || 0 : value
  }));
};

const handleCategoryImageUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    setCategoryForm(prev => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file)
    }));
  }
};

const handleCategorySubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('name', categoryForm.name);
  formData.append('description', categoryForm.description);
  formData.append('sortOrder', categoryForm.sortOrder);
  if (categoryForm.image) {
    formData.append('image', categoryForm.image);
  }

  try {
    let result;
    if (editingCategory) {
      result = await adminAPI.updateCategory(editingCategory._id, formData);
    } else {
      result = await adminAPI.createCategory(formData);
    }

    if (result.success) {
      toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
      setShowCategoryForm(false);
      setEditingCategory(null);
      fetchDashboardData();
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    toast.error('Error saving category');
    console.error(error);
  }
};

// Add Delivery Rule Management Functions
const handleAddDeliveryRule = () => {
  setEditingDeliveryRule(null);
  setDeliveryRuleForm({
    minPieces: 1,
    maxPieces: 1,
    deliveryCost: 0,
    description: '',
    country: 'ALL',
    isActive: true
  });
  setShowDeliveryRuleForm(true);
};

const handleEditDeliveryRule = (rule) => {
  setEditingDeliveryRule(rule);
  setDeliveryRuleForm({
    minPieces: rule.minPieces,
    maxPieces: rule.maxPieces,
    deliveryCost: rule.deliveryCost,
    description: rule.description || '',
    country: rule.country || 'ALL',
    isActive: rule.isActive
  });
  setShowDeliveryRuleForm(true);
};

const handleDeleteDeliveryRule = async (id) => {
  if (!window.confirm('Are you sure you want to delete this delivery rule?')) return;
  
  try {
    const result = await adminAPI.deleteDeliveryRule(id);
    if (result.success) {
      toast.success('Delivery rule deleted successfully');
      fetchDashboardData();
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    toast.error('Error deleting delivery rule');
    console.error(error);
  }
};

const handleDeliveryRuleFormChange = (e) => {
  const { name, value, type, checked } = e.target;
  setDeliveryRuleForm(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : 
            name.includes('Pieces') ? parseInt(value) || 0 :
            name === 'deliveryCost' ? parseFloat(value) || 0 :
            value
  }));
};

const handleDeliveryRuleSubmit = async (e) => {
  e.preventDefault();
  
  if (deliveryRuleForm.minPieces > deliveryRuleForm.maxPieces) {
    toast.error('Minimum pieces cannot be greater than maximum pieces');
    return;
  }

  try {
    let result;
    if (editingDeliveryRule) {
      result = await adminAPI.updateDeliveryRule(editingDeliveryRule._id, deliveryRuleForm);
    } else {
      result = await adminAPI.createDeliveryRule(deliveryRuleForm);
    }

    if (result.success) {
      toast.success(`Delivery rule ${editingDeliveryRule ? 'updated' : 'created'} successfully`);
      setShowDeliveryRuleForm(false);
      setEditingDeliveryRule(null);
      fetchDashboardData();
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    toast.error('Error saving delivery rule');
    console.error(error);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center">
                  <img
                    src={logo}
                    alt="Daily"
                    className="h-18 w-auto object-contain"
                  />
                </Link>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    activeTab === 'products'
                      ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    activeTab === 'orders'
                      ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Orders
                </button>
                <button
  onClick={() => setActiveTab('categories')}
  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
    activeTab === 'categories'
      ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
  }`}
>
  Categories
</button>
<button
  onClick={() => setActiveTab('delivery')}
  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
    activeTab === 'delivery'
      ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
  }`}
>
  Delivery
</button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    activeTab === 'analytics'
                      ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Analytics
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">{admin?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Product Form Modal */}
        {showProductForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    onClick={() => setShowProductForm(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={productForm.name}
                        onChange={handleProductFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price (USD) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={productForm.price}
                        onChange={handleProductFormChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleProductFormChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
  name="category"
  value={productForm.category}
  onChange={handleProductFormChange}
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
>
  <option value="">Select Category</option>
  {categories && categories.length > 0 ? (
    categories
      .filter(cat => cat.isActive)
      .map(category => (
        <option key={category._id} value={category._id}>
          {category.name}
        </option>
      ))
  ) : (
    <option value="perfume">Perfume (Default)</option>
  )}
</select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        name="stockQuantity"
                        value={productForm.stockQuantity}
                        onChange={handleProductFormChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="featured"
                          checked={productForm.featured}
                          onChange={handleProductFormChange}
                          className="rounded text-amber-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Featured Product</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <label className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        name="hotDeal"
                        checked={productForm.hotDeal}
                        onChange={handleProductFormChange}
                        className="rounded text-red-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hot Deal</span>
                    </label>

                    {productForm.hotDeal && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                            Deal Percentage (%)
                          </label>
                          <input
                            type="number"
                            name="dealPercentage"
                            value={productForm.dealPercentage}
                            onChange={handleProductFormChange}
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-700 text-red-700 dark:text-red-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                            Deal End Date
                          </label>
                          <input
                            type="date"
                            name="hotDealEnd"
                            value={productForm.hotDealEnd}
                            onChange={handleProductFormChange}
                            className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-700 text-red-700 dark:text-red-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Product Images (Max 4)
  </label>
  
  {/* Show existing images */}
  {productForm.existingImages && productForm.existingImages.length > 0 && (
    <div className="mb-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Existing Images:</p>
      <div className="flex flex-wrap gap-2">
        {productForm.existingImages.map((image, index) => (
          <div key={`existing-${index}`} className="relative">
            <img
              src={image.main?.url || image}
              alt={`Existing ${index + 1}`}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => handleRemoveExistingImage(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Show new images preview */}
  {productForm.images && productForm.images.length > 0 && (
    <div className="mb-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">New Images:</p>
      <div className="flex flex-wrap gap-2">
        {productForm.images.map((file, index) => (
          <div key={`new-${index}`} className="relative">
            <img
              src={URL.createObjectURL(file)}
              alt={`Preview ${index + 1}`}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => handleRemoveNewImage(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* File upload */}
  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
    <div className="space-y-1 text-center">
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <div className="flex text-sm text-gray-600 dark:text-gray-400">
        <label className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-amber-600 hover:text-amber-500">
          <span>Upload images</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="sr-only"
          />
        </label>
        <p className="pl-1">or drag and drop</p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        PNG, JPG, GIF up to 10MB. Max 4 images total.
      </p>
      <p className="text-xs text-amber-600 mt-2">
        Total images: {productForm.existingImages.length + productForm.images.length}/4
      </p>
    </div>
  </div>
</div>

                  <div className="flex justify-end space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center"
                    >
                      <Save size={16} className="mr-2" />
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Category Management</h2>
      <button
        onClick={handleAddCategory}
        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <Plus size={20} />
        <span>Add Category</span>
      </button>
    </div>

    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Sort Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((category) => (
              <tr key={category._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-10 w-10 flex-shrink-0">
                    {category.image?.url ? (
                      <img
                        className="h-10 w-10 rounded object-cover"
                        src={category.image.url}
                        alt={category.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Folder size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {category.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {category.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {category.sortOrder}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    category.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category._id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

// In your AdminDashboard.jsx, update the delivery section:
{activeTab === 'delivery' && (
  <div className="space-y-6">
    {/* Tabs for Delivery Rules and Countries */}
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveDeliveryTab('rules')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeDeliveryTab === 'rules'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Delivery Rules
        </button>
        <button
          onClick={() => setActiveDeliveryTab('countries')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeDeliveryTab === 'countries'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Countries & Tax
        </button>
      </nav>
    </div>

    {activeDeliveryTab === 'rules' && (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Rules Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Set delivery costs based on number of pieces in an order
            </p>
          </div>
          <button
            onClick={handleAddDeliveryRule}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Rule</span>
          </button>
        </div>

        {/* Existing delivery rules table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              {/* ... existing delivery rules table content ... */}
            </table>
          </div>
        </div>
      </div>
    )}

    {activeDeliveryTab === 'countries' && (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Country & Tax Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage countries where delivery is available and set tax rates
            </p>
          </div>
          <button
            onClick={handleAddCountry}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Country</span>
          </button>
        </div>

        {/* Countries Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Country Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Country Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Base Shipping Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tax Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {countries.map((country) => (
                  <tr key={country._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {country.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {country.countryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${country.cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {country.taxPercentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        country.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {country.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleEditCountry(country)}
                        className="text-amber-600 dark:text-amber-400 hover:text-amber-700"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCountry(country._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
  </div>
)}

// Add Country Form Modal
{showCountryForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingCountry ? 'Edit Country' : 'Add New Country'}
          </h2>
          <button
            onClick={() => setShowCountryForm(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleCountrySubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country Code *
              </label>
              <input
                type="text"
                name="countryCode"
                value={countryForm.countryCode}
                onChange={handleCountryFormChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                maxLength={3}
                placeholder="e.g., US"
              />
              <p className="text-xs text-gray-500 mt-1">ISO 3166-1 alpha-2 code (2 letters)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country Name *
              </label>
              <input
                type="text"
                name="countryName"
                value={countryForm.countryName}
                onChange={handleCountryFormChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                placeholder="e.g., United States"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Base Shipping Cost ($)
              </label>
              <input
                type="number"
                name="cost"
                value={countryForm.cost}
                onChange={handleCountryFormChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Base cost for delivery rules</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tax Percentage (%) *
              </label>
              <input
                type="number"
                name="taxPercentage"
                value={countryForm.taxPercentage}
                onChange={handleCountryFormChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={countryForm.isActive}
              onChange={handleCountryFormChange}
              className="h-4 w-4 text-amber-600 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active (Delivery available)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => setShowCountryForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center"
            >
              <Save size={16} className="mr-2" />
              {editingCountry ? 'Update Country' : 'Add Country'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

{/* Category Form Modal */}
{showCategoryForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={() => setShowCategoryForm(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={categoryForm.name}
              onChange={handleCategoryFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={categoryForm.description}
              onChange={handleCategoryFormChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                name="sortOrder"
                value={categoryForm.sortOrder}
                onChange={handleCategoryFormChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                {categoryForm.imagePreview ? (
                  <img
                    src={categoryForm.imagePreview}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded-lg mx-auto mb-2"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Folder size={24} className="text-gray-400" />
                  </div>
                )}
                <label className="cursor-pointer text-sm text-amber-600 hover:text-amber-700">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCategoryImageUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => setShowCategoryForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center"
            >
              <Save size={16} className="mr-2" />
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

{/* Delivery Rule Form Modal */}
{showDeliveryRuleForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingDeliveryRule ? 'Edit Delivery Rule' : 'Add New Delivery Rule'}
          </h2>
          <button
            onClick={() => setShowDeliveryRuleForm(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleDeliveryRuleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Pieces *
              </label>
              <input
                type="number"
                name="minPieces"
                value={deliveryRuleForm.minPieces}
                onChange={handleDeliveryRuleFormChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum Pieces *
              </label>
              <input
                type="number"
                name="maxPieces"
                value={deliveryRuleForm.maxPieces}
                onChange={handleDeliveryRuleFormChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Use 999999 for "and above"</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Delivery Cost ($) *
            </label>
            <input
              type="number"
              name="deliveryCost"
              value={deliveryRuleForm.deliveryCost}
              onChange={handleDeliveryRuleFormChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country
            </label>
            <select
              name="country"
              value={deliveryRuleForm.country}
              onChange={handleDeliveryRuleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="ALL">All Countries</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="IN">India</option>
              <option value="PK">Pakistan</option>
              <option value="AE">UAE</option>
              <option value="SA">Saudi Arabia</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Country-specific rules override "ALL" rules</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              name="description"
              value={deliveryRuleForm.description}
              onChange={handleDeliveryRuleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Standard delivery for 1-3 pieces"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={deliveryRuleForm.isActive}
              onChange={handleDeliveryRuleFormChange}
              className="h-4 w-4 text-amber-600 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active Rule
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => setShowDeliveryRuleForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center"
            >
              <Save size={16} className="mr-2" />
              {editingDeliveryRule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

        {/* Order Detail Modal */}


        {showOrderDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Order #{showOrderDetail.orderId}
                  </h2>
                  <button
                    onClick={() => setShowOrderDetail(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Customer Information
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Name:</strong> {showOrderDetail.customer.firstName} {showOrderDetail.customer.lastName}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Email:</strong> {showOrderDetail.customer.email}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Address:</strong> {showOrderDetail.customer.address}, {showOrderDetail.customer.city}, {showOrderDetail.customer.country}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>ZIP Code:</strong> {showOrderDetail.customer.zipCode}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Order Details
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Order Date:</strong> {new Date(showOrderDetail.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Status:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(showOrderDetail.status)}`}>
                            {showOrderDetail.status}
                          </span>
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Payment Status:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(showOrderDetail.paymentStatus)}`}>
                            {showOrderDetail.paymentStatus}
                          </span>
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Payment Method:</strong> {showOrderDetail.paymentMethod || 'Card'}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Total:</strong> ${showOrderDetail.total?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Order Items
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      {showOrderDetail.items?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-600 last:border-0">
                          <div className="flex items-center space-x-4">
                            <img
                              src={item.image || '/placeholder-image.jpg'}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowOrderDetail(null)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Order Status Modal */}
        {updatingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Update Order #{updatingOrder.orderId}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Order Status
                    </label>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Payment Status</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setUpdatingOrder(null)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (orderStatus) handleUpdateOrderStatus(updatingOrder);
                        if (paymentStatus) handleUpdatePaymentStatus(updatingOrder);
                      }}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      ${stats.totalRevenue?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalOrders || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalProducts || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.lowStockProducts?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.recentOrders?.map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {order.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {order.customer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          ${order.total?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-700"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setUpdatingOrder(order);
                              setOrderStatus(order.status);
                              setPaymentStatus(order.paymentStatus);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product Management</h2>
              <button
                onClick={handleAddProduct}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Product</span>
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Hot Deal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded object-cover"
                                src={product.images?.[0]?.main?.url || '/placeholder-image.jpg'}
                                alt={product.name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                 {getCategoryName(product.category)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {product.price}
                          {product.hotDeal && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              -{product.dealPercentage}%
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {product.stockQuantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.inStock 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {product.hotDeal ? 'Active' : 'No'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-700"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Management</h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {order.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.customer.firstName} {order.customer.lastName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {order.customer.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {order.items?.length || 0} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          ${order.total?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-700"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setUpdatingOrder(order);
                              setOrderStatus(order.status);
                              setPaymentStatus(order.paymentStatus);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {activeTab === 'analytics' && (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track sales, performance, and top products
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
          <option value="7d">Last 7 days</option>
          <option value="30d" selected>Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
        <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm">
          Export Report
        </button>
      </div>
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
            <p className="text-2xl font-bold mt-2">${stats?.totalRevenue?.toLocaleString() || '0.00'}</p>
            <div className="flex items-center mt-2">
              <TrendingUp size={16} className="mr-1" />
              <span className="text-sm">+12.5% from last month</span>
            </div>
          </div>
          <div className="bg-blue-400/20 p-3 rounded-full">
            <DollarSign size={24} />
          </div>
        </div>
        <div className="mt-4 h-2 w-full bg-blue-400/30 rounded-full overflow-hidden">
          <div className="h-full bg-white w-3/4 rounded-full"></div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium">Total Orders</p>
            <p className="text-2xl font-bold mt-2">{stats?.totalOrders || 0}</p>
            <div className="flex items-center mt-2">
              <TrendingUp size={16} className="mr-1" />
              <span className="text-sm">+8.3% from last month</span>
            </div>
          </div>
          <div className="bg-green-400/20 p-3 rounded-full">
            <ShoppingBag size={24} />
          </div>
        </div>
        <div className="mt-4 h-2 w-full bg-green-400/30 rounded-full overflow-hidden">
          <div className="h-full bg-white w-2/3 rounded-full"></div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm font-medium">Avg. Order Value</p>
            <p className="text-2xl font-bold mt-2">
              ${stats?.totalOrders ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp size={16} className="mr-1" />
              <span className="text-sm">+5.2% from last month</span>
            </div>
          </div>
          <div className="bg-purple-400/20 p-3 rounded-full">
            <Package size={24} />
          </div>
        </div>
        <div className="mt-4 h-2 w-full bg-purple-400/30 rounded-full overflow-hidden">
          <div className="h-full bg-white w-1/2 rounded-full"></div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-100 text-sm font-medium">Conversion Rate</p>
            <p className="text-2xl font-bold mt-2">3.2%</p>
            <div className="flex items-center mt-2">
              <TrendingUp size={16} className="mr-1" />
              <span className="text-sm">+2.1% from last month</span>
            </div>
          </div>
          <div className="bg-amber-400/20 p-3 rounded-full">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="mt-4 h-2 w-full bg-amber-400/30 rounded-full overflow-hidden">
          <div className="h-full bg-white w-2/5 rounded-full"></div>
        </div>
      </div>
    </div>

    {/* Charts Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Weekly
            </button>
            <button className="px-3 py-1 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
              Monthly
            </button>
            <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Yearly
            </button>
          </div>
        </div>
        
        <div className="relative h-64">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>$50K</span>
            <span>$40K</span>
            <span>$30K</span>
            <span>$20K</span>
            <span>$10K</span>
            <span>$0</span>
          </div>
          
          {/* Chart area */}
          <div className="ml-12 h-full flex items-end justify-between pt-6 pb-8">
            {[
              { month: 'Jan', value: 20000 },
              { month: 'Feb', value: 30000 },
              { month: 'Mar', value: 37500 },
              { month: 'Apr', value: 45000 },
              { month: 'May', value: 32500 },
              { month: 'Jun', value: 42500 },
              { month: 'Jul', value: 47500 }
            ].map((item, index) => {
              const barHeight = (item.value / 50000) * 100;
              const barColor = index === 3 ? 'from-amber-600 to-amber-400' : 'from-amber-500 to-amber-300';
              
              return (
                <div key={item.month} className="flex flex-col items-center h-full">
                  <div className="relative group h-full flex flex-col justify-end">
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      <div className="font-semibold">${item.value.toLocaleString()}</div>
                      <div className="text-amber-300">{item.month} Revenue</div>
                    </div>
                    
                    {/* Bar with gradient */}
                    <div
                      className={`w-10 bg-gradient-to-t ${barColor} rounded-t-lg transition-all duration-300 hover:opacity-90 cursor-pointer group-hover:shadow-lg group-hover:shadow-amber-500/20`}
                      style={{ height: `${barHeight}%` }}
                    >
                      {/* Bar value label on hover */}
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ${(item.value / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>
                  {/* Month label */}
                  <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Grid lines */}
          <div className="absolute inset-0 ml-12 -z-10 pointer-events-none">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
                style={{ top: `${i * 20}%` }}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-300 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Year</span>
              </div>
            </div>
            <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
              <TrendingUp size={16} className="mr-1" />
              +24.5% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Status Distribution</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total: {orders.length} orders
          </div>
        </div>
        
        <div className="h-64 flex items-center">
          <div className="w-1/2 flex items-center justify-center">
            {/* Donut Chart */}
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Background circle */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e5e7eb" strokeWidth="20" />
                
                {/* Segments */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="20"
                  strokeDasharray="251.2" strokeDashoffset="251.2 * 0.7" strokeLinecap="round"
                  transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="20"
                  strokeDasharray="251.2" strokeDashoffset="251.2 * 0.5" strokeLinecap="round"
                  transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20"
                  strokeDasharray="251.2" strokeDashoffset="251.2 * 0.2" strokeLinecap="round"
                  transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="20"
                  strokeDasharray="251.2" strokeDashoffset="0" strokeLinecap="round"
                  transform="rotate(-90 50 50)" />
                
                {/* Center text */}
                <text x="50" y="50" textAnchor="middle" dy="0.3em" className="text-2xl font-bold fill-gray-900 dark:fill-white">
                  {orders.length}
                </text>
                <text x="50" y="60" textAnchor="middle" className="text-xs fill-gray-600 dark:fill-gray-400">
                  Total Orders
                </text>
              </svg>
            </div>
          </div>
          
          <div className="w-1/2 space-y-4">
            {[
              { label: 'Delivered', value: Math.floor(orders.length * 0.3), color: 'bg-green-500' },
              { label: 'Processing', value: Math.floor(orders.length * 0.2), color: 'bg-blue-500' },
              { label: 'Pending', value: Math.floor(orders.length * 0.25), color: 'bg-amber-500' },
              { label: 'Cancelled', value: Math.floor(orders.length * 0.1), color: 'bg-red-500' },
              { label: 'Other', value: orders.length - Math.floor(orders.length * 0.85), color: 'bg-gray-500' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${(item.value / orders.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Top Products Table */}
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Products</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Based on sales and revenue in the last 30 days
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Units Sold
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {products.slice(0, 5).map((product, index) => {
              const unitsSold = Math.floor(Math.random() * 500) + 100;
              const revenue = unitsSold * parseFloat(product.price.replace(/[^0-9.]/g, ''));
              const trend = ['up', 'down', 'up', 'stable', 'up'][index];
              
              return (
                <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={product.images?.[0]?.main?.url || '/placeholder-image.jpg'}
                          alt={product.name}
                        />
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          SKU: {product._id.toString().slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                      {getCategoryName(product.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <span className="font-semibold">{product.price}</span>
                      {product.hotDeal && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          🔥 Hot Deal
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                        {unitsSold.toLocaleString()}
                      </span>
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${Math.min(100, (unitsSold / 600) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.inStock 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {trend === 'up' && (
                        <>
                          <TrendingUp size={16} className="text-green-500 mr-1" />
                          <span className="text-green-600 dark:text-green-400 text-sm">+12.5%</span>
                        </>
                      )}
                      {trend === 'down' && (
                        <>
                          <TrendingUp size={16} className="text-red-500 mr-1 transform rotate-180" />
                          <span className="text-red-600 dark:text-red-400 text-sm">-3.2%</span>
                        </>
                      )}
                      {trend === 'stable' && (
                        <>
                          <span className="text-gray-500 text-sm">Stable</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing 5 of {products.length} products
          </div>
          <button className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-medium">
            View all products →
          </button>
        </div>
      </div>
    </div>

    {/* Quick Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 text-white">
        <h4 className="text-lg font-semibold mb-4">Customer Satisfaction</h4>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">4.8</div>
            <div className="flex mt-2">
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className="text-amber-400 mr-1">★</span>
              ))}
            </div>
            <p className="text-sm text-gray-300 mt-2">Based on 342 reviews</p>
          </div>
          <div className="text-right">
            <div className="text-green-400 text-sm">+2.4%</div>
            <div className="text-gray-300 text-sm">from last month</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alert</h4>
          <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-xs font-medium">
            {stats?.lowStockProducts?.length || 0} products
          </div>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {(stats?.lowStockProducts || []).length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 text-sm">All products are well stocked!</p>
            </div>
          ) : (
            (stats?.lowStockProducts || []).slice(0, showAllLowStock ? undefined : 3).map((product, index) => (
              <div 
                key={product._id || index} 
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Category: {product.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.stockQuantity <= 3 
                      ? 'bg-red-500 text-white' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {product.stockQuantity} left
                  </span>
                  <button 
                    onClick={() => handleEditProduct(product)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
                    title="Edit product"
                  >
                    <Edit size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {stats?.lowStockProducts?.length > 3 && (
          <button 
            onClick={() => setShowAllLowStock(!showAllLowStock)}
            className="w-full mt-4 py-2 text-center text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-lg text-sm font-medium transition-colors"
          >
            {showAllLowStock ? 'Show Less' : `View All (${stats?.lowStockProducts?.length || 0})`}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Categories</h4>
        <div className="space-y-4">
          {[
            { name: 'Perfume', sales: 45, color: 'bg-amber-500' },
            { name: 'Cologne', sales: 30, color: 'bg-blue-500' },
            { name: 'Eau de Parfum', sales: 15, color: 'bg-purple-500' },
            { name: 'Eau de Toilette', sales: 10, color: 'bg-green-500' }
          ].map(category => (
            <div key={category.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{category.name}</span>
                <span className="font-medium text-gray-900 dark:text-white">{category.sales}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${category.color} rounded-full transition-all duration-500`}
                  style={{ width: `${category.sales}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}


      </main>
    </div>
  );
};

export default AdminDashboard;