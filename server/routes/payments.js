import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  createCheckoutSession,
  handleStripeWebhook
} from '../controllers/paymentController.js';

const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', createPaymentIntent);

// Confirm payment
router.post('/confirm-payment', confirmPayment);

// Create checkout session
router.post('/create-checkout-session', createCheckoutSession);

// Stripe webhook (raw body required)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;