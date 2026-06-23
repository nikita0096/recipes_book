import type {AuthorInfoForm} from "@/app/[locale]/admin/author/page";
import {AuthorInfo} from "@/services/db/author/fetchAuthorInfo";
import {UpdateAuthorPayload} from "@/services/db/author/updateAuthorInfo";
import {uploadImage} from "@/services/storage/uploadImagetoStorage";
import {deleteFileByPath} from "@/services/storage/deleteImageFromStorage";
import {v4 as uuidv4} from "uuid";

const AUTHOR_BUCKET = 'author';

/**
 * Client wrapper that updates the author. The image upload (browser image
 * compression) and old-image cleanup happen client-side; the resolved path and
 * remaining fields are then persisted through the admin API route. Same return
 * shape as the previous direct call, so call sites only change their import.
 */
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

  // imageFile is uploaded above; strip it from the JSON payload.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {imageFile, ...rest} = data;
  const payload: UpdateAuthorPayload = {...rest, image: imagePath};

  const res = await fetch(`/api/admin/author/${id}`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update author');
  }

  return res.json();
};
