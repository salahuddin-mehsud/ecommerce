// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'PKR', 'AED', 'SAR', 'CAD', 'AUD', 'JPY']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  description: {
    type: String,
    required: true
  },
  // CHANGED: images is now an array to store multiple images
  images: [{
    main: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
      format: { type: String, default: 'webp' },
      size: Number,
      width: Number,
      height: Number
    },
    variants: {
      thumbnail: String,
      medium: String,
      large: String
    }
  }],
  // Keep original image info for reference
  originalImages: [{
    name: String,
    size: Number,
    mimetype: String,
    originalFormat: String
  }],
  // Optimization metrics
  optimization: {
    originalTotalSize: Number,
    optimizedTotalSize: Number,
    reductionPercentage: Number,
    processedAt: { type: Date, default: Date.now }
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  // Hot Deals Fields
  hotDeal: {
    type: Boolean,
    default: false
  },
  hotDealEnd: {
    type: Date
  },
  dealPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  dealOriginalPrice: {
    type: String
  }
}, {
  timestamps: true
});

// Update inStock based on stockQuantity before saving
productSchema.pre('save', function(next) {
  this.inStock = this.stockQuantity > 0;
  
  // Calculate optimization metrics if we have the data
  if (this.originalImages && this.originalImages.length > 0 && this.images && this.images.length > 0) {
    const originalTotalSize = this.originalImages.reduce((sum, img) => sum + (img.size || 0), 0);
    const optimizedTotalSize = this.images.reduce((sum, img) => sum + (img.main?.size || 0), 0);
    
    this.optimization = {
      originalTotalSize,
      optimizedTotalSize,
      reductionPercentage: originalTotalSize > 0 ? Math.round(((originalTotalSize - optimizedTotalSize) / originalTotalSize) * 100) : 0,
      processedAt: new Date()
    };
  }
  
  next();
});

export default mongoose.model('Product', productSchema);