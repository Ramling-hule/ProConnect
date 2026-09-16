import cloudinary from '../config/cloudinary.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const uploadFile = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        throw new AppError();
    }

    const uploadToCloudinary = (buffer) => {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    folder: "uni_connect_chat_files",
                },
                (error, result) => {
                    if (error) return reject(new AppError("File upload failed", 500));
                    resolve(result);
                }
            );
            uploadStream.end(buffer);
        });
    };

    const result = await uploadToCloudinary(req.file.buffer);

    res.status(200).json({
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        original_filename: req.file.originalname
    });
});