/**
 * Client wrapper that publishes/unpublishes a recipe through the admin API
 * route. Same return shape as the previous direct Supabase call so call sites
 * only change their import.
 */
export const togglePublishStatus = async (
  id: string,
  isPublished: boolean
): Promise<{ id: string; isPublished: boolean }> => {
  const res = await fetch(`/api/admin/recipes/${id}/publish`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ isPublished }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update publish status");
  }

  return res.json();
};
