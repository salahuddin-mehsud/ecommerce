import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { upload } from '../middleware/upload.js'; // ADD THIS
import cloudinary from '../config/cloudinary.js'; 
import Category from '../models/Category.js';
import DeliveryRule from '../models/DeliveryRule.js';
import ShippingCost from '../models/ShippingCost.js';

const router = express.Router();

const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Seed admin user (run once)
router.post('/seed', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin user already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });

    await adminUser.save();

    res.json({
      success: true,
      message: 'Admin user created successfully'
    });
  } catch (error) {
    console.error('Seed admin error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating admin user' 
    });
  }
});

// Get admin dashboard stats
router.get('/dashboard/stats', verifyAdmin, async (req, res) => {
  try {
    // Total products
    const totalProducts = await Product.countDocuments();
    
    // Total orders
    const totalOrders = await Order.countDocuments();
    
    // Total revenue (only paid orders)
    const paidOrders = await Order.find({ paymentStatus: 'paid' });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('items.productId', 'name price');
    
    // Low stock products
    const lowStockProducts = await Product.find({ 
      stockQuantity: { $lt: 10 },
      inStock: true 
    }).limit(10);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        recentOrders,
        lowStockProducts
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard stats' 
    });
  }
});

// Get all orders for admin
router.get('/orders', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('items.productId', 'name price images');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching orders' 
    });
  }
});

// Update order status
router.patch('/orders/:id/status', verifyAdmin, async (req, res) => {
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
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating order status' 
    });
  }
});

// Add this route after the existing order status update route
// Update order payment status
router.patch('/orders/:id/payment-status', verifyAdmin, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    // Validate payment status
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment status' 
      });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
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
    console.error('Update payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating payment status' 
    });
  }
});

// Get time-based analytics
router.get('/analytics/:period', verifyAdmin, async (req, res) => {
  try {
    const { period } = req.params;
    const today = new Date();
    let startDate = new Date();

    // Calculate start date based on period
    switch (period) {
      case '7d':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(today.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(today.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate.setDate(today.getDate() - 30); // Default to 30 days
    }

    // Get orders within the period
    const ordersInPeriod = await Order.find({
      createdAt: { $gte: startDate, $lte: today }
    }).populate('items.productId', 'name price');

    // Calculate metrics
    const totalRevenue = ordersInPeriod
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.total, 0);

    const totalOrders = ordersInPeriod.length;

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get daily revenue for chart
    const dailyRevenue = {};
    const daysDiff = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyRevenue[dateKey] = 0;
    }

    ordersInPeriod.forEach(order => {
      if (order.paymentStatus === 'paid') {
        const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
        dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + order.total;
      }
    });

    // Get order status distribution
    const statusDistribution = {};
    ordersInPeriod.forEach(order => {
      statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;
    });

    // Get top selling products
    const productSales = {};
    ordersInPeriod.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId?._id?.toString() || 'unknown';
        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.productId,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Get payment status distribution
    const paymentStatusDistribution = {};
    ordersInPeriod.forEach(order => {
      paymentStatusDistribution[order.paymentStatus] = (paymentStatusDistribution[order.paymentStatus] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        period,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        dailyRevenue: Object.entries(dailyRevenue)
          .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
          .map(([date, revenue]) => ({ date, revenue })),
        statusDistribution,
        paymentStatusDistribution,
        topProducts,
        ordersInPeriod
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching analytics' 
    });
  }
});

// Get all products for admin
router.get('/products', verifyAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching products' 
    });
  }
});

