import {supabase} from "@/lib/supabase/ClientComponentClient";

interface AuthorInfoFetchResponse {
  contact_email: string;
  created_at: string;
  facebook_link: string;
  id: string;
  image: string;
  inst_link: string;
  recipes_count: number;
  subscribers: number;
  telegram_link: string;
  tik_tok_link: string;
  views: number;
  you_tube_link: string;
  name: string;
}

export interface AuthorInfo {
  links: {
    instagram: string;
    tikTok: string;
    youTube: string;
    facebook: string;
    telegram: string;
  };
  id: string;
  image: string;
  name: string;
  recipesCount: number;
  subscribers: number;
  views: number;
  error: Error | null
}

export const fetchAuthorInfo = async (): Promise<AuthorInfo> => {
  const { data: author, error } = await supabase
    .from('author')
    .select('*');

  if (error || !author) {
    return {
      links: {
        instagram: '#',
        tikTok: '#',
        youTube: '#',
        facebook: '#',
        telegram: '#'
      },
      id: '',
      image: '',
      name: 'Yuliia',
      recipesCount: 1000,
      subscribers: 1.1,
      views: 50,
      error: error
    }
  }

  return {
    links: {
      instagram: author[0].inst_link,
      tikTok: author[0].tik_tok_link,
      youTube: author[0].you_tube_link,
      facebook: author[0].facebook_link,
      telegram: author[0].telegram_link
    },
    id: author[0].id,
    image: author[0].image,
    name: author[0].name,
    recipesCount: author[0].recipes_count,
    subscribers: author[0].subscribers,
    views: author[0].views,
    error: null
  }
}