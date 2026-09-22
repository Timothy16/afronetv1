// server/api/upload/video.post.ts
import { uploadToGoogleCloud } from '#server/utils/googleCloudUpload';
import { createError } from 'h3';

const allowedVideoTypes = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'm4v'];
const allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

export default defineEventHandler(async (event) => {
    try {
        const parts = await readMultipartFormData(event);
        if (!parts || parts.length === 0) {
            throw createError({ statusCode: 400, message: 'No file uploaded' });
        }

        const filePart = parts.find((p) => p.name === 'file');
        if (!filePart || !filePart.data || !filePart.filename) {
            throw createError({ statusCode: 400, message: 'File field missing or invalid' });
        }

        const fileExt = filePart.filename.split('.').pop()?.toLowerCase() || '';

        const isVideo = allowedVideoTypes.includes(fileExt);
        const isImage = allowedImageTypes.includes(fileExt);

        if (!isVideo && !isImage) {
            throw createError({
                statusCode: 400,
                message: 'Invalid file type. Only video (MP4, MOV, WEBM…) or image (JPG, PNG, WEBP…) files are allowed'
            });
        }

        const folder = isImage ? 'images' : 'videos';

        const result = await uploadToGoogleCloud({
            fileBuffer: filePart.data,
            fileName: filePart.filename,
            userId: 'public',
            folder
        });

        return {
            success: true,
            message: isImage ? 'Image uploaded successfully' : 'Video uploaded successfully',
            fileUrl: result.imageUrl,
            fileType: isImage ? 'image' : 'video'
        };
    } catch (error: any) {
        console.error('Media upload error:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Failed to upload file'
        });
    }
});