// Create product (admin)
router.post('/products', verifyAdmin, upload.array('images', 4), async (req, res) => {
  try {
    console.log('📦 Creating product with files:', req.files?.length || 0);
    console.log('📋 Form data:', req.body);
    
    const { 
      name, 
      price, 
      description, 
      category, 
      stockQuantity,
      featured,
      hotDeal,
      hotDealEnd,
      dealPercentage 
    } = req.body;

    // Validate required fields
    if (!name || !price || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and description are required'
      });
    }

    let images = [];
    
    // Handle image uploads to Cloudinary
    if (req.files && req.files.length > 0) {
      console.log('📸 Uploading images to Cloudinary...');
      
      // Upload each image to Cloudinary
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'luxeparfum/products',
              transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: "auto" },
                { format: "webp" }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          // Convert buffer to stream
          uploadStream.end(file.buffer);
        });
      });

      try {
        const uploadResults = await Promise.all(uploadPromises);
        images = uploadResults.map(result => ({
          main: {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
            width: result.width,
            height: result.height
          },
          variants: {
            thumbnail: result.secure_url.replace('/upload/', '/upload/c_thumb,w_300,h_300/'),
            medium: result.secure_url.replace('/upload/', '/upload/c_thumb,w_600,h_600/'),
            large: result.secure_url
          }
        }));
        
        console.log(`✅ Uploaded ${images.length} images successfully`);
      } catch (uploadError) {
        console.error('❌ Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images to Cloudinary'
        });
      }
    }

    // Prepare product data
    const productData = {
      name,
      price: `$${parseFloat(price).toFixed(2)} USD`,
      description,
      category: category || 'perfume',
      stockQuantity: parseInt(stockQuantity) || 0,
      inStock: parseInt(stockQuantity) > 0,
      featured: featured === 'true',
      hotDeal: hotDeal === 'true',
      currency: 'USD'
    };

    // Add images if available
    if (images.length > 0) {
      productData.images = images;
      productData.originalImages = req.files.map(file => ({
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        originalFormat: file.mimetype.split('/')[1]
      }));
    }

    // Handle hot deal
    if (productData.hotDeal && dealPercentage) {
      const originalPrice = parseFloat(price);
      const discountAmount = originalPrice * (parseInt(dealPercentage) / 100);
      const dealPrice = originalPrice - discountAmount;
      
      productData.dealPercentage = parseInt(dealPercentage);
      productData.hotDealEnd = hotDealEnd ? new Date(hotDealEnd) : null;
      productData.dealOriginalPrice = `$${originalPrice.toFixed(2)} USD`;
      productData.price = `$${dealPrice.toFixed(2)} USD`;
    }

    console.log('📝 Final product data:', productData);

    // Create and save product
    const product = new Product(productData);
    await product.save();

    console.log(`✅ Product "${name}" created successfully with ID: ${product._id}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('❌ Create product error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error creating product',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update product (admin)
// Update product (admin)
router.put('/products/:id', verifyAdmin, upload.array('images', 4), async (req, res) => {
  try {
    console.log(`🔄 Updating product: ${req.params.id}`);
    
    const { 
      name, 
      price, 
      description, 
      category, 
      stockQuantity,
      featured,
      hotDeal,
      hotDealEnd,
      dealPercentage,
      keepExistingImages // Add this
    } = req.body;

    // Find existing product
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Parse keepExistingImages if provided
    let imagesToKeep = [];
    if (keepExistingImages) {
      try {
        imagesToKeep = JSON.parse(keepExistingImages);
      } catch (error) {
        console.error('Error parsing keepExistingImages:', error);
      }
    }

    // Prepare update data
    const updateData = {
      name: name || existingProduct.name,
      price: price ? `$${parseFloat(price).toFixed(2)} USD` : existingProduct.price,
      description: description || existingProduct.description,
      category: category || existingProduct.category,
      stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity) : existingProduct.stockQuantity,
      inStock: stockQuantity !== undefined ? parseInt(stockQuantity) > 0 : existingProduct.inStock,
      featured: featured !== undefined ? featured === 'true' : existingProduct.featured,
      hotDeal: hotDeal !== undefined ? hotDeal === 'true' : existingProduct.hotDeal,
      updatedAt: new Date()
    };

    // Handle image updates
    if (req.files && req.files.length > 0) {
      console.log('🔄 Updating images...');
      
      // Delete old images from Cloudinary that are NOT in imagesToKeep
      if (existingProduct.images && existingProduct.images.length > 0) {
        const imagesToDelete = existingProduct.images.filter(img => {
          // Check if this image should be kept
          const shouldKeep = imagesToKeep.some(keepImg => 
            keepImg.main?.url === img.main?.url || 
            keepImg === img.main?.url
          );
          return !shouldKeep && img.main?.publicId;
        });

        if (imagesToDelete.length > 0) {
          console.log(`🗑️ Deleting ${imagesToDelete.length} old images from Cloudinary...`);
          
          const deletePromises = imagesToDelete.map(img => {
            if (img.main?.publicId) {
              return cloudinary.uploader.destroy(img.main.publicId);
            }
            return Promise.resolve();
          });
          
          await Promise.all(deletePromises);
        }
      }

      // Upload new images
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'luxeparfum/products',
              transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: "auto" },
                { format: "webp" }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          uploadStream.end(file.buffer);
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      const newImages = uploadResults.map(result => ({
        main: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          size: result.bytes,
          width: result.width,
          height: result.height
        },
        variants: {
          thumbnail: result.secure_url.replace('/upload/', '/upload/c_thumb,w_300,h_300/'),
          medium: result.secure_url.replace('/upload/', '/upload/c_thumb,w_600,h_600/'),
          large: result.secure_url
        }
      }));

      // Combine kept images with new images
      const keptImages = existingProduct.images.filter(img => {
        return imagesToKeep.some(keepImg => 
          keepImg.main?.url === img.main?.url || 
          keepImg === img.main?.url
        );
      });

      updateData.images = [...keptImages, ...newImages];
      updateData.originalImages = req.files.map(file => ({
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        originalFormat: file.mimetype.split('/')[1]
      }));

    } else if (keepExistingImages) {
      // No new images, just update existing images list
      updateData.images = existingProduct.images.filter(img => {
        return imagesToKeep.some(keepImg => 
          keepImg.main?.url === img.main?.url || 
          keepImg === img.main?.url
        );
      });
    }

    // Handle hot deal updates
    if (updateData.hotDeal && dealPercentage) {
      const priceValue = parseFloat(price || existingProduct.price.replace(/[^0-9.]/g, ''));
      const discountAmount = priceValue * (parseInt(dealPercentage) / 100);
      const dealPrice = priceValue - discountAmount;
      
      updateData.dealPercentage = parseInt(dealPercentage);
      updateData.hotDealEnd = hotDealEnd ? new Date(hotDealEnd) : null;
      updateData.dealOriginalPrice = `$${priceValue.toFixed(2)} USD`;
      updateData.price = `$${dealPrice.toFixed(2)} USD`;
    } else if (!updateData.hotDeal) {
      updateData.dealPercentage = null;
      updateData.hotDealEnd = null;
      updateData.dealOriginalPrice = null;
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log(`✅ Product "${product.name}" updated successfully`);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('❌ Update product error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error updating product' 
    });
  }
});

// Set hot deal
router.post('/products/:id/hot-deal', verifyAdmin, async (req, res) => {
  try {
    const { dealPercentage, hotDealEnd } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Calculate deal price
    const originalPrice = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    const discountAmount = originalPrice * (dealPercentage / 100);
    const dealPrice = originalPrice - discountAmount;

    product.hotDeal = true;
    product.dealPercentage = dealPercentage;
    product.hotDealEnd = new Date(hotDealEnd);
    product.dealOriginalPrice = product.price;
    product.price = `$${dealPrice.toFixed(2)}`;

    await product.save();

    res.json({
      success: true,
      message: 'Hot deal set successfully',
      data: product
    });
  } catch (error) {
    console.error('Set hot deal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error setting hot deal' 
    });
  }
});

// Remove hot deal
router.delete('/products/:id/hot-deal', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Restore original price
    if (product.dealOriginalPrice) {
      product.price = product.dealOriginalPrice;
    }

    product.hotDeal = false;
    product.dealPercentage = null;
    product.hotDealEnd = null;
    product.dealOriginalPrice = null;

    await product.save();

    res.json({
      success: true,
      message: 'Hot deal removed successfully',
      data: product
    });
  } catch (error) {
    console.error('Remove hot deal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error removing hot deal' 
    });
  }
});

// Get analytics
router.get('/analytics', verifyAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Get analytics data from analytics route
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/analytics/overview?period=${period}`);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching analytics' 
    });
  }
});


