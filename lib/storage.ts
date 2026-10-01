import 'server-only';
import { del, list } from '@vercel/blob';
import { IMAGE_PATH_PREFIX } from './image-validation';

// Images live in Vercel Blob (public access) under
// ghost-sightings-images/<userId>/<timestamp>-<random>.<ext>, mirroring the old Supabase bucket layout.
// Uploads go through app/api/images/upload (client side: lib/upload-image.ts).
// BLOB_READ_WRITE_TOKEN is read from the server environment by @vercel/blob.

/**
 * Delete an image from Vercel Blob
 * @param imageUrl - The public URL of the image to delete
 */
export async function deleteSightingImage(imageUrl: string): Promise<void> {
  try {
    const url = new URL(imageUrl);
    if (!url.hostname.endsWith('.blob.vercel-storage.com')) {
      throw new Error('Invalid image URL');
    }
    await del(imageUrl);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Get a list of all images for a user (newest first, max 100)
 * @param userId - The user ID to get images for
 */
export async function getUserImages(userId: string = 'anonymous'): Promise<string[]> {
  try {
    const { blobs } = await list({ prefix: `${IMAGE_PATH_PREFIX}/${userId}/`, limit: 100 });
    return blobs
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .map((blob) => blob.url);
  } catch (error) {
    console.error('Error listing images:', error);
    throw error;
  }
}
