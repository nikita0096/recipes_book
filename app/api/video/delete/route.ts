import {NextRequest, NextResponse} from "next/server";
import {requireAdmin} from "@/lib/auth/requireAdmin";
import {DeleteObjectCommand, S3ServiceException} from "@aws-sdk/client-s3";
import {R2_BUCKET, r2Client} from "@/lib/r2/client";

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { videoKey } = await request.json();

    if (!videoKey) {
      return NextResponse.json({ error: 'Missing a video key' }, { status: 400 });
    }

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: videoKey,
    });

    await r2Client.send(command);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete video error:', err);

    if (err instanceof S3ServiceException) {
      return NextResponse.json(
        { error: `R2 error: ${err.message}` },
        { status: err.$metadata.httpStatusCode || 500 }
      );
    }

    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}