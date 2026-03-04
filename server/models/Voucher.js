import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  voucherCode: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    email: String,
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    zipCode: String,
    country: String
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: String,
    quantity: Number,
    image: String
  }],
  subtotal: Number,
  shippingCost: Number,
  taxAmount: Number,
  taxPercentage: Number,
  total: Number,
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending_payment', 'active', 'redeemed', 'expired'],
    default: 'pending_payment'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash_on_delivery'],
    default: 'card'
  },
  paymentDetails: {
    stripePaymentIntentId: String,
    stripeCustomerId: String,
    receiptUrl: String
  },
  redeemedAt: Date,
  qrCode: String // optional, we can generate on client side or store URL
}, {
  timestamps: true
});

voucherSchema.pre('save', function(next) {
  if (this.isNew && !this.voucherCode) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.voucherCode = `VCH-${timestamp}${random}`;
  }
  next();
});

export default mongoose.model('Voucher', voucherSchema);