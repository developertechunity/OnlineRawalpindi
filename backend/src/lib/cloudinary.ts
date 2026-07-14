import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// ✅ Lazy config: called inside helpers so it always runs AFTER dotenv.config()
// (ES module imports are hoisted and execute before server.ts's dotenv.config()).
const configure = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
};

export interface CloudinaryUploadResult {
    url: string;
    publicId: string;
}

// ✅ Upload a file buffer directly to Cloudinary (memory storage, no temp files).
export const uploadToCloudinary = (
    buffer: Buffer,
    folder: string
): Promise<CloudinaryUploadResult> => {
    configure();

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
                if (error || !result) {
                    return reject(error || new Error('Cloudinary upload failed'));
                }
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        Readable.from(buffer).pipe(stream);
    });
};

// ✅ Delete an image from Cloudinary by its public id.
export const deleteFromCloudinary = (publicId: string): Promise<any> => {
    configure();
    return cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
