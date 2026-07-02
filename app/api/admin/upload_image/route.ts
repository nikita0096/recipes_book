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

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const formData = await request.formData();

  const file = formData.get("file");
  const bucket = formData.get("bucket");
  const filePath = formData.get("filePath");


  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  if (typeof bucket !== "string" || typeof filePath !== "string") {
    return NextResponse.json({ error: 'Invalid bucket or path' }, { status: 400 });
  }

  let composedFile: FileOutput | undefined;

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  try {
    composedFile = await sharp(inputBuffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({quality: 85})
      .toBuffer({resolveWithObject: true});
  } catch (error) {
    console.error('Image compression failed:', error);
    return NextResponse.json({imagePath: '', error: 'Failed to compose image' }, { status: 500 });
  }

  const supabase = await createClient();

  const fileExtension = composedFile.info.format;
  const path = `${filePath}.${fileExtension}`;

  const {data, error} = await supabase.storage
    .from(bucket)
    .upload(path, composedFile.data, {contentType: `image/${fileExtension}`});

  if (error) {
    console.error('Image upload failed:', error);
    return NextResponse.json({imagePath: '', error: 'Failed to upload image' }, { status: 500 });
  }

  return NextResponse.json({ imagePath: data.path , error: ''});
}