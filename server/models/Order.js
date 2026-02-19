// models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    email: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image: {
      type: String,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  taxPercentage: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'processing'],
    default: 'pending'
  },
  // Add payment method field
  paymentMethod: {
    type: String,
    enum: ['card', 'cash_on_delivery'],
    default: 'card'
  },
  paymentReference: {
    type: String,
    unique: true
  },
  paymentDetails: {
  stripePaymentIntentId: String,
  stripeCustomerId: String,
  paymentMethod: String,
  receiptUrl: String,
  status: String
},
  trackingNumber: {
    type: String
  },
  notifications: {
    paymentEmailSent: {
      type: Boolean,
      default: false
    },
    paymentEmailSentAt: {
      type: Date
    },
    shippingEmailSent: {
      type: Boolean,
      default: false
    },
    shippingEmailSentAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Generate order ID before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderId = `ORD-${timestamp}${random}`;
    
    // Also generate payment reference
    this.paymentReference = `REF-${timestamp}${random}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);