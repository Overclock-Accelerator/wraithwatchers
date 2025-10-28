# Image Upload Feature for Ghost Sightings

This document explains the image upload functionality added to the Wraith Watchers app.

## Overview

Users can now upload photos as evidence when posting ghost sightings. Images are stored in Supabase Storage and displayed on the map and in the sightings table.

## Features

- ✅ **File upload with drag & drop interface**
- ✅ **Image preview before submission**
- ✅ **Client-side file validation** (type and size)
- ✅ **Automatic upload to Supabase Storage**
- ✅ **Display images in map popups**
- ✅ **Image indicators in sightings table**
- ✅ **Support for JPEG, PNG, GIF, and WebP formats**
- ✅ **5MB file size limit**

## Setup Instructions

### 1. Configure Supabase Storage

Follow the detailed instructions in `SUPABASE_STORAGE_SETUP.md` to:
- Create the `ghost-sightings-images` storage bucket
- Set up storage policies for uploads and downloads
- Configure public access

### 2. Test the Feature

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the "Post a Sighting" page
3. Fill out the form
4. Click the image upload area or drag & drop a file
5. Submit the form
6. Check that the image appears in:
   - The map popup when clicking the marker
   - The Supabase Storage bucket

## How It Works

### Upload Flow

```
User selects file
    ↓
Client validates file (type, size)
    ↓
Image preview shown
    ↓
User submits form
    ↓
File uploaded to Supabase Storage
    ↓
Public URL generated
    ↓
URL saved to database with sighting
    ↓
Image displayed on map
```

### File Structure

```
lib/
  storage.ts           # Supabase Storage utilities
app/
  post-sighting/
    page.tsx           # Updated form with upload
  components/
    MapboxMap.tsx      # Already displays images
```

### Storage Organization

Images are stored with unique filenames:
```
ghost-sightings-images/
  anonymous/
    1730148234567-abc123def.jpg
    1730148456789-xyz789ghi.png
```

Format: `{userId}/{timestamp}-{random}.{extension}`

## Usage Examples

### Basic Upload

```typescript
import { uploadSightingImage } from '@/lib/storage';

// Upload an image file
const file = event.target.files[0];
const imageUrl = await uploadSightingImage(file);

// Use the URL in your sighting data
formData.image_link = imageUrl;
```

### With User ID

```typescript
// If you have user authentication
const imageUrl = await uploadSightingImage(file, userId);
```

### Delete Image

```typescript
import { deleteSightingImage } from '@/lib/storage';

// Delete an image by its URL
await deleteSightingImage(imageUrl);
```

## Validation Rules

### Accepted File Types
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/gif`
- `image/webp`

### File Size Limit
- Maximum: **5MB**
- Enforced both client-side and in Supabase

### Security
- Files are scanned by Supabase for malware
- Only image MIME types are accepted
- Public bucket with read-only access for viewing
- Unique filenames prevent overwrites

## UI Components

### Upload Interface

The form includes:
- Drag & drop upload area
- Click to browse file selector
- Image preview with remove button
- Upload progress indicators
- Error messages for validation failures

### Display Locations

Images appear in:
1. **Map Popups**: Full image shown when clicking a sighting marker
2. **Sightings Table**: Badge indicating if image is present
3. **Form Preview**: Before submission to confirm correct image

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid file type" | Wrong file format | Use JPEG, PNG, GIF, or WebP |
| "File too large" | File exceeds 5MB | Compress or resize image |
| "Failed to upload image" | Storage policy issue | Check Supabase policies |
| "New row violates row-level security policy" | Missing storage policies | Set up policies in Supabase |

### Debug Tips

1. **Check browser console** for detailed error messages
2. **Verify Supabase bucket name** matches `ghost-sightings-images`
3. **Confirm storage policies** are set up correctly
4. **Test file size** with a small image first
5. **Check network tab** to see upload requests

## Performance Considerations

### Client-Side Optimization

- File validation happens before upload
- Preview uses FileReader API (no server round-trip)
- Upload only occurs on form submission

### Storage Optimization

- Consider implementing image compression
- Use appropriate image formats (WebP for best compression)
- Monitor storage usage in Supabase dashboard

### Best Practices

1. **Compress images** before upload when possible
2. **Use WebP format** for better compression
3. **Implement image moderation** for public-facing apps
4. **Set up lifecycle policies** to delete old images
5. **Monitor costs** in Supabase dashboard

## Future Enhancements

Potential improvements:

- [ ] **Image compression** before upload
- [ ] **Multiple image uploads** per sighting
- [ ] **Image cropping/editing** in-browser
- [ ] **Thumbnail generation** for performance
- [ ] **Image gallery view** for sightings
- [ ] **User authentication** for upload tracking
- [ ] **Image moderation queue**
- [ ] **EXIF data preservation** (date, location)
- [ ] **Progressive image loading**
- [ ] **Cloud CDN integration**

## Cost Estimation

Based on Supabase Storage pricing (2024):

| Metric | Free Tier | Pro Tier | Cost |
|--------|-----------|----------|------|
| Storage | 1 GB | 100 GB | $0.021/GB |
| Bandwidth | 2 GB/month | 50 GB/month | $0.09/GB |

**Example**: 
- 1,000 images × 500KB average = 500MB storage
- 10,000 views × 500KB = 5GB bandwidth/month
- **Cost**: ~$0.45/month (free tier sufficient for small apps)

## Troubleshooting

### Images not uploading

1. Check Supabase dashboard → Storage → Policies
2. Verify bucket name is exactly `ghost-sightings-images`
3. Check browser console for error messages
4. Test with a small (< 1MB) JPEG file
5. Verify environment variables are set

### Images not displaying

1. Check that bucket is set to **Public**
2. Verify read policy is configured
3. Open image URL directly in browser
4. Check network tab for 403/404 errors
5. Inspect image URL format in database

### Upload succeeds but URL is broken

1. Verify bucket is public
2. Check URL format matches Supabase pattern
3. Test URL in incognito window (cache issue)
4. Regenerate public URL in code

## Support

For issues:
1. Check `SUPABASE_STORAGE_SETUP.md` for setup steps
2. Review Supabase Storage documentation
3. Check browser console for errors
4. Verify storage policies in Supabase dashboard

## Related Documentation

- `SUPABASE_STORAGE_SETUP.md` - Storage bucket configuration
- `lib/storage.ts` - Storage utility functions
- `app/post-sighting/page.tsx` - Upload form implementation
- Supabase Storage Docs: https://supabase.com/docs/guides/storage

