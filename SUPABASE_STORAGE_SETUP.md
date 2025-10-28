# Supabase Storage Setup for Image Uploads

This guide will help you set up Supabase Storage to enable image uploads for ghost sightings.

## Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard at https://supabase.com/dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Configure the bucket:
   - **Name**: `ghost-sightings-images`
   - **Public bucket**: ✅ Enable (so images can be viewed publicly)
   - **File size limit**: 5 MB (optional, can adjust as needed)
   - **Allowed MIME types**: Leave empty or specify: `image/jpeg, image/jpg, image/png, image/gif, image/webp`
5. Click **Create bucket**

## Step 2: Set Up Storage Policies

By default, the bucket will have no access policies. You need to set up policies to allow:
- **Public read access** (so anyone can view images)
- **Public upload access** (so users can upload images)

### Create Upload Policy

1. Go to **Storage** in the left sidebar
2. Click on your `ghost-sightings-images` bucket
3. Click on the **Policies** tab
4. Click **New Policy**

Configure the policy with these settings:

**Policy name:**
```
Upload Policy
```

**Allowed operation:**
- ✅ Check **SELECT** (allows reading/downloading)
- ✅ Check **INSERT** (allows uploading)
- ⬜ Leave **UPDATE** unchecked
- ⬜ Leave **DELETE** unchecked

**Target roles:**
```
Defaults to all (public) roles if none selected
```
(Leave the dropdown as default - this allows anyone to upload)

**Policy definition:**
```sql
true
```
(This allows all uploads to this bucket. For production, you might want to add restrictions like file size or user authentication)

5. Click **Save** or **Create Policy**

### Alternative: More Restrictive Policy (Optional)

If you want to restrict uploads to only authenticated users in the future, use this policy definition instead:

**Policy definition:**
```sql
auth.role() = 'authenticated'
```

Or to restrict by bucket:

**Policy definition:**
```sql
bucket_id = 'ghost-sightings-images'
```

## Step 3: Verify Policy Setup

After creating the policy, you should see it listed under the Policies tab. It should show:
- **Policy name**: Upload Policy
- **Allowed operations**: SELECT, INSERT
- **Target roles**: public

## Step 4: Verify Environment Variables

Ensure you have the following in your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 5: Test the Setup

Test that your storage is working:

1. Run your app locally with `npm run dev`
2. Go to the "Post a Sighting" page
3. Try uploading an image
4. Check your Supabase Storage bucket to see if the file appears under the **Files** tab

## Troubleshooting

### Error: "Failed to upload image"

1. **Check bucket name**: Make sure the bucket is named exactly `ghost-sightings-images`
2. **Check policies**: Ensure you've set up the upload and read policies
3. **Check file size**: Files must be under 5MB
4. **Check file type**: Only JPEG, PNG, GIF, and WebP are allowed

### Error: "New row violates row-level security policy"

This means you haven't set up the storage policies correctly. Follow Step 2 above and ensure:
- Both **SELECT** and **INSERT** are checked
- Target roles is set to **public** (default)
- Policy definition is set to `true`

### Images not displaying

1. Make sure the bucket is set to **Public**
2. Check that the read policy is set up correctly
3. Verify the image URL in your browser's network tab

## Storage Organization

Images are organized by user/session:
```
ghost-sightings-images/
  anonymous/
    1234567890-abc123.jpg
    1234567891-def456.png
```

If you implement user authentication later, you can organize by user ID:
```
ghost-sightings-images/
  user-uuid-here/
    1234567890-abc123.jpg
```

## Cost Considerations

Supabase Storage pricing (as of 2024):
- **Free tier**: 1 GB storage, 2 GB bandwidth/month
- **Pro tier**: $0.021/GB storage, $0.09/GB bandwidth

Monitor your usage in the Supabase dashboard under **Settings** → **Usage**.

## Next Steps

- Consider implementing user authentication
- Add image compression before upload to save storage space
- Add image moderation/review system
- Implement image deletion for sightings that are removed

