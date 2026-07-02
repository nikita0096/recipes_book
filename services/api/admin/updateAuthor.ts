import type {AuthorInfoForm} from "@/app/[locale]/admin/author/page";
import {AuthorInfo} from "@/services/db/author/fetchAuthorInfo";
import {UpdateAuthorPayload} from "@/services/db/author/updateAuthorInfo";
import {deleteFileByPath} from "@/services/storage/deleteImageFromStorage";
import {v4 as uuidv4} from "uuid";
import {uploadImageServer} from "@/services/api/admin/uploadImageServer";

const AUTHOR_BUCKET = 'author';

/**
 * Client wrapper that updates the author. The new image is sent to the upload
 * API route (which compresses via sharp and stores it), the old image is cleaned
 * up, and the resolved path plus remaining fields are persisted through the admin
 * API route. Same return shape as the previous direct call, so call sites only
 * change their import.
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
    const {imagePath: newImagePath, error: uploadError} = await uploadImageServer(data.imageFile, AUTHOR_BUCKET, filePath);

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
