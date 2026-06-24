/**
 * Client wrapper that deletes a recipe through the admin API route.
 * Keeps the same `{ error }` shape the previous direct Supabase call returned,
 * so call sites only change their import.
 */
export const deleteRecipe = async ({
  id,
  videoKey,
}: {
  id: string;
  videoKey: string | null;
}): Promise<{ error: string | null }> => {
  try {
    const res = await fetch(`/api/admin/recipes/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ videoKey }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error || 'Failed to delete recipe' };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to delete recipe',
    };
  }
};
