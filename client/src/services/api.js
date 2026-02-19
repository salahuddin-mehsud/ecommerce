import emailjs from '@emailjs/browser';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';



const transformProductImages = (product) => {
  // If product has images as array (new format)
  if (product.images && Array.isArray(product.images)) {
    return {
      ...product,
      images: product.images.map(img => img.main?.url).filter(Boolean) 
    };
  }
  
  if (product.images && typeof product.images === 'object' && product.images.main) {
    return {
      ...product,
      images: [product.images.main.url] 
    };
  }
  
  return product;
};

export const productAPI = {
    getCategories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch categories');
      }
      
      return data.data || data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }
      
      const products = data.data || data;
      
      // Transform all products to ensure images are in array format
      return products.map(transformProductImages);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  getFeatured: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }
      
      const products = data.data || data;
      const featured = products.filter(product => product.featured === true);
      
      // Transform featured products
      return featured.map(transformProductImages);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  },

  getHotDeals: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }
      
      const products = data.data || data;
      const now = new Date();
      
      const hotDeals = products.filter(product => 
        product.hotDeal === true && 
        product.hotDealEnd && 
        new Date(product.hotDealEnd) > now
      );
      
      // Transform hot deals
      return hotDeals.map(transformProductImages);
    } catch (error) {
      console.error('Error fetching hot deals:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch product');
      }
      
      const product = data.data || data;
      
      // Transform single product
      return transformProductImages(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // ... keep your existing create, update, delete methods the same
  create: async (formData) => {
    const response = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id, formData) => {
    const response = await api.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateStock: async (id, stockData) => {
    const response = await api.patch(`/products/${id}/stock`, stockData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};


export const shippingAPI = {
  // For checkout - use public endpoints
  calculateCheckout: async (pieces, countryCode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/public/calculate-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          pieces, 
          countryCode: countryCode.toUpperCase() 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to calculate shipping and tax');
      }
      
      return data;
    } catch (error) {
      console.error('Error calculating checkout:', error);
      throw error;
    }
  },

  // Public endpoint for countries (no auth required)
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/public/countries`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch countries');
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  },

  // Keep existing methods if needed elsewhere
  getByCountry: async (countryName) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/shipping/country/${encodeURIComponent(countryName)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Shipping cost not found for this country');
      }
    } catch (error) {
      console.error('Error fetching shipping cost:', error);
      throw error;
    }
  },

  calculateDelivery: async (pieces, country) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/delivery-rules/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pieces, country })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to calculate delivery cost');
      }
      
      return data.data || data;
    } catch (error) {
      console.error('Error calculating delivery:', error);
      throw error;
    }
  }
};
// In api.js, update the orderAPI object
export const orderAPI = {
  // ... existing methods ...
  
     create: async (orderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }
      
      const data = await response.json();
      console.log('✅ Order API response:', data);
      
      // Return the data with proper structure
      return {
        success: data.success,
        message: data.message,
        data: data.data || data
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // ADD THIS MISSING METHOD
  confirmPayment: async (paymentData) => {
    try {
      console.log('📤 Sending confirm-payment request to backend');
      const response = await fetch(`${API_BASE_URL}/orders/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to confirm payment');
      }
      
      console.log('✅ Backend confirm-payment response:', data);
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  updatePaymentStatus: async (orderId, paymentData) => {
  try {
    console.log(`🔄 Updating payment status for order: ${orderId}`);
    
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    const data = await response.json();
    console.log('📦 Order update response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update payment status');
    }
    
    // Return the full response data
    return data;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
},

  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }
      
      return data.data || data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  updateStatus: async (orderId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }
      
      return data.data || data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
};

export const paymentAPI = {
  // Create payment intent
  createPaymentIntent: async (paymentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to create payment intent');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  // Confirm payment
  confirmPayment: async (paymentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to confirm payment');
      }
      
      return data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  // Create checkout session (optional)
  createCheckoutSession: async (sessionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to create checkout session');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }
};




console.log('🔍 EmailJS Environment Check:', {
  VITE_EMAILJS_SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID ? '✅ Loaded' : '❌ Missing',
  VITE_EMAILJS_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID ? '✅ Loaded' : '❌ Missing',
  VITE_EMAILJS_PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? '✅ Loaded' : '❌ Missing'
});



export const emailAPI = {
  sendPaymentConfirmation: async (order) => {
    try {
      console.log('📤 Sending email directly from frontend for order:', order.orderId);
      
      // Check if environment variables are loaded
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      console.log('🔑 Environment variables check:', {
        serviceId: serviceId ? 'Set' : 'Missing',
        templateId: templateId ? 'Set' : 'Missing',
        publicKey: publicKey ? 'Set' : 'Missing'
      });

      if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS environment variables are not configured properly');
      }

      // Format order items as proper HTML for email - FIXED
      const itemsHTML = order.items.map(item => {
        const unitPrice = parseFloat(item.price.replace('$', '').replace(' USD', ''));
        const totalPrice = unitPrice * item.quantity;
        
        return `
          <div class="order-item" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #d97706;">
            <strong style="color: #333; font-size: 16px; display: block; margin-bottom: 5px;">${item.name}</strong>
            <span style="color: #666; font-size: 14px;">
              Quantity: ${item.quantity} | Price: $${unitPrice.toFixed(2)} | Total: $${totalPrice.toFixed(2)}
            </span>
          </div>
        `;
      }).join('');

      // Get payment status for email - FIXED
      const getPaymentStatusText = () => {
        const paymentMethod = order.paymentMethod || 'card';
        const paymentStatus = order.paymentStatus || 'paid';
        
        if (paymentMethod === 'cash_on_delivery') {
          return 'PENDING';
        }
        return paymentStatus.toUpperCase();
      };

      const getPaymentMethodText = () => {
        const paymentMethod = order.paymentMethod || 'card';
        return paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Credit/Debit Card';
      };

      const templateParams = {
        customer_name: `${order.customer.firstName} ${order.customer.lastName}`,
        customer_email: order.customer.email,
        order_id: order.orderId,
        order_date: new Date(order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        payment_status: getPaymentStatusText(),
        payment_method: getPaymentMethodText(),
        total_amount: order.total.toFixed(2),
        subtotal: order.subtotal.toFixed(2),
        shipping_cost: order.shippingCost.toFixed(2),
        tax_amount: order.taxAmount.toFixed(2),
        tax_percentage: order.taxPercentage,
        items: itemsHTML,
        shipping_address: `
          <strong>${order.customer.firstName} ${order.customer.lastName}</strong><br>
          ${order.customer.address}<br>
          ${order.customer.city}, ${order.customer.zipCode}<br>
          ${order.customer.country}
        `,
        to_email: order.customer.email
      };

      console.log('📧 Sending email with EmailJS...', {
        orderId: order.orderId,
        paymentStatus: templateParams.payment_status,
        paymentMethod: templateParams.payment_method
      });

      // Send email directly from frontend
      const result = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );

      console.log('✅ Email sent successfully from frontend:', result);
      return { success: true, messageId: result.text };

    } catch (error) {
      console.error('❌ Frontend email error:', error);
      
      let userFriendlyError = 'Email service temporarily unavailable. Your order is confirmed.';
      
      if (error.message.includes('public key')) {
        userFriendlyError = 'Email configuration error. Please contact support.';
      } else if (error.text) {
        userFriendlyError = error.text;
      }
      
      return { 
        success: false, 
        error: userFriendlyError
      };
    }
  }
};