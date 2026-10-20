import { upload } from '@vercel/blob/client';
import { VALID_IMAGE_TYPES, MAX_IMAGE_SIZE, IMAGE_PATH_PREFIX } from './image-validation';

/**
 * Upload an image file to Vercel Blob (browser side).
 * The browser only receives a short-lived, upload-scoped client token from
 * /api/images/upload, which re-checks type, size and pathname server-side.
 * The file goes straight to Blob, so the 5MB limit is not capped by the
 * serverless request-body limit (4.5MB on Vercel).
 * @param file - The image file to upload
 * @param userId - Folder to organize uploads under (only 'anonymous' is accepted by the server)
 * @returns The public URL of the uploaded image
 */
export async function uploadSightingImage(
  file: File,
  userId: string = 'anonymous'
): Promise<string> {
  try {
    // Validate file type
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    // Validate file size (max 5MB)
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${IMAGE_PATH_PREFIX}/${userId}/${timestamp}-${randomString}.${fileExt}`;

    const blob = await upload(fileName, file, {
      access: 'public',
      handleUploadUrl: '/api/images/upload',
      contentType: file.type,
    });

    return blob.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
