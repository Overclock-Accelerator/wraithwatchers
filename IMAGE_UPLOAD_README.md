# Image Upload Feature for Ghost Sightings

This document explains the image upload functionality in the Wraith Watchers app.

## Overview

Users can upload photos as evidence when posting ghost sightings. Images are stored in Vercel Blob (public access) and displayed on the map and in the sightings table.

## Features

- ✅ **File upload with drag & drop interface**
- ✅ **Image preview before submission**
- ✅ **File validation** (type and size) in the browser, re-enforced server-side
- ✅ **Upload to Vercel Blob**
- ✅ **Display images in map popups**
- ✅ **Image indicators in sightings table**
- ✅ **Support for JPEG, PNG, GIF, and WebP formats**
- ✅ **5MB file size limit**

## Setup Instructions

### 1. Configure Vercel Blob

Connect a Blob store to the Vercel project. That sets `BLOB_READ_WRITE_TOKEN` in every environment.
For local development, put the same token in `.env.local` (server-only; never prefix it with `NEXT_PUBLIC_`).

### 2. Test the Feature

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the "Post a Sighting" page
3. Fill out the form
4. Click the image upload area or drag & drop a file
5. Submit the form
6. Check that the image appears in the map popup when clicking the marker

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
Browser asks /api/images/upload for a short-lived upload token
(server checks pathname, content type and 5MB limit; BLOB_READ_WRITE_TOKEN never leaves the server)
    ↓
Browser uploads the file directly to Vercel Blob
    ↓
Public URL saved to database with sighting (POST /api/sightings)
    ↓
Image displayed on map
```

The file goes straight from the browser to Blob, so uploads are not limited by the
serverless request-body limit (4.5MB on Vercel).

### File Structure

```
lib/
  upload-image.ts      # Browser-side upload (uploadSightingImage)
  storage.ts           # Server-only Blob helpers (deleteSightingImage, getUserImages)
  image-validation.ts  # Shared type/size/pathname rules
app/
  api/images/upload/
    route.ts           # Issues upload tokens
  post-sighting/
    page.tsx           # Form with upload
  components/
    MapboxMap.tsx      # Displays images
```

### Storage Organization

Images are stored with unique pathnames:
```
ghost-sightings-images/anonymous/
  1730148234567-abc123def.jpg
  1730148456789-xyz789ghi.png
```

Format: `ghost-sightings-images/{userId}/{timestamp}-{random}.{extension}` (the server only accepts `anonymous`).

## Usage Examples

### Basic Upload (client component)

```typescript
import { uploadSightingImage } from '@/lib/upload-image';

const file = event.target.files[0];
const imageUrl = await uploadSightingImage(file);
formData.image_link = imageUrl;
```

### Delete Image (server code only)

```typescript
import { deleteSightingImage } from '@/lib/storage';

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
- Enforced client-side and by the upload token issued by the server

### Security
- Only image MIME types are accepted
- Public read access for viewing
- Overwrites are rejected; unique pathnames avoid collisions

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid file type" | Wrong file format | Use JPEG, PNG, GIF, or WebP |
| "File too large" | File exceeds 5MB | Compress or resize image |
| "Vercel Blob: ..." | Token route or Blob rejected the upload | Check `BLOB_READ_WRITE_TOKEN` and the server log |

## Related Documentation

- `lib/upload-image.ts` / `lib/storage.ts` - Storage utility functions
- `app/post-sighting/page.tsx` - Upload form implementation
- Vercel Blob Docs: https://vercel.com/docs/vercel-blob
