import {supabase} from "@/lib/supabase/ClientComponentClient";
import {getPublicImageUrl} from "@/services/storage/getPublicImageUrl";
import {LocalizedText} from "@/types";

export interface AuthorData {
  instagram: string;
  tikTok: string;
  youTube: string;
  facebook: string;
  telegram: string;
  id: string;
  image: string;
  name: string;
  recipesCount: number;
  subscribers: number;
  views: number;
  email: string;
  description: LocalizedText;
  descriptionFooter: LocalizedText;
  animatedHeroWords: LocalizedText;
  heroCakeId: string;
}

export interface AuthorInfo {
  data: AuthorData;
  error: Error | null;
}

// Shape of a row in the `author` table (snake_case columns).
export interface AuthorRow {
  id: string;
  inst_link: string;
  tik_tok_link: string;
  you_tube_link: string;
  facebook_link: string;
  telegram_link: string;
  image: string;
  name: string;
  recipes_count: number;
  subscribers: number;
  views: number;
  contact_email: string;
  description: LocalizedText | null;
  description_footer: LocalizedText | null;
  animated_hero_words: { en: string[]; uk: string[] } | null;
  hero_cake_id: string;
}

// Single source of truth for mapping a DB row to the app-facing shape.
// Hero words are stored as string arrays and exposed as space-joined strings.
export const mapAuthorRow = (row: AuthorRow): AuthorData => ({
  instagram: row.inst_link,
  tikTok: row.tik_tok_link,
  youTube: row.you_tube_link,
  facebook: row.facebook_link,
  telegram: row.telegram_link,
  id: row.id,
  image: getPublicImageUrl(row.image, 'author') || '',
  name: row.name,
  recipesCount: row.recipes_count,
  subscribers: row.subscribers,
  views: row.views,
  email: row.contact_email,
  description: {
    en: row.description?.en || '',
    uk: row.description?.uk || '',
  },
  descriptionFooter: {
    en: row.description_footer?.en || '',
    uk: row.description_footer?.uk || '',
  },
  animatedHeroWords: {
    en: row.animated_hero_words?.en?.join(' ') || '',
    uk: row.animated_hero_words?.uk?.join(' ') || '',
  },
  heroCakeId: row.hero_cake_id,
});

// Fallback used when the author row can't be loaded.
const FALLBACK_AUTHOR: AuthorData = {
  instagram: '#',
  tikTok: '#',
  youTube: '#',
  facebook: '#',
  telegram: '#',
  id: '',
  image: '',
  name: 'Yuliia',
  recipesCount: 1000,
  subscribers: 1.1,
  views: 50,
  email: '',
  description: {en: '', uk: ''},
  descriptionFooter: {en: '', uk: ''},
  animatedHeroWords: {en: '', uk: ''},
  heroCakeId: '',

};

export const fetchAuthorInfo = async (): Promise<AuthorInfo> => {
  const {data: author, error} = await supabase
    .from('author')
    .select('*');

  if (error || !author?.[0]) {
    return {data: FALLBACK_AUTHOR, error};
  }

  return {data: mapAuthorRow(author[0]), error: null};
};