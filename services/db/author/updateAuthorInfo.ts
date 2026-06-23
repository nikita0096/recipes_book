import type {AuthorInfoForm} from "@/app/[locale]/admin/author/page";
import {createClient} from "@/lib/supabase/ServerComponentClient";
import {AuthorInfo, mapAuthorRow} from "@/services/db/author/fetchAuthorInfo";

// Payload sent to the server: the form fields with the image already resolved
// to a storage path client-side (upload uses browser image compression).
export type UpdateAuthorPayload = Omit<AuthorInfoForm, "imageFile">;

// Hero words are stored as an array; normalize free-text input into clean,
// space-separated tokens (collapses extra whitespace, drops empties).
const toWords = (value: string): string[] => value.trim().split(/\s+/).filter(Boolean);

// Server-only: uses a request-scoped Supabase client so RLS still enforces
// admin-only access. Image upload/deletion is handled client-side before this.
export const updateAuthorInfo = async (
  id: string,
  data: UpdateAuthorPayload
): Promise<AuthorInfo> => {
  const supabase = await createClient();

  const {data: updatedAuthor, error} = await supabase
    .from('author')
    .update({
      contact_email: data.email,
      facebook_link: data.facebook,
      image: data.image,
      inst_link: data.instagram,
      recipes_count: data.recipesCount,
      subscribers: data.subscribers,
      telegram_link: data.telegram,
      tik_tok_link: data.tikTok,
      views: data.views,
      you_tube_link: data.youTube,
      name: data.name,
      description: data.description,
      description_footer: data.descriptionFooter,
      animated_hero_words: {
        en: toWords(data.animatedHeroWords.en),
        uk: toWords(data.animatedHeroWords.uk),
      },
      hero_cake_id: data.heroCakeId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !updatedAuthor) {
    throw new Error(error?.message || 'Failed to update author');
  }

  return {data: mapAuthorRow(updatedAuthor), error: null};
};
