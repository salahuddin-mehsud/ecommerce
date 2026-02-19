// models/ShippingCost.js
import mongoose from 'mongoose';

const shippingCostSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  countryName: {
    type: String,
    required: true,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  taxPercentage: {
    type: Number,
    required: true,
    default: 8, // Default 8% tax
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});


shippingCostSchema.index({ country: 1 }, { 
  unique: true,
  collation: { locale: 'en', strength: 2 }
});

export default mongoose.model('ShippingCost', shippingCostSchema);