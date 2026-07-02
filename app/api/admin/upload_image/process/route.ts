import sharp, {OutputInfo} from 'sharp';
import {NextRequest, NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/ServerComponentClient";
import {requireAdmin} from "@/lib/auth/requireAdmin";

// sharp relies on native Node bindings and can't run on the Edge runtime.
export const runtime = 'nodejs';

interface FileOutput {
  data: Buffer<ArrayBuffer>;
  info: OutputInfo
}

/**
 * Compresses an original image previously uploaded to `${filePath}.orig` via a
 * signed upload URL (see the companion sign route). Only the small JSON body
 * travels through Vercel; the image bytes stay inside Supabase Storage.
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const bucket = body?.bucket;
  const filePath = body?.filePath;

  if (typeof bucket !== "string" || !bucket || typeof filePath !== "string" || !filePath) {
    return NextResponse.json({imagePath: '', error: 'Invalid bucket or path' }, { status: 400 });
  }

  const sourcePath = `${filePath}.orig`;

  const supabase = await createClient();

  const {data: original, error: downloadError} = await supabase.storage
    .from(bucket)
    .download(sourcePath);

  if (downloadError || !original) {
    console.error('Downloading original image failed:', downloadError);
    return NextResponse.json({imagePath: '', error: 'Failed to read uploaded image' }, { status: 500 });
  }

  let composedFile: FileOutput | undefined;

  try {
    const inputBuffer = Buffer.from(await original.arrayBuffer());

    // Byte-integrity diagnostics, visible in Vercel function logs.
    console.log('process input:', inputBuffer.length, 'bytes, head:', inputBuffer.subarray(0, 8).toString('hex'));

    composedFile = await sharp(inputBuffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({quality: 85})
      .toBuffer({resolveWithObject: true});

    console.log('sharp output:', composedFile.data.length, 'bytes, head:', composedFile.data.subarray(0, 8).toString('hex'));
  } catch (error) {
    console.error('Image compression failed:', error);
    await supabase.storage.from(bucket).remove([sourcePath]);
    return NextResponse.json({imagePath: '', error: 'Failed to compose image' }, { status: 500 });
  }

  const fileExtension = composedFile.info.format;
  const path = `${filePath}.${fileExtension}`;

  // Send the bytes as a Blob so storage-js uses its multipart/FormData path.
  // Raw Buffer bodies get UTF-8-mangled by the patched fetch in the Vercel
  // runtime, which corrupted every stored image.
  const blob = new Blob([new Uint8Array(composedFile.data)], {type: `image/${fileExtension}`});

  const {data, error} = await supabase.storage
    .from(bucket)
    .upload(path, blob, {contentType: `image/${fileExtension}`});

  // The original is transient regardless of the upload outcome.
  const {error: removeError} = await supabase.storage.from(bucket).remove([sourcePath]);
  if (removeError) {
    console.error('Removing original image failed:', removeError);
  }

  if (error) {
    console.error('Image upload failed:', error);
    return NextResponse.json({imagePath: '', error: 'Failed to upload image' }, { status: 500 });
  }

  return NextResponse.json({ imagePath: data.path , error: ''});
}