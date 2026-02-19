import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import InvoiceGenerator from '../components/InvoiceGenerator';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { shippingAPI, orderAPI, paymentAPI } from '../services/api'; // ADD paymentAPI
import { toast } from 'react-hot-toast';
import { CreditCard, Truck } from 'lucide-react';

import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../stripe'; // IMPORT FROM NEW FILE
import StripePayment from '../components/StripePayment';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { formatPrice, getNumericPrice } = useCurrency();
  const [currentStep, setCurrentStep] = useState('checkout');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [stripePromise, setStripePromise] = useState(null); // ADD STATE
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    country: ''
  });
  
  const [shippingData, setShippingData] = useState(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [countryOptions, setCountryOptions] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countriesError, setCountriesError] = useState('');
  
  const subtotal = getCartTotal();
  const shippingCost = shippingData ? shippingData.shippingCost : 0;
  const taxPercentage = shippingData ? shippingData.taxPercentage : 8;
  const tax = subtotal * (taxPercentage / 100);
  const total = subtotal + tax + shippingCost;

  // Initialize Stripe ONCE
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripe = await getStripe();
        setStripePromise(stripe);
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
      }
    };
    
    initializeStripe();
  }, []);

  // Rest of your useEffect hooks remain the same...
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        setCountriesError('');
        
        const countries = await shippingAPI.getAll();
        
        console.log('📊 Countries data from API:', countries);
        
        if (!countries || !Array.isArray(countries)) {
          console.error('Invalid countries data:', countries);
          throw new Error('Invalid countries data received from server');
        }
        
        const countryOptions = countries
          .filter(item => item && item.countryName && item.country)
          .map(item => ({
            code: item.country,
            name: item.countryName
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('📊 Processed country options:', countryOptions);
        setCountryOptions(countryOptions);
      } catch (error) {
        console.error('Error fetching countries:', error);
        setCountriesError('Failed to load shipping countries. Please refresh the page.');
      } finally {
        setLoadingCountries(false);
      }
    };
    
    fetchCountries();
  }, []);

  useEffect(() => {
    if (formData.country) {
      calculateShippingCost(formData.country);
    } else {
      setShippingData(null);
      setShippingError('');
    }
  }, [formData.country]);

  const calculateShippingCost = async (countryCode) => {
    try {
      setCalculatingShipping(true);
      setShippingError('');
      
      const totalPieces = cart.reduce((sum, item) => sum + item.quantity, 0);
      
      const response = await shippingAPI.calculateCheckout(totalPieces, countryCode);
      
      if (response.success) {
        setShippingData(response.data);
      } else {
        setShippingData(null);
        setShippingError(response.message || 'Unable to calculate shipping and tax for this country.');
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      setShippingData(null);
      setShippingError('We do not ship to this country or delivery cost is not available.');
    } finally {
      setCalculatingShipping(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckoutSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.country) {
    setShippingError('Please select your country');
    return;
  }
  
  if (!shippingData && formData.country) {
    setShippingError('Unable to calculate shipping for selected country. Please try another country.');
    return;
  }

  const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'zipCode'];
  const missingFields = requiredFields.filter(field => !formData[field]);
  
  if (missingFields.length > 0) {
    toast.error('Please fill in all required fields');
    return;
  }

  if (paymentMethod === 'card') {
    // ✅ Create order BEFORE payment for Stripe
    try {
      console.log('🔄 Creating order before payment...');
      const selectedCountry = countryOptions.find(c => c.code === formData.country);
      
      const tempOrderData = {
        customer: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
          country: selectedCountry ? selectedCountry.name : formData.country
        },
        items: cart.map(item => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.images && item.images[0] ? item.images[0] : '/placeholder-image.jpg'
        })),
        subtotal: subtotal,
        shippingCost: shippingData ? shippingData.shippingCost : 0,
        taxAmount: tax,
        taxPercentage: taxPercentage,
        total: total,
        paymentMethod: 'card',
        paymentStatus: 'pending'
      };

      console.log('📦 Order data being sent:', tempOrderData);
      
      // Create order in database first
      const orderResponse = await orderAPI.create(tempOrderData);
      console.log('✅ Order API response:', orderResponse);
      
      if (orderResponse.success && orderResponse.data) {
        const orderData = orderResponse.data;
        console.log('✅ Order created before payment:', orderData);
        
        // Store order data for payment step
        localStorage.setItem('pendingOrder', JSON.stringify(orderData));
        
        setCurrentStep('payment');
      } else {
        throw new Error(orderResponse.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('❌ Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    }
  } else if (paymentMethod === 'cash_on_delivery') {
    await handleCashOnDelivery();
  }
};

  const handleCashOnDelivery = async () => {
    try {
      const selectedCountry = countryOptions.find(c => c.code === formData.country);
      
      const orderData = {
        customer: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          zipCode: formData.zipCode,
          country: selectedCountry ? selectedCountry.name : formData.country
        },
        items: cart.map(item => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.images && item.images[0] ? item.images[0] : '/placeholder-image.jpg'
        })),
        subtotal: subtotal,
        shippingCost: shippingData ? shippingData.shippingCost : 0,
        taxAmount: tax,
        taxPercentage: taxPercentage,
        total: total,
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'pending'
      };

      const newOrder = await orderAPI.create(orderData);
      console.log('Cash on delivery order created:', newOrder);
      
      setCompletedOrder(newOrder.data || newOrder);
      setPaymentCompleted(true);
      
      clearCart();
      localStorage.removeItem('pendingOrder');
      
      toast.success('Order placed successfully! You will pay when you receive the order.');
    } catch (error) {
      console.error('Error creating cash on delivery order:', error);
      toast.error('Error placing order. Please try again.');
    }
  };

  const handlePaymentSuccess = async (paymentResult, order) => {
    try {
      console.log('🎉 Payment successful, finalizing order...');
      
      const completedOrder = {
        ...order,
        paymentStatus: 'paid',
        paymentMethod: 'card',
        createdAt: order.createdAt || new Date().toISOString(),
        subtotal: order.subtotal || subtotal,
        shippingCost: order.shippingCost || shippingCost,
        taxAmount: order.taxAmount || tax,
        taxPercentage: order.taxPercentage || taxPercentage,
        total: order.total || total
      };
      
      setCompletedOrder(completedOrder);
      setPaymentCompleted(true);
      
      clearCart();
      localStorage.removeItem('pendingOrder');
      
      toast.success('Payment successful! Generating your invoice...');
    } catch (error) {
      console.error('Error processing payment success:', error);
      toast.error('Payment successful but there was an issue updating your order.');
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    toast.error('Payment failed. Please try again.');
  };

  const handleBackToCheckout = () => {
    setCurrentStep('checkout');
  };

  const handleDownloadComplete = () => {
    toast.success(`Invoice downloaded! Order #${completedOrder.orderId} has been confirmed.`);
  };

  // Add orderData calculation for StripePayment component
  const getOrderDataForPayment = () => {
    const selectedCountry = countryOptions.find(c => c.code === formData.country);
    
    return {
      customer: {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        country: selectedCountry ? selectedCountry.name : formData.country
      },
      items: cart.map(item => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.images && item.images[0] ? item.images[0] : '/placeholder-image.jpg'
      })),
      subtotal: subtotal,
      shippingCost: shippingData ? shippingData.shippingCost : 0,
      taxAmount: tax,
      taxPercentage: taxPercentage,
      total: total,
      paymentMethod: 'card'
    };
  };
