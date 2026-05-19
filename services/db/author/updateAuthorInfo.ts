import {supabase} from "@/lib/supabase/ClientComponentClient";
import {AuthorInfoForm} from "@/app/[locale]/admin/author/page";
import {uploadImage} from "@/services/storage/uploadImagetoStorage";
import {deleteFile} from "@/services/storage/deleteImageFromStorage";
import {AuthorInfo} from "@/services/db/author/fetchAuthorInfo";
import {v4 as uuidv4} from "uuid";

const AUTHOR_BUCKET = 'author';

export const updateAuthorInfo = async (
  id: string,
  data: AuthorInfoForm,
  currentImageUrl: string
): Promise<AuthorInfo> => {
  let imageUrl = currentImageUrl;

  if (data.imageFile) {
    if (currentImageUrl) {
      await deleteFile(currentImageUrl, AUTHOR_BUCKET);
    }

    const filePath = `author-${uuidv4()}`;
    const {imageUrl: newImageUrl, error: uploadError} = await uploadImage({
      file: data.imageFile,
      bucket: AUTHOR_BUCKET,
      filePath: filePath
    });

    if (uploadError) {
      throw new Error('Failed to upload image');
    }

    imageUrl = newImageUrl;
  }

  const {data: updatedAuthor, error} = await supabase
    .from('author')
    .update({
      contact_email: data.email,
      facebook_link: data.facebook,
      image: imageUrl,
      inst_link: data.instagram,
      recipes_count: data.recipesCount,
      subscribers: data.subscribers,
      telegram_link: data.telegram,
      tik_tok_link: data.tikTok,
      views: data.views,
      you_tube_link: data.youTube,
      name: data.name
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !updatedAuthor) {
    throw new Error(error?.message || 'Failed to update author');
  }

  return {
    instagram: updatedAuthor.inst_link,
    tikTok: updatedAuthor.tik_tok_link,
    youTube: updatedAuthor.you_tube_link,
    facebook: updatedAuthor.facebook_link,
    telegram: updatedAuthor.telegram_link,
    id: updatedAuthor.id,
    image: updatedAuthor.image,
    name: updatedAuthor.name,
    recipesCount: updatedAuthor.recipes_count,
    subscribers: updatedAuthor.subscribers,
    views: updatedAuthor.views,
    email: updatedAuthor.contact_email,
    error: null
  };
};