/**
 * Normalizes media paths (images & videos) so they always resolve as absolute root paths (e.g. /videos/..., /images/...)
 * regardless of current React Router location (e.g. /training/fragen).
 */
export const getMediaUrl = (url) => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }

  // Remove leading relative markers like ./ or / or folder prefixes like training/ or fragen/
  let clean = url.replace(/^\.?\//, '');
  if (clean.startsWith('training/')) {
    clean = clean.replace(/^training\//, '');
  }
  if (clean.startsWith('fragen/')) {
    clean = clean.replace(/^fragen\//, '');
  }

  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  return clean;
};