// ✅ ADD THIS: Delete product
router.delete('/products/:id', verifyAdmin, async (req, res) => {
  try {
    console.log(`🗑️ Deleting product: ${req.params.id}`);
    
    // Find the product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Delete images from Cloudinary if they exist
    if (product.images && product.images.length > 0) {
      console.log('🗑️ Deleting images from Cloudinary...');
      
      const deletePromises = product.images.map(img => {
        if (img.main?.publicId) {
          return cloudinary.uploader.destroy(img.main.publicId);
        }
        return Promise.resolve();
      });
      
      await Promise.all(deletePromises);
      console.log(`✅ Deleted ${deletePromises.length} images from Cloudinary`);
    }

    // Delete the product from database
    await Product.findByIdAndDelete(req.params.id);
    
    console.log(`✅ Product "${product.name}" deleted successfully`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
      deletedProductId: req.params.id
    });
  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error deleting product' 
    });
  }
});


router.get('/categories', verifyAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// Create category
router.post('/categories', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;
    
    let imageData = null;
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'luxeparfum/categories',
            transformation: [
              { width: 400, height: 400, crop: "fill" },
              { quality: "auto" },
              { format: "webp" }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      imageData = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id
      };
    }

    const category = new Category({
      name,
      description,
      sortOrder: sortOrder || 0,
      image: imageData
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating category'
    });
  }
});

