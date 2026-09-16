import multer from 'multer';
import AppError from '../utils/AppError.js';
const ALLOWED_TYPES = {
  'image/jpeg':  { resource_type: 'image', maxBytes: 10 * 1024 * 1024 },
  'image/jpg':   { resource_type: 'image', maxBytes: 10 * 1024 * 1024 },
  'image/png':   { resource_type: 'image', maxBytes: 10 * 1024 * 1024 },
  'image/gif':   { resource_type: 'image', maxBytes: 10 * 1024 * 1024 },
  'image/webp':  { resource_type: 'image', maxBytes: 10 * 1024 * 1024 },
  'video/mp4':   { resource_type: 'video', maxBytes: 100 * 1024 * 1024 },
  'video/webm':  { resource_type: 'video', maxBytes: 100 * 1024 * 1024 },
  'video/quicktime': { resource_type: 'video', maxBytes: 100 * 1024 * 1024 },
  'application/pdf': { resource_type: 'raw', maxBytes: 25 * 1024 * 1024 },
  'text/plain':  { resource_type: 'raw', maxBytes: 1 * 1024 * 1024 },
  'text/markdown': { resource_type: 'raw', maxBytes: 1 * 1024 * 1024 },
};

export const getMimeInfo = (mimeType) => ALLOWED_TYPES[mimeType] || null;

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES[file.mimetype]) {
    return cb(new AppError(
      `File type "${file.mimetype}" is not allowed. Supported: images (jpg/png/gif/webp), videos (mp4/webm/mov), PDFs, and text files.`,
      400
    ), false);
  }
  cb(null, true);
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

export default upload;