import express from 'express';
import Product from '../models/Product.js';
import { upload, generateImageVariants, uploadToCloudinary } from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// In the GET all products route, add .populate()
router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate('category', 'name _id'); // Populate category with name and _id
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// In the GET product by ID route, also add .populate()
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name _id'); // Populate category with name and _id
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update stock quantity
router.patch('/:id/stock', async (req, res) => {
  try {
    const { stockQuantity } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        stockQuantity: Math.max(0, parseInt(stockQuantity)),
        inStock: parseInt(stockQuantity) > 0
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Stock quantity updated successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Create new product with optimized images
router.post('/', upload.array('images', 4), async (req, res) => {
  try {
    const { 
      name, 
      price, 
      currency,
      description, 
      category, 
      featured, 
      inStock, 
      stockQuantity,
      hotDeal, 
      hotDealEnd, 
      dealPercentage, 
      dealOriginalPrice 
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    // Process and upload images with optimization
    const imageProcessingPromises = req.files.map(async (file, index) => {
      try {
        // Generate multiple optimized variants
        const variants = await generateImageVariants(file.buffer);
        
        // Upload main image to Cloudinary
        const mainUploadResult = await uploadToCloudinary(variants.main.buffer);
        
        // Upload thumbnail variant
        const thumbUploadResult = await uploadToCloudinary(variants.thumbnail.buffer, 'luxeparfum/products/thumbnails');
        
        // Upload medium variant
        const mediumUploadResult = await uploadToCloudinary(variants.medium.buffer, 'luxeparfum/products/medium');

        return {
          main: {
            url: mainUploadResult.secure_url,
            publicId: mainUploadResult.public_id,
            format: variants.main.format,
            size: variants.main.optimizedSize,
            width: variants.main.width,
            height: variants.main.height
          },
          variants: {
            thumbnail: thumbUploadResult.secure_url,
            medium: mediumUploadResult.secure_url,
            large: mainUploadResult.secure_url
          },
          originalImage: {
            name: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            originalFormat: variants.main.originalFormat
          }
        };
      } catch (error) {
        throw new Error(`Failed to process image ${file.originalname}: ${error.message}`);
      }
    });

    const processedImages = await Promise.all(imageProcessingPromises);

    // CHANGED: Store ALL processed images as array, not just the first one
    const product = new Product({
      name,
      price,
      currency: currency || 'USD',
      description,
      images: processedImages, // Store all images in array
      originalImages: processedImages.map(img => img.originalImage),
      category: category || 'perfume',
      featured: featured === 'true',
      inStock: inStock !== 'false',
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
      hotDeal: hotDeal === 'true',
      hotDealEnd: hotDealEnd || null,
      dealPercentage: dealPercentage ? parseFloat(dealPercentage) : null,
      dealOriginalPrice: dealOriginalPrice || null
    });

    const savedProduct = await product.save();
    
    console.log(`✅ Product "${name}" created with ${processedImages.length} optimized images`);
    
    res.status(201).json({
      success: true,
      message: `Product created successfully with ${processedImages.length} optimized WebP images`,
      data: savedProduct,
      optimization: savedProduct.optimization
    });
  } catch (error) {
    console.error('❌ Product creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update product with image replacement
router.put('/:id', upload.array('images', 4), async (req, res) => {
  try {
    const { 
      name, 
      price, 
      currency,
      description, 
      category, 
      featured, 
      inStock, 
      stockQuantity,
      hotDeal, 
      hotDealEnd, 
      dealPercentage, 
      dealOriginalPrice
    } = req.body;
    
    // Find existing product
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let updatedImages = existingProduct.images;
    let updatedOriginalImages = existingProduct.originalImages;

    // If new images are uploaded, replace the existing ones
    if (req.files && req.files.length > 0) {
      console.log(`🔄 Replacing images for product: ${existingProduct.name}`);
      
      // Delete old images from Cloudinary if they exist
      if (existingProduct.images && Array.isArray(existingProduct.images)) {
        for (let img of existingProduct.images) {
          if (img.main?.publicId) {
            try {
              await cloudinary.uploader.destroy(img.main.publicId);
              console.log(`🗑️ Deleted old image from Cloudinary: ${img.main.publicId}`);
            } catch (deleteError) {
              console.error('Error deleting old image:', deleteError);
            }
          }
        }
      }

      // Process and upload new images
      const imageProcessingPromises = req.files.map(async (file) => {
        try {
          const variants = await generateImageVariants(file.buffer);
          const mainUploadResult = await uploadToCloudinary(variants.main.buffer);
          const thumbUploadResult = await uploadToCloudinary(variants.thumbnail.buffer, 'luxeparfum/products/thumbnails');
          const mediumUploadResult = await uploadToCloudinary(variants.medium.buffer, 'luxeparfum/products/medium');

          return {
            main: {
              url: mainUploadResult.secure_url,
              publicId: mainUploadResult.public_id,
              format: variants.main.format,
              size: variants.main.optimizedSize,
              width: variants.main.width,
              height: variants.main.height
            },
            variants: {
              thumbnail: thumbUploadResult.secure_url,
              medium: mediumUploadResult.secure_url,
              large: mainUploadResult.secure_url
            },
            originalImage: {
              name: file.originalname,
              size: file.size,
              mimetype: file.mimetype,
              originalFormat: variants.main.originalFormat
            }
          };
        } catch (error) {
          throw new Error(`Failed to process image ${file.originalname}: ${error.message}`);
        }
      });

      const processedImages = await Promise.all(imageProcessingPromises);
      
      // CHANGED: Store ALL processed images as array
      updatedImages = processedImages;
      updatedOriginalImages = processedImages.map(img => img.originalImage);
      console.log(`✅ Uploaded ${processedImages.length} new optimized image(s)`);
    }

    const updateData = {
      name,
      price,
      currency: currency || 'USD',
      description,
      images: updatedImages, // Store all images in array
      originalImages: updatedOriginalImages,
      category: category || 'perfume',
      featured: featured === 'true',
      inStock: inStock !== 'false',
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : existingProduct.stockQuantity,
      hotDeal: hotDeal === 'true',
      hotDealEnd: hotDealEnd || null,
      dealPercentage: dealPercentage ? parseFloat(dealPercentage) : null,
      dealOriginalPrice: dealOriginalPrice || null
    };

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log(`🔄 Product "${name}" updated with ${updatedImages.length} optimized images`);

    res.json({
      success: true,
      message: req.files && req.files.length > 0 
        ? `Product updated successfully with ${req.files.length} new optimized WebP images` 
        : 'Product updated successfully',
      data: product,
      optimization: product.optimization
    });
  } catch (error) {
    console.error('❌ Product update error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete images from Cloudinary
    if (product.images && Array.isArray(product.images)) {
      for (let img of product.images) {
        if (img.main?.publicId) {
          try {
            await cloudinary.uploader.destroy(img.main.publicId);
            console.log(`🗑️ Deleted image from Cloudinary: ${img.main.publicId}`);
          } catch (deleteError) {
            console.error('Error deleting image:', deleteError);
          }
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add this route to your existing product routes
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name description image sortOrder isActive')
      .sort('sortOrder');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

export default router;