// Update category
router.put('/categories/:id', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, sortOrder, isActive } = req.body;
    
    const updateData = {
      name,
      description,
      sortOrder,
      isActive
    };

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      const oldCategory = await Category.findById(req.params.id);
      if (oldCategory?.image?.publicId) {
        await cloudinary.uploader.destroy(oldCategory.image.publicId);
      }

      // Upload new image
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'luxeparfum/categories',
            transformation: [
              { width: 400, height: 400, crop: "fill" },
              { quality: "auto" },
              { format: "webp" }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      updateData.image = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id
      };
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating category'
    });
  }
});

// Delete category
router.delete('/categories/:id', verifyAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Delete image from Cloudinary
    if (category.image?.publicId) {
      await cloudinary.uploader.destroy(category.image.publicId);
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  }
});

// ==================== DELIVERY ROUTES ====================

// Get all delivery rules
router.get('/delivery-rules', verifyAdmin, async (req, res) => {
  try {
    const rules = await DeliveryRule.find().sort({ minPieces: 1 });
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Get delivery rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery rules'
    });
  }
});

// Create delivery rule
router.post('/delivery-rules', verifyAdmin, async (req, res) => {
  try {
    const { minPieces, maxPieces, deliveryCost, description, country } = req.body;

    const rule = new DeliveryRule({
      minPieces: parseInt(minPieces),
      maxPieces: parseInt(maxPieces),
      deliveryCost: parseFloat(deliveryCost),
      description,
      country: country ? country.toUpperCase() : 'ALL'
    });

    await rule.save();

    res.status(201).json({
      success: true,
      message: 'Delivery rule created successfully',
      data: rule
    });
  } catch (error) {
    console.error('Create delivery rule error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Overlapping piece range for this country'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating delivery rule'
    });
  }
});

// Update delivery rule
router.put('/delivery-rules/:id', verifyAdmin, async (req, res) => {
  try {
    const { minPieces, maxPieces, deliveryCost, description, isActive, country } = req.body;

    const updateData = {
      minPieces: parseInt(minPieces),
      maxPieces: parseInt(maxPieces),
      deliveryCost: parseFloat(deliveryCost),
      description,
      isActive,
      country: country ? country.toUpperCase() : 'ALL'
    };

    const rule = await DeliveryRule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Delivery rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery rule updated successfully',
      data: rule
    });
  } catch (error) {
    console.error('Update delivery rule error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Overlapping piece range for this country'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating delivery rule'
    });
  }
});

// Delete delivery rule
router.delete('/delivery-rules/:id', verifyAdmin, async (req, res) => {
  try {
    const rule = await DeliveryRule.findByIdAndDelete(req.params.id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Delivery rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete delivery rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting delivery rule'
    });
  }
});

// Calculate delivery cost based on pieces
router.post('/delivery-rules/calculate', verifyAdmin, async (req, res) => {
  try {
    const { pieces, country } = req.body;
    
    const rule = await DeliveryRule.findOne({
      minPieces: { $lte: pieces },
      maxPieces: { $gte: pieces },
      country: country ? country.toUpperCase() : 'ALL',
      isActive: true
    }).sort({ country: -1 }); // Prefer country-specific over 'ALL'

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'No delivery rule found for this piece count'
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Calculate delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating delivery cost'
    });
  }
});

