// services/adminApi.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const adminAPI = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Products
  getProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  createProduct: async (formData) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return response.json();
  },

  updateProduct: async (id, formData) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return response.json();
  },

  deleteProduct: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Orders
  getOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/admin/orders?${queryString}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  updateOrderStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': getAuthHeaders()['Authorization'],
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  updatePaymentStatus: async (id, paymentStatus) => {
    const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/payment-status`, {
      method: 'PATCH',
      headers: {
        'Authorization': getAuthHeaders()['Authorization'],
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentStatus })
    });
    return response.json();
  },

  // Analytics
  getAnalytics: async (period = '30d') => {
    const response = await fetch(`${API_BASE_URL}/admin/analytics?period=${period}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Categories
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  createCategory: async (formData) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return response.json();
  },

  updateCategory: async (id, formData) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    return response.json();
  },

  deleteCategory: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Delivery Rules
  getDeliveryRules: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/delivery-rules`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  createDeliveryRule: async (data) => {
    const response = await fetch(`${API_BASE_URL}/admin/delivery-rules`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  updateDeliveryRule: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/admin/delivery-rules/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  deleteDeliveryRule: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/delivery-rules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  calculateDeliveryCost: async (pieces, country) => {
    const response = await fetch(`${API_BASE_URL}/admin/delivery-rules/calculate`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pieces, country })
    });
    return response.json();
  },
   getCountries: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/countries`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  createCountry: async (data) => {
    const response = await fetch(`${API_BASE_URL}/admin/countries`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  updateCountry: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/admin/countries/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  deleteCountry: async (id) => {
    const response = await fetch(`${API_BASE_URL}/admin/countries/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  calculateCheckout: async (pieces, countryCode) => {
    const response = await fetch(`${API_BASE_URL}/admin/calculate-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pieces, countryCode })
    });
    return response.json();
  }
};