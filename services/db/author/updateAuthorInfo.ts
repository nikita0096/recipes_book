import {supabase} from "@/lib/supabase/ClientComponentClient";
import {AuthorInfoForm} from "@/app/[locale]/admin/author/page";
import {uploadImage} from "@/services/storage/uploadImagetoStorage";
import {deleteFileByPath} from "@/services/storage/deleteImageFromStorage";
import {AuthorInfo} from "@/services/db/author/fetchAuthorInfo";
import {v4 as uuidv4} from "uuid";
import {getPublicImageUrl} from "@/services/storage/getPublicImageUrl";

const AUTHOR_BUCKET = 'author';

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
      name: data.name
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !updatedAuthor) {
    throw new Error(error?.message || 'Failed to update author');
  }

  const imageUrl = getPublicImageUrl(updatedAuthor.image, 'author');

  return {
    instagram: updatedAuthor.inst_link,
    tikTok: updatedAuthor.tik_tok_link,
    youTube: updatedAuthor.you_tube_link,
    facebook: updatedAuthor.facebook_link,
    telegram: updatedAuthor.telegram_link,
    id: updatedAuthor.id,
    image: imageUrl || '',
    name: updatedAuthor.name,
    recipesCount: updatedAuthor.recipes_count,
    subscribers: updatedAuthor.subscribers,
    views: updatedAuthor.views,
    email: updatedAuthor.contact_email,
    error: null
  };
};