// Add this to debug the final order data
useEffect(() => {
  if (completedOrder) {
    console.log('🎯 FINAL ORDER DATA FOR INVOICE - Checkout.jsx:', {
      orderId: completedOrder.orderId,
      paymentMethod: completedOrder.paymentMethod,
      paymentStatus: completedOrder.paymentStatus,
      _id: completedOrder._id,
      hasPaymentDetails: !!completedOrder.paymentDetails
    });
  }
}, [completedOrder]);



  

  if (cart.length === 0 && currentStep === 'checkout' && !paymentCompleted) {
    return (
      <div className="min-h-screen bg-white dark:bg-black font-[Inter] font-extrabold">
        <Navbar />
        <section className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-6">
              No Items in Cart
            </h1>
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

  const selectedCountry = countryOptions.find(c => c.code === formData.country);

const orderData = {
  customer: {
    email: formData.email,
    firstName: formData.firstName,
    lastName: formData.lastName,
    address: formData.address,
    city: formData.city,
    zipCode: formData.zipCode,
    country: selectedCountry ? selectedCountry.name : formData.country
  },
  items: cart.map(item => ({
    productId: item._id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.images && item.images[0] ? item.images[0] : '/placeholder-image.jpg'
  })),
  subtotal: subtotal,
  shippingCost: shippingData ? shippingData.shippingCost : 0,
  taxAmount: tax,
  taxPercentage: taxPercentage,
  total: total,
  paymentMethod: paymentMethod
};

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      
      <section className="pt-8 pb-20 font-[Inter] ">
        <div className="max-w-6xl mx-auto px-4">

          {/* Show Invoice Generator after payment completion */}
          {paymentCompleted ? (
            <InvoiceGenerator 
              order={completedOrder} 
              onDownloadComplete={handleDownloadComplete}
            />
          ) : (
            <>
              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-8">
                <div className={`flex items-center ${currentStep === 'payment' ? 'text-amber-500' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'checkout' ? 'bg-amber-500 text-white' : 'bg-gray-300'}`}>
                    1
                  </div>
                  <span className="ml-2 ">Checkout</span>
                </div>
                <div className="w-16 h-1 bg-gray-300 mx-4"></div>
                <div className={`flex items-center ${currentStep === 'payment' ? 'text-amber-500' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-amber-500 text-white' : 'bg-gray-300'}`}>
                    2
                  </div>
                  <span className="ml-2">Payment</span>
                </div>
              </div>

              {countriesError && (
                <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-red-800">{countriesError}</span>
                    <button 
                      onClick={() => window.location.reload()}
                      className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Checkout Form or Payment */}
                <div>
                  {currentStep === 'checkout' ? (
                    <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                      {/* Contact Information */}
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                          Contact Information
                        </h2>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Email address *"
                          required
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Shipping Address */}
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                          Shipping Address
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="First name *"
                            required
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-amber-500"
                          />
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Last name *"
                            required
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Street Address *"
                          required
                          className="w-full mt-4 px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-amber-500"
                        />
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City *"
                            required
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-amber-500"
                          />
                          <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleChange}
                            placeholder="ZIP/Postal Code *"
                            required
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        
                        {/* Country Select Dropdown */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Country *
                          </label>
                          <div className="relative">
                            <select
  name="country"
  value={formData.country}
  onChange={handleChange}
  required
  disabled={loadingCountries}
  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:border-amber-500 appearance-none"
>
  <option value="">Select your country</option>
  {countryOptions.map((country, index) => (
    <option key={index} value={country.code}>
      {country.name}
    </option>
  ))}
</select>
                            
                            {/* Dropdown arrow */}
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>

                            {/* Loading indicator */}
                            {loadingCountries && (
                              <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
                              </div>
                            )}
                          </div>

                          {/* Help Text */}
                          {!loadingCountries && (
                            <p className="text-sm text-gray-500 mt-2">
                              Select your country to calculate shipping costs and tax
                            </p>
                          )}
                        </div>

                        {/* Shipping Error */}
                        {shippingError && (
                          <div className="mt-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                            {shippingError}
                          </div>
                        )}

                        {/* Shipping & Tax Calculation Result */}
                        {shippingData && !calculatingShipping && (
  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-green-800 font-semibold">Shipping Cost:</span>
        <span className="text-green-800 font-bold">{formatPrice(shippingData.shippingCost)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-green-800 font-semibold">Tax Rate:</span>
        <span className="text-green-800 font-bold">{shippingData.taxPercentage}%</span>
      </div>
    </div>
    <p className="text-green-700 text-sm mt-2">
      Shipping and tax calculated for {shippingData.country}
    </p>
  </div>
)}

                        {/* Calculating Shipping Indicator */}
                        {calculatingShipping && formData.country && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                              <span className="text-blue-700">Calculating shipping and tax for {formData.country}...</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Payment Method Selection */}
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                          Payment Method
                        </h2>
                        <div className="space-y-4">
                          <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="card"
                              checked={paymentMethod === 'card'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="h-5 w-5 text-amber-500 focus:ring-amber-500"
                            />
                            <CreditCard size={20} className="text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Credit/Debit Card</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Pay securely with your card</p>
                            </div>
                          </label>
                          
                          <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cash_on_delivery"
                              checked={paymentMethod === 'cash_on_delivery'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="h-5 w-5 text-amber-500 focus:ring-amber-500"
                            />
                            <Truck size={20} className="text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Cash on Delivery</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Pay when you receive your order</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!shippingData || calculatingShipping || !formData.country}
                        className="w-full bg-amber-500 text-white py-4 rounded-lg hover:bg-amber-600 font-sans font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                      >
                        {calculatingShipping ? 'Calculating...' : 
                         paymentMethod === 'card' ? `Proceed to Payment - ${formatPrice(total)}` :
                         `Place Order (Cash on Delivery) - ${formatPrice(total)}`}
                      </button>
                    </form>
                  ) : (
                      stripePromise && (
                  <Elements stripe={stripePromise}>
                    <StripePayment
                      orderData={getOrderDataForPayment()}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      onBackToCheckout={handleBackToCheckout}
                    />
                  </Elements>
                )
                  )}
                </div>

                {/* Right Column - Order Summary */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 h-fit sticky top-32">
                  <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                    Order Summary
                  </h2>
                  
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                    {cart.map((item) => {
                      const itemPrice = getNumericPrice(item.price);
                      const itemTotal = itemPrice * item.quantity;
                      
                      return (
                        <div key={item._id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-white font-medium text-sm">{item.name}</p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-gray-900 dark:text-white font-semibold">{formatPrice(itemTotal)}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-gray-300 dark:border-gray-600 pt-4 space-y-2">
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
  <span>Shipping</span>
  <span>
    {shippingData ? (
      formatPrice(shippingData.shippingCost)
    ) : formData.country ? (
      <span className="text-amber-600">Calculating...</span>
    ) : (
      <span className="text-gray-500">Select country</span>
    )}
  </span>
</div>

<div className="flex justify-between text-gray-700 dark:text-gray-300">
  <span>
    Tax {shippingData && `(${shippingData.taxPercentage}%)`}
  </span>
  <span>
    {shippingData ? (
      formatPrice(tax)
    ) : formData.country ? (
      <span className="text-amber-600">Calculating...</span>
    ) : (
      <span className="text-gray-500">--</span>
    )}
  </span>
</div>
                  
                    
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                      <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                        <span>Total</span>
                        <span>
                          {shippingData ? formatPrice(total) : '--'}
                        </span>
                      </div>
                    </div>

                    {/* Payment Method Info */}
                    {paymentMethod === 'cash_on_delivery' && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-amber-800 text-sm font-medium">
                          💰 Cash on Delivery Selected
                        </p>
                        <p className="text-amber-700 text-xs mt-1">
                          You will pay when you receive your order
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Checkout;