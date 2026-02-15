const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const TIMEOUT_MS = 8000;

export async function checkConnection(url: string): Promise<boolean> {
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `${CORS_PROXY}${encodeURIComponent(fullUrl)}`,
      { signal: controller.signal }
    );
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
