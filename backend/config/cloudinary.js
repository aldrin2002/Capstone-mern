import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary with debug logging
cloudinary.config({
  cloud_name: 'djmmcxkg2',
  api_key: '884838246632958',
  api_secret: 'ARXeZPm4vS2VHPWuVU9D8ggzfMk'
});

// Test Cloudinary connection
console.log("🔧 Cloudinary Config:");
console.log("Cloud Name:", cloudinary.config().cloud_name);
console.log("API Key:", cloudinary.config().api_key);
console.log("API Secret:", cloudinary.config().api_secret ? "***SET***" : "NOT SET");

// Configure Cloudinary storage for product images
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cafe-products',
    format: async (req, file) => {
      const supportedFormats = ['jpg', 'jpeg', 'png', 'webp'];
      const fileFormat = file.mimetype.split('/')[1];
      return supportedFormats.includes(fileFormat) ? fileFormat : 'jpg';
    },
    public_id: (req, file) => {
      const timestamp = Date.now();
      const originalName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      return `product_${timestamp}_${originalName}`;
    },
    transformation: [
      {
        width: 800,
        height: 600,
        crop: "fill",
        quality: "auto:good"
      }
    ]
  }
});

// Configure Cloudinary storage for proof of payment images
const proofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'proof-of-payment',
    format: async (req, file) => {
      const supportedFormats = ['jpg', 'jpeg', 'png', 'webp'];
      const fileFormat = file.mimetype.split('/')[1];
      return supportedFormats.includes(fileFormat) ? fileFormat : 'jpg';
    },
    public_id: (req, file) => {
      const timestamp = Date.now();
      const originalName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
      return `proof_${timestamp}_${originalName}`;
    },
    transformation: [
      {
        width: 1200,
        height: 1600,
        crop: "limit",
        quality: "auto:good"
      }
    ]
  }
});

// Create upload middleware
const upload = multer({ 
  storage: proofStorage, // Use proof storage for order uploads
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log("📁 File being uploaded:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Product upload middleware (keep existing functionality)
const productUpload = multer({ 
  storage: productStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

export { cloudinary, upload, productUpload };