import * as deepl from 'deepl-node';

let translator: deepl.Translator | null = null;

function getTranslator(): deepl.Translator {
  if (!translator) {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPL_API_KEY environment variable is not set');
    }
    translator = new deepl.Translator(apiKey);
  }
  return translator;
}

export async function translateToEnglish(text: string): Promise<string> {
  if (!text.trim()) {
    return '';
  }

  const result = await getTranslator().translateText(text, 'uk', 'en-US');
  return result.text;
}