export  const deleteVideo = async (videoKey: string): Promise<void> => {
  await fetch('/api/video/delete', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      videoKey: videoKey
    })
  });
}