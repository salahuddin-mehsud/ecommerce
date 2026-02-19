import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

const generateOrderId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}${random}`;
};

// Get all orders (for admin) - ADD THIS MISSING ROUTE
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name price images');
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      customer,
      items,
      subtotal,
      shippingCost,
      taxAmount,
      taxPercentage,
      total,
      paymentMethod = 'card' // Default to card
    } = req.body;

    // Generate order ID and payment reference
    const orderId = generateOrderId();
    const paymentReference = `REF-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const order = new Order({
      orderId,
      paymentReference,
      customer,
      items,
      subtotal,
      shippingCost,
      taxAmount,
      taxPercentage,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending'
    });

    const savedOrder = await order.save();
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: savedOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update payment status
router.patch('/:id/payment-status', async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, paymentDetails } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        paymentStatus,
        ...(paymentMethod && { paymentMethod }),
        ...(paymentDetails && { paymentDetails })
      },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name price images');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});


// routes/order.js - Add this endpoint
router.post('/confirm-payment', async (req, res) => {
  try {
    const { 
      orderData, 
      paymentResult, 
      orderReference,
      paymentMethod = 'card' 
    } = req.body;

    // Generate final order with payment status
    const orderId = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const order = new Order({
      orderId,
      paymentReference: orderReference,
      customer: orderData.customer,
      items: orderData.items,
      subtotal: orderData.subtotal,
      shippingCost: orderData.shippingCost,
      taxAmount: orderData.taxAmount,
      taxPercentage: orderData.taxPercentage,
      total: orderData.total,
      paymentMethod,
      paymentStatus: paymentResult.resultCode === 'Authorised' ? 'paid' : 'pending',
      paymentDetails: paymentResult,
      status: 'confirmed'
    });

    const savedOrder = await order.save();
    
    // Process in background (non-blocking)
    processBackgroundTasks(savedOrder).catch(console.error);
    
    res.json({
      success: true,
      data: savedOrder
    });
    
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Background processing function
async function processBackgroundTasks(order) {
  try {
    // 1. Send email (async)
    await emailAPI.sendPaymentConfirmation(order);
    
    // 2. Update inventory (async)
    await updateProductStock(order.items);
    
    // 3. Analytics (async)
    await sendAnalytics(order);
    
  } catch (bgError) {
    console.error('Background task error:', bgError);
    // Don't fail the main request
  }
}


export default router;