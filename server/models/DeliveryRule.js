// models/DeliveryRule.js
import mongoose from 'mongoose';

const deliveryRuleSchema = new mongoose.Schema({
  minPieces: {
    type: Number,
    required: true,
    min: 1
  },
  maxPieces: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: function(value) {
        return value >= this.minPieces;
      },
      message: 'maxPieces must be greater than or equal to minPieces'
    }
  },
  deliveryCost: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  country: {
    type: String,
    default: 'ALL',
    uppercase: true
  }
}, {
  timestamps: true
});

// Prevent overlapping piece ranges
deliveryRuleSchema.index({ minPieces: 1, maxPieces: 1, country: 1 }, { unique: true });

export default mongoose.model('DeliveryRule', deliveryRuleSchema);