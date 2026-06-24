import {createClient} from "@/lib/supabase/ServerComponentClient";

// Publish or unpublish a recipe. Server-only: uses a request-scoped Supabase
// client so RLS still enforces admin-only access.
export const togglePublishStatus = async (
  id: string,
  isPublished: boolean,
): Promise<{ id: string; isPublished: boolean }> => {
  const supabase = await createClient();
  const {data, error} = await supabase
    .from("recipes")
    .update({is_published: isPublished})
    .eq("id", id)
    .select("id, is_published")
    .single();

  if (error) throw error;

  return {id: data.id, isPublished: data.is_published};
};