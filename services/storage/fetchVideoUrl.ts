export const fetchVideoUrl = async (videoUrl: string, recipeId: string): Promise<string> => {
  const response = await fetch('/api/video/view-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl, recipeId }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to load video');
  }

  const { viewUrl } = await response.json();

  return viewUrl;
}