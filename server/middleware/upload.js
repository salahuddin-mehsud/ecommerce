// middleware/optimizedUpload.js
import multer from 'multer';
import sharp from 'sharp';
import cloudinary from '../config/cloudinary.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Increased to 10MB for original uploads
    files: 4
  },
  fileFilter: fileFilter
});

// Image optimization function
const optimizeImage = async (buffer, options = {}) => {
  const {
    quality = 80,
    maxWidth = 1200,
    maxHeight = 1200,
    format = 'webp'
  } = options;

  let image = sharp(buffer);
  
  // Get image metadata
  const metadata = await image.metadata();
  
  // Resize if needed
  if (metadata.width > maxWidth || metadata.height > maxHeight) {
    image = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Convert to WebP with optimization
  const optimizedBuffer = await image
    [format]({ 
      quality,
      effort: 6 // CPU effort for compression
    })
    .toBuffer();

  return {
    buffer: optimizedBuffer,
    format,
    originalFormat: metadata.format,
    originalSize: buffer.length,
    optimizedSize: optimizedBuffer.length,
    width: metadata.width,
    height: metadata.height
  };
};

// Upload to Cloudinary function
const uploadToCloudinary = (buffer, folder = 'luxeparfum/products') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: folder,
        format: 'webp' // Ensure Cloudinary serves as WebP
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

// Generate multiple variants
const generateImageVariants = async (buffer) => {
  const variants = {
    main: await optimizeImage(buffer, { 
      quality: 85, 
      maxWidth: 1200, 
      maxHeight: 1200 
    }),
    thumbnail: await optimizeImage(buffer, { 
      quality: 75, 
      maxWidth: 300, 
      maxHeight: 300 
    }),
    medium: await optimizeImage(buffer, { 
      quality: 80, 
      maxWidth: 600, 
      maxHeight: 600 
    })
  };

  return variants;
};

export { 
  upload, 
  optimizeImage, 
  uploadToCloudinary, 
  generateImageVariants 
};