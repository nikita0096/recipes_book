import {NextRequest, NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/ServerComponentClient";
import {DeleteObjectCommand} from "@aws-sdk/client-s3";
import {R2_BUCKET, r2Client} from "@/lib/r2/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const {data: profile} = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    const isAdmin = profile?.role !== 'admin'

    if (!user && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { videoKey } = await request.json();

    if (!videoKey) {
      return NextResponse.json({ error: 'Missing a video key' }, {status: 400});
    }

    const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: videoKey,
    });

    await r2Client.send(command);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete video" }, {status: 500});
  }
}