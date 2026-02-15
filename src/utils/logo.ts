/**
 * Logo fetch/cache utilities for document headers.
 */

let _arrayBufferCache: ArrayBuffer | null = null;
let _base64Cache: string | null = null;

export async function fetchLogoAsArrayBuffer(): Promise<ArrayBuffer> {
  if (_arrayBufferCache) return _arrayBufferCache;
  const res = await fetch('/logo-192.png');
  _arrayBufferCache = await res.arrayBuffer();
  return _arrayBufferCache;
}

export async function fetchLogoAsBase64(): Promise<string> {
  if (_base64Cache) return _base64Cache;
  const buffer = await fetchLogoAsArrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  _base64Cache = `data:image/png;base64,${btoa(binary)}`;
  return _base64Cache;
}
