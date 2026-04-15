import { NextResponse } from 'next/server';
import { translateToEnglish } from '@/lib/translate';

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const translated: string = await translateToEnglish(text);

    return NextResponse.json({ translated });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}