import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { VALID_IMAGE_TYPES, MAX_IMAGE_SIZE, IMAGE_PATHNAME_PATTERN } from '@/lib/image-validation';

export const dynamic = 'force-dynamic';

// Issues upload-scoped client tokens for Vercel Blob. BLOB_READ_WRITE_TOKEN stays on the server;
// type, size and pathname are enforced here, so a bypassed client check cannot widen them.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!IMAGE_PATHNAME_PATTERN.test(pathname)) {
          throw new Error('Invalid upload path');
        }
        return {
          allowedContentTypes: VALID_IMAGE_TYPES,
          maximumSizeInBytes: MAX_IMAGE_SIZE,
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: 3600,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    );
  }
}
