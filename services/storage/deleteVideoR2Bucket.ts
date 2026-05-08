type DeleteVideoResponse = {
  success?: boolean;
  error?: string;
};

export const deleteVideo = async (videoKey: string): Promise<DeleteVideoResponse> => {
  const res = await fetch('/api/video/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ videoKey }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Delete video failed:', data);
    return { error: data.error || 'Failed to delete video' };
  }

  return { success: true };
}