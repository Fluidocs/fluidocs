self.addEventListener('message', async (event) => {
  const { files } = event.data as { files: File[] };

  try {
    const hashes: Record<string, string> = {};
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      const hash = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      hashes[file.name] = hash;
    }

    self.postMessage({ hashes });
  } catch (error) {
    self.postMessage({ error: (error as Error).message || 'Erro ao processar arquivos.' });
  }
});
