/**
 * Shared download + filename utilities for document exports.
 */

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function makeFileName(
  type: string,
  context: string,
  ext: string
): string {
  const slug = context.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') || type;
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `${type}-${slug}-${ts}.${ext}`;
}
