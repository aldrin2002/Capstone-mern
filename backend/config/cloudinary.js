import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Ensure local development can read .env even though routes are imported
// before backend/index.js calls dotenv.config(). In production, Railway env
// vars are already present so this is effectively a no-op.
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folderFromBody = typeof req.body?.folder === "string" ? req.body.folder : "";
    const folder = folderFromBody.trim() || "cafex";

    const allowedFormats = ["jpg", "jpeg", "png", "webp"];

    return {
      folder,
      allowed_formats: allowedFormats,
      resource_type: "image",
      // Keep a deterministic base name; Cloudinary will still ensure uniqueness.
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
    };
  },
});

export const upload = multer({ storage });
export { cloudinary };
