import React, { useState, useEffect, useRef } from 'react';
import { paymentAPI, orderAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const Payment = ({ 
  orderData, 
  onPaymentSuccess, 
  onPaymentError, 
  onBackToCheckout 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adyenCheckout, setAdyenCheckout] = useState(null);
  const [checkoutInstance, setCheckoutInstance] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use refs instead of state for values that need to be accessed in callbacks
  const createdOrderRef = useRef(null);
  const sessionResponseRef = useRef(null);
  const dropinContainer = useRef(null);

  // Check if Adyen is already loaded
  useEffect(() => {
    if (window.AdyenCheckout) {
      setAdyenCheckout(() => window.AdyenCheckout);
      return;
    }

    const loadAdyenResources = () => {
  try {
    // Check if CSS is already loaded
    const cssAlreadyLoaded = document.querySelector('link[href*="adyen.com"]');
    
    if (!cssAlreadyLoaded) {
      // Create CSS link with onload/onerror handlers
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://checkoutshopper-test.adyen.com/checkoutshopper/sdk/5.58.0/adyen.css';
      cssLink.crossOrigin = 'anonymous';
      
      cssLink.onload = () => {
        console.log('✅ Adyen CSS loaded successfully');
        // Force a reflow to ensure styles are applied
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
      };
      
      cssLink.onerror = () => {
        console.warn('❌ Adyen CSS failed to load');
        // Try fallback CDN
        cssLink.href = 'https://cdn.adyen.com/checkoutshopper/sdk/5.58.0/adyen.css';
      };
      
      document.head.appendChild(cssLink);
    }

    // Check if JS is already loaded
    if (!window.AdyenCheckout && !document.querySelector('script[src*="adyen.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://checkoutshopper-test.adyen.com/checkoutshopper/sdk/5.58.0/adyen.js';
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('✅ Adyen script loaded successfully');
        setAdyenCheckout(() => window.AdyenCheckout);
      };
      
      script.onerror = () => {
        console.error('Failed to load Adyen script');
        setError('Failed to load payment system. Please refresh the page.');
        setLoading(false);
      };
      
      document.head.appendChild(script);
    } else if (window.AdyenCheckout) {
      setAdyenCheckout(() => window.AdyenCheckout);
    }
  } catch (error) {
    console.error('Error loading Adyen resources:', error);
    setError('Failed to initialize payment system');
    setLoading(false);
  }
};

    loadAdyenResources();

    return () => {
      if (checkoutInstance) {
        try {
          checkoutInstance.unmount();
        } catch (e) {
          console.log('Cleanup unmount error:', e);
        }
      }
    };
  }, []);

  // Initialize payment when Adyen is loaded
  useEffect(() => {
    if (adyenCheckout) {
      initializePayment();
    }
  }, [adyenCheckout]);

  // Mount dropin when checkout instance is ready
  useEffect(() => {
    if (checkoutInstance && dropinContainer.current) {
      try {
        const dropin = checkoutInstance.create('dropin');
        dropin.mount(dropinContainer.current);
        console.log('Dropin mounted successfully');
        setLoading(false);
        setRetryCount(0);
      } catch (mountError) {
        console.error('Error mounting dropin:', mountError);
        handleMountError(mountError);
      }
    }
  }, [checkoutInstance]);

  const handleMountError = (error) => {
    console.error('Mount error:', error);
    
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setCheckoutInstance(null);
        setLoading(true);
        initializePayment();
      }, 1000 * retryCount);
    } else {
      setError('Failed to load payment form. Please refresh the page and try again.');
      setLoading(false);
    }
  };

  const handleSubmitPayment = async (state, component) => {
    console.log('🔄 Payment form submitted, making payment...', state);
    setIsSubmitting(true);

    // Use the ref values which are always current
    const currentOrder = createdOrderRef.current;
    const currentSession = sessionResponseRef.current;

    if (!currentOrder || !currentOrder.paymentReference) {
      console.error('Missing order data or payment reference:', currentOrder);
      setError('Order data missing. Please try again.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await paymentAPI.submitPayment({
        paymentData: state.data,
        sessionId: currentSession.id,
        orderData: {
          ...orderData,
          total: orderData.total,
          paymentReference: currentOrder.paymentReference,
          _id: currentOrder._id
        }
      });

      console.log('Payment submission response:', response);
      
      if (response.success) {
        if (response.resultCode === 'Authorised') {
          component.setStatus('success');
          handlePaymentComplete({ resultCode: response.resultCode }, currentOrder);
        } else if (response.resultCode === 'Pending' || response.resultCode === 'Received') {
          component.setStatus('loading');
          toast.success('Payment is being processed...');
        } else {
          component.setStatus('loading');
        }
      } else {
        component.setStatus('error');
        setError(response.message || 'Payment failed');
        onPaymentError(new Error(response.message));
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      component.setStatus('error');
      setError('Payment submission failed. Please try again.');
      onPaymentError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initializePayment = async () => {
  try {
    setLoading(true);
    setError(null);

    console.time('🕐 Payment initialization started');
    
    // ⚠️ TEMPORARY: SKIP ORDER CREATION FOR TEST
    console.log('⚠️ TEMPORARY: Skipping order creation for speed test');
    
    // Generate a temporary reference
    const tempReference = `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Store minimal order data
    createdOrderRef.current = {
      _id: tempReference,
      paymentReference: tempReference,
      orderData: orderData
    };

    // 1. Get payment methods FIRST (without waiting for order)
    console.time('🕐 getPaymentMethods');
    const paymentMethodsResponse = await paymentAPI.getPaymentMethods({
      currency: 'USD',
      amount: Math.round(orderData.total * 100)
    });
    console.timeEnd('🕐 getPaymentMethods');
    
    if (!paymentMethodsResponse.success) {
      throw new Error(paymentMethodsResponse.error || 'Failed to get payment methods');
    }

    // 2. Create payment session
    console.time('🕐 createSession');
    const sessionResp = await paymentAPI.createSession({
      amount: orderData.total,
      currency: 'USD',
      reference: tempReference,
      returnUrl: `${window.location.origin}/payment-result`
    });
    console.timeEnd('🕐 createSession');
    
    if (!sessionResp.success) {
      throw new Error(sessionResp.error || 'Failed to create payment session');
    }

    sessionResponseRef.current = sessionResp;
    
    console.time('🕐 Adyen configuration');
    const configuration = {
      environment: 'test',
      clientKey: import.meta.env.VITE_ADYEN_CLIENT_KEY,
      session: {
        id: sessionResp.id,
        sessionData: sessionResp.sessionData
      },
      onPaymentCompleted: (result, component) => {
        console.log('✅ Payment completed callback triggered:', result);
        setIsSubmitting(false);
        handlePaymentComplete(result, createdOrderRef.current);
      },
      onError: (error, component) => {
        console.error('❌ Payment error:', error);
        setIsSubmitting(false);
        setError(error.message || 'Payment failed');
      },
      paymentMethodsResponse: paymentMethodsResponse.data,
      showPayButton: true
    };
    console.timeEnd('🕐 Adyen configuration');

    console.time('🕐 Adyen checkout creation');
    const newCheckout = await adyenCheckout(configuration);
    console.timeEnd('🕐 Adyen checkout creation');
    
    setCheckoutInstance(newCheckout);
    console.timeEnd('🕐 Payment initialization started');
    setLoading(false);
    
  } catch (error) {
    console.error('❌ Payment initialization error:', error);
    setError(error.message || 'Failed to initialize payment');
    setLoading(false);
  }
};

  const handlePaymentComplete = async (result, tempOrderReference) => {
  try {
    console.log('🎯 Payment complete, result:', result);
    
    // Create order AFTER payment succeeds
    const orderResponse = await orderAPI.confirmPayment({
      orderData: orderData,
      paymentResult: result,
      orderReference: tempOrderReference,
      paymentMethod: 'card'
    });
    
    const finalOrder = orderResponse.data;
    
    console.log('✅ Order created successfully:', finalOrder);
    
    // Pass to parent component
    onPaymentSuccess(result, finalOrder);
    
  } catch (error) {
    console.error('Error creating order after payment:', error);
    // Create fallback order object
    const fallbackOrder = {
      ...orderData,
      orderId: `ORDER-${Date.now()}`,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      paymentReference: tempOrderReference?.paymentReference || `PAY-${Date.now()}`,
      _id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    console.log('⚠️ Using fallback order:', fallbackOrder);
    onPaymentSuccess(result, fallbackOrder);
  }
};

  const retryPayment = () => {
    setError(null);
    setCheckoutInstance(null);
    createdOrderRef.current = null;
    sessionResponseRef.current = null;
    setIsSubmitting(false);
    setRetryCount(0);
    setLoading(true);
    if (dropinContainer.current) {
      dropinContainer.current.innerHTML = '';
    }
    setTimeout(() => {
      initializePayment();
    }, 1000);
  };

  const hardRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="payment-container">
      <div className="bg-white dark:bg-black rounded-lg p-6">
        <h2 className="text-xl font-[Inter] font-extrabold text-gray-900 dark:text-white mb-4">
          Payment Details
        </h2>

         <style jsx="true">{`
  /* Reset for Adyen form containers */
  .adyen-checkout__field {
    min-height: 56px !important;
  }
  
  /* Ensure iframes have consistent height */
  .adyen-checkout__field iframe {
    height: 56px !important;
  }
  
  /* Fix for text alignment inside inputs */
  .adyen-checkout__input {
    line-height: 1.5 !important;
    vertical-align: middle !important;
  }
  
  /* Make sure the drop-in container has proper height */
  #dropin-container {
    min-height: 400px;
    position: relative;
  }
  
  /* Force reflow to fix rendering */
  .adyen-checkout__field * {
    box-sizing: border-box !important;
  }
`}</style>



        
        {(loading || isSubmitting) && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">
              {isSubmitting ? 'Processing payment...' : 'Loading payment methods...'}
            </span>
          </div>
        )}

        {error && (
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
                  onClick={retryPayment}
                  className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={hardRefresh}
                  className="bg-amber-500 text-white px-4 py-2 rounded text-sm hover:bg-amber-600 transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={onBackToCheckout}
                  className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  Back to Checkout
                </button>
              </div>
            </div>
          </div>
        )}

        <div 
          ref={dropinContainer} 
          id="dropin-container"
          className={`min-h-[200px] ${(loading || error || isSubmitting) ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
        ></div>

        {(checkoutInstance || error) && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={onBackToCheckout}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back to Checkout
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400 text-left sm:text-right">
              <p className="font-semibold text-amber-600 dark:text-amber-400">Test Card Information:</p>
              <div className="mt-1 space-y-1">
                <p>💳 Card: <strong>5555 5555 5555 4444</strong></p>
                <p>📅 Expiry: <strong>03/2030</strong></p>
                <p>🔒 CVV: <strong>737</strong></p>
                <p>👤 Name: <strong>Any name</strong></p>
              </div>
              {isSubmitting && (
                <p className="mt-2 text-amber-600 text-xs">
                  ⚠️ Payment is processing... Please wait and don't refresh the page.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;