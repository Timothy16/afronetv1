// server/utils/googleCloudUpload.ts
import { Storage } from '@google-cloud/storage';

interface UploadResult {
  imageUrl: string;
  imageName: string;
  azureBlobName: string;
}

interface UploadOptions {
  fileBuffer: Buffer;
  fileName: string;
  userId: string;
  folder: string;
}

export async function uploadToGoogleCloud(options: UploadOptions): Promise<UploadResult> {
  const { fileBuffer, fileName, userId, folder } = options;

  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
  const config = useRuntimeConfig();

  // Initialize Google Cloud Storage
  const storage = new Storage({
    projectId: config.googleCloud.projectId,
    credentials: {
      client_email: config.googleCloud.clientEmail,
      private_key: config.googleCloud.privateKey?.replace(/\\n/g, '\n'),
    },
  });

  // Generate unique filename
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${folder}/${userId}/${uniqueFileName}`;

  // Get content type based on file extension
  const getContentType = (ext: string) => {
    const contentTypes: { [key: string]: string } = {
      // Image types
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml',
      // Video types
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska',
      '3gp': 'video/3gpp',
      'm4v': 'video/x-m4v',
      // Audio types
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'flac': 'audio/flac',
      // Document types
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'rtf': 'application/rtf'
    };
    return contentTypes[ext] || 'application/octet-stream';
  };

  const bucketName = config.googleCloud.storageBucket || 'myschoolacademystore';
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  // Determine upload options based on file size
  const isLargeFile = fileBuffer.length > 5 * 1024 * 1024; // > 5MB

  // Upload file to Google Cloud Storage
  await file.save(fileBuffer, {
    contentType: getContentType(fileExt),
    metadata: {
      cacheControl: 'public, max-age=31536000',
      metadata: {
        uploadedBy: userId,
        uploadDate: new Date().toISOString()
      }
    },
    public: true, // Make the file publicly accessible
    resumable: isLargeFile, // Use resumable only for large files
    timeout: 60000 // 60 second timeout for uploads
  });

  // Return only the relative path (not full URL)
  // Frontend will construct full URL: https://storage.googleapis.com/{bucket}/{filePath}
  return {
    imageUrl: filePath, // Relative path only
    imageName: fileName,
    azureBlobName: filePath // Keep legacy field name for backward compatibility
  };
}