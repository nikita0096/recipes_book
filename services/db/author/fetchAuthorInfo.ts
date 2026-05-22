import {supabase} from "@/lib/supabase/ClientComponentClient";
import {getPublicImageUrl} from "@/services/storage/getPublicImageUrl";

export interface AuthorInfo {
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
  error: Error | null
}

export const fetchAuthorInfo = async (): Promise<AuthorInfo> => {
  const {data: author, error} = await supabase
    .from('author')
    .select('*');

  if (error || !author) {
    return {
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
      error: error
    }
  }

  const imageUrl = getPublicImageUrl(author[0].image, 'author');

  return {
    instagram: author[0].inst_link,
    tikTok: author[0].tik_tok_link,
    youTube: author[0].you_tube_link,
    facebook: author[0].facebook_link,
    telegram: author[0].telegram_link,
    id: author[0].id,
    image: imageUrl || '',
    name: author[0].name,
    recipesCount: author[0].recipes_count,
    subscribers: author[0].subscribers,
    views: author[0].views,
    email: author[0].contact_email,
    error: null
  }
}