// Get all countries with tax rates
router.get('/countries', verifyAdmin, async (req, res) => {
  try {
    const countries = await ShippingCost.find().sort({ countryName: 1 });
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching countries'
    });
  }
});

// Create country with tax
router.post('/countries', verifyAdmin, async (req, res) => {
  try {
    const { countryCode, countryName, cost, taxPercentage } = req.body;

    const country = new ShippingCost({
      country: countryCode.toUpperCase().trim(),
      countryName: countryName.trim(),
      cost: parseFloat(cost),
      taxPercentage: parseFloat(taxPercentage) || 8
    });

    await country.save();

    res.status(201).json({
      success: true,
      message: 'Country added successfully',
      data: country
    });
  } catch (error) {
    console.error('Create country error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Country already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating country'
    });
  }
});

// Update country
router.put('/countries/:id', verifyAdmin, async (req, res) => {
  try {
    const { countryCode, countryName, cost, taxPercentage, isActive } = req.body;

    const updateData = {
      country: countryCode ? countryCode.toUpperCase().trim() : undefined,
      countryName,
      cost: parseFloat(cost),
      taxPercentage: parseFloat(taxPercentage),
      isActive
    };

    const country = await ShippingCost.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    res.json({
      success: true,
      message: 'Country updated successfully',
      data: country
    });
  } catch (error) {
    console.error('Update country error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Country code already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating country'
    });
  }
});

// Delete country
router.delete('/countries/:id', verifyAdmin, async (req, res) => {
  try {
    const country = await ShippingCost.findByIdAndDelete(req.params.id);
    
    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    res.json({
      success: true,
      message: 'Country deleted successfully'
    });
  } catch (error) {
    console.error('Delete country error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting country'
    });
  }
});

// Calculate shipping and tax for checkout
router.post('/calculate-checkout', async (req, res) => {
  try {
    const { pieces, countryCode } = req.body;
    
    // Get country tax info
    const country = await ShippingCost.findOne({
      country: countryCode.toUpperCase().trim(),
      isActive: true
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'We do not ship to this country'
      });
    }

    // Get delivery rule based on pieces
    const deliveryRule = await DeliveryRule.findOne({
      minPieces: { $lte: pieces },
      maxPieces: { $gte: pieces },
      $or: [
        { country: countryCode.toUpperCase() },
        { country: 'ALL' }
      ],
      isActive: true
    }).sort({ country: -1 }); // Prefer country-specific over 'ALL'

    if (!deliveryRule) {
      return res.status(404).json({
        success: false,
        message: 'No delivery rule found for this order'
      });
    }

    res.json({
      success: true,
      data: {
        country: country.countryName,
        shippingCost: deliveryRule.deliveryCost,
        taxPercentage: country.taxPercentage,
        deliveryDescription: deliveryRule.description
      }
    });
  } catch (error) {
    console.error('Calculate checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating shipping and tax'
    });
  }
});


router.get('/public/countries', async (req, res) => {
  try {
    const countries = await ShippingCost.find({ isActive: true })
      .select('country countryName')
      .sort({ countryName: 1 });
    
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Get public countries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching countries'
    });
  }
});

// Public endpoint for calculating shipping and tax
router.post('/public/calculate-checkout', async (req, res) => {
  try {
    const { pieces, countryCode } = req.body;
    
    if (!countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Country code is required'
      });
    }

    // Get country tax info
    const country = await ShippingCost.findOne({
      country: countryCode.toUpperCase().trim(),
      isActive: true
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'We do not ship to this country'
      });
    }

    // Get delivery rule based on pieces
    const deliveryRule = await DeliveryRule.findOne({
      minPieces: { $lte: pieces },
      maxPieces: { $gte: pieces },
      $or: [
        { country: countryCode.toUpperCase() },
        { country: 'ALL' }
      ],
      isActive: true
    }).sort({ country: -1 });

    if (!deliveryRule) {
      return res.status(404).json({
        success: false,
        message: 'No delivery rule found for this order'
      });
    }

    res.json({
      success: true,
      data: {
        country: country.countryName,
        shippingCost: deliveryRule.deliveryCost,
        taxPercentage: country.taxPercentage,
        deliveryDescription: deliveryRule.description
      }
    });
  } catch (error) {
    console.error('Public calculate checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating shipping and tax'
    });
  }
});

export default router;