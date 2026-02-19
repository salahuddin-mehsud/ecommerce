import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;

    console.log(`🔧 Creating payment intent for amount: ${amount} ${currency}`);
    
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`✅ Payment intent created: ${paymentIntent.id}`);
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
};

// Confirm payment
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    console.log(`🔧 Confirming payment intent: ${paymentIntentId}`);
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      paymentIntent: paymentIntent
    });
  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to confirm payment'
    });
  }
};

// Create checkout session (optional - for Stripe Checkout)
export const createCheckoutSession = async (req, res) => {
  try {
    const { 
      items, 
      successUrl, 
      cancelUrl, 
      customerEmail,
      metadata 
    } = req.body;

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(parseFloat(item.price.replace('$', '').replace(' USD', '')) * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: metadata || {},
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create checkout session'
    });
  }
};

// Webhook handler (optional - for future use)
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent was successful:', paymentIntent.id);
        // Update your order status here
        break;
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        console.log('PaymentIntent failed:', failedPaymentIntent.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};