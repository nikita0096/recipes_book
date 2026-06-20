import {supabase} from "@/lib/supabase/ClientComponentClient";
import {AuthorInfoForm} from "@/app/[locale]/admin/author/page";
import {uploadImage} from "@/services/storage/uploadImagetoStorage";
import {deleteFileByPath} from "@/services/storage/deleteImageFromStorage";
import {AuthorInfo, mapAuthorRow} from "@/services/db/author/fetchAuthorInfo";
import {v4 as uuidv4} from "uuid";

const AUTHOR_BUCKET = 'author';

// Hero words are stored as an array; normalize free-text input into clean,
// space-separated tokens (collapses extra whitespace, drops empties).
const toWords = (value: string): string[] => value.trim().split(/\s+/).filter(Boolean);

export const updateAuthorInfo = async (
  id: string,
  data: AuthorInfoForm,
  currentImagePath: string
): Promise<AuthorInfo> => {
  let imagePath = currentImagePath;

  if (data.imageFile) {
    if (currentImagePath) {
      await deleteFileByPath(currentImagePath, AUTHOR_BUCKET);
    }

    const filePath = `author-${uuidv4()}`;
    const {imagePath: newImagePath, error: uploadError} = await uploadImage({
      file: data.imageFile,
      bucket: AUTHOR_BUCKET,
      filePath: filePath
    });

    if (uploadError) {
      throw new Error('Failed to upload image');
    }

    imagePath = newImagePath;
  }

  const {data: updatedAuthor, error} = await supabase
    .from('author')
    .update({
      contact_email: data.email,
      facebook_link: data.facebook,
      image: imagePath,
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
      }
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !updatedAuthor) {
    throw new Error(error?.message || 'Failed to update author');
  }

  return {data: mapAuthorRow(updatedAuthor), error: null};
};