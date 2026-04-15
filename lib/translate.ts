import * as deepl from 'deepl-node';

const translator = new deepl.Translator(process.env.DEEPL_API_KEY!);

export async function translateToEnglish(text: string): Promise<string> {
  if (!text.trim()) {
    return '';
  }

  const result = await translator.translateText(text, 'ua', 'en-US');
  return result.text;
}