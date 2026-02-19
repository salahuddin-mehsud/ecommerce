import React, { useState, useEffect, useRef } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { paymentAPI, orderAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const StripePayment = ({ 
  orderData, 
  onPaymentSuccess, 
  onPaymentError, 
  onBackToCheckout 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  
  const hasCreatedPaymentIntent = useRef(false);

  useEffect(() => {
    // Get pending order from localStorage
    const getPendingOrder = () => {
      try {
        const storedOrder = localStorage.getItem('pendingOrder');
        if (!storedOrder || storedOrder === 'undefined') {
          console.log('❌ No valid order found in localStorage');
          return null;
        }
        return JSON.parse(storedOrder);
      } catch (error) {
        console.error('❌ Error parsing localStorage order:', error);
        return null;
      }
    };

    const storedOrder = getPendingOrder();
    setPendingOrder(storedOrder);

    const createPaymentIntent = async () => {
      if (!storedOrder || hasCreatedPaymentIntent.current) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Creating payment intent for amount:', orderData.total);
        
        if (!storedOrder.paymentReference) {
          throw new Error('Order information not found.');
        }

        const response = await paymentAPI.createPaymentIntent({
          amount: orderData.total,
          currency: 'usd',
          metadata: {
            orderId: storedOrder.orderId,
            customerEmail: orderData.customer.email,
            paymentReference: storedOrder.paymentReference
          }
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to create payment intent');
        }
        
        setClientSecret(response.clientSecret);
        console.log('✅ Payment intent created:', response.paymentIntentId);
        hasCreatedPaymentIntent.current = true;
      } catch (error) {
        console.error('❌ Error creating payment intent:', error);
        setError(error.message || 'Failed to initialize payment');
        toast.error('Payment initialization failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (orderData.total > 0 && storedOrder) {
      createPaymentIntent();
    } else if (!storedOrder) {
      setError('No order found. Please go back and complete checkout.');
      setLoading(false);
    }
  }, [orderData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!pendingOrder) {
        throw new Error('Order information not found');
      }

      console.log('📦 Updating order with ID:', pendingOrder._id);
      console.log('💰 Payment amount:', orderData.total);
      
      // Get and normalize country code
      const countryFromOrder = orderData.customer.country || 'US';
      let countryCode;
      
      if (countryFromOrder && countryFromOrder.length === 2) {
        countryCode = countryFromOrder.toUpperCase();
      } else {
        // Convert country name to code
        const countryMap = {
          'usa': 'US',
          'united states': 'US',
          'united kingdom': 'GB',
          'uk': 'GB',
          'canada': 'CA',
          'australia': 'AU',
          'germany': 'DE',
          'france': 'FR',
          'spain': 'ES',
          'italy': 'IT'
        };
        countryCode = countryMap[countryFromOrder.toLowerCase()] || 'US';
      }

      console.log(`🌍 Using country code: ${countryCode} for Stripe`);

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
              email: orderData.customer.email,
              address: {
                line1: orderData.customer.address,
                city: orderData.customer.city,
                postal_code: orderData.customer.zipCode,
                country: countryCode,
              },
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        console.log('✅ Payment succeeded:', paymentIntent.id);
        
        // Create updated order data with payment details
        const updatedOrderData = {
          paymentStatus: 'paid',
          status: 'confirmed',
          paymentDetails: {
            stripePaymentIntentId: paymentIntent.id,
            stripeCustomerId: paymentIntent.customer || 'not_set',
            paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null,
            created: new Date(paymentIntent.created * 1000).toISOString()
          },
          notifications: {
            paymentEmailSent: true,
            paymentEmailSentAt: new Date().toISOString()
          }
        };

        console.log('🔄 Updating order with data:', updatedOrderData);
        
        try {
          // Update order status to paid
          const orderResponse = await orderAPI.updatePaymentStatus(
            pendingOrder._id,
            updatedOrderData
          );

          console.log('✅ Order update response:', orderResponse);
          
          if (orderResponse && (orderResponse.success || orderResponse._id)) {
            const finalOrder = orderResponse.data || orderResponse;
            console.log('✅ Order updated successfully:', finalOrder);
            
            // Pass to parent component
            onPaymentSuccess(paymentIntent, finalOrder);
          } else {
            // If the update fails but payment succeeded, create a fallback order
            console.warn('⚠️ Order update response was not as expected, creating fallback order');
            const fallbackOrder = {
              ...pendingOrder,
              paymentStatus: 'paid',
              status: 'confirmed',
              paymentDetails: updatedOrderData.paymentDetails,
              _id: pendingOrder._id || `order-${Date.now()}`
            };
            
            onPaymentSuccess(paymentIntent, fallbackOrder);
          }
        } catch (updateError) {
          console.error('❌ Error updating order status:', updateError);
          
          // Even if order update fails, payment succeeded - create fallback
          const fallbackOrder = {
            ...pendingOrder,
            paymentStatus: 'paid',
            status: 'confirmed',
            paymentDetails: {
              stripePaymentIntentId: paymentIntent.id,
              status: paymentIntent.status,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency
            },
            _id: pendingOrder._id || `order-${Date.now()}`
          };
          
          console.log('🔄 Using fallback order:', fallbackOrder);
          onPaymentSuccess(paymentIntent, fallbackOrder);
        }
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      onPaymentError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        ':-webkit-autofill': {
          color: '#fce883',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  return (
    <div className="payment-container">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-6">
          Payment Details
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">
              Loading payment system...
            </span>
          </div>
        ) : error ? (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Payment Error</span>
              </div>
              <p className="text-sm">{error}</p>
              <div className="flex space-x-2">
                <button
                  onClick={onBackToCheckout}
                  className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  Back to Checkout
                </button>
              </div>
            </div>
          </div>
        ) : clientSecret ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card Details */}
            <div className="space-y-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                Card Details
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                <CardElement options={cardElementOptions} />
              </div>
            </div>

            {/* Billing Address */}
            <div className="space-y-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                Billing Address
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="font-semibold">{orderData.customer.firstName} {orderData.customer.lastName}</p>
                <p>{orderData.customer.address}</p>
                <p>{orderData.customer.city}, {orderData.customer.zipCode}</p>
                <p>{orderData.customer.country}</p>
              </div>
            </div>

            {/* Test Card Info */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-amber-800 dark:text-amber-300 font-semibold text-sm mb-2">
                💳 Test Card Information
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-amber-700 dark:text-amber-400">
                  Card Number: <strong>4242 4242 4242 4242</strong>
                </p>
                <p className="text-amber-700 dark:text-amber-400">
                  Expiry: <strong>Any future date</strong>
                </p>
                <p className="text-amber-700 dark:text-amber-400">
                  CVC: <strong>Any 3 digits</strong>
                </p>
                <p className="text-amber-700 dark:text-amber-400">
                  ZIP: <strong>Any 5 digits</strong>
                </p>
              </div>
              <p className="text-amber-600 text-xs mt-2">
                💡 The payment will succeed but you won't be charged in test mode.
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <button
                onClick={onBackToCheckout}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Back to Checkout
              </button>

              <button
                type="submit"
                disabled={!stripe || isSubmitting}
                className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isSubmitting ? 'Processing...' : `Pay $${orderData.total.toFixed(2)}`}
              </button>
            </div>

            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">🐛 Debug Info</summary>
                  <div className="mt-2 space-y-1">
                    <p>Order ID: {pendingOrder?._id || 'Not found'}</p>
                    <p>Stripe: {stripe ? '✅ Loaded' : '❌ Not loaded'}</p>
                    <p>Elements: {elements ? '✅ Loaded' : '❌ Not loaded'}</p>
                    <p>Client Secret: {clientSecret ? '✅ Set' : '❌ Not set'}</p>
                  </div>
                </details>
              </div>
            )}
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default StripePayment;