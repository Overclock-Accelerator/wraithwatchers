import { supabase } from './supabase';

const BUCKET_NAME = 'ghost-sightings-images';

/**
 * Upload an image file to Supabase Storage
 * @param file - The image file to upload
 * @param userId - Optional user ID to organize uploads (can use 'anonymous' for public uploads)
 * @returns The public URL of the uploaded image
 */
export async function uploadSightingImage(
  file: File,
  userId: string = 'anonymous'
): Promise<string> {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${timestamp}-${randomString}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 */
export async function deleteSightingImage(imageUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`);
    if (pathParts.length < 2) {
      throw new Error('Invalid image URL');
    }
    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Get a list of all images for a user
 * @param userId - The user ID to get images for
 */
export async function getUserImages(userId: string = 'anonymous'): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('List error:', error);
      throw new Error(`Failed to list images: ${error.message}`);
    }

    // Get public URLs for all files
    const urls = data.map((file) => {
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`${userId}/${file.name}`);
      return urlData.publicUrl;
    });

    return urls;
  } catch (error) {
    console.error('Error listing images:', error);
    throw error;
  }
}

