import {supabase} from "@/lib/supabase/ClientComponentClient";

// Publish or unpublish a recipe.
// Access is enforced by RLS: only admins are allowed to update recipes,
// so this query will fail for non-admin sessions even if called directly.
export const togglePublishStatus = async (
  id: string,
  isPublished: boolean,
): Promise<{ id: string; isPublished: boolean }> => {
  const {data, error} = await supabase
    .from("recipes")
    .update({is_published: isPublished})
    .eq("id", id)
    .select("id, is_published")
    .single();

  if (error) throw error;

  return {id: data.id, isPublished: data.is_published};
};