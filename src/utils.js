/**
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {HTMLMediaElement} media
 * @returns {boolean}
 */
export function isMp3Media(media) {
  /** @param {string} value */
  const looksLikeMp3 = (value) => {
    if (!value) return false;
    const lower = value.toLowerCase();
    if (lower.includes('.mp3')) return true;
    try {
      const url = new URL(value, window.location.href);
      return url.pathname.toLowerCase().endsWith('.mp3');
    } catch {
      return false;
    }
  };

  if (looksLikeMp3(media.currentSrc) || looksLikeMp3(media.src)) {
    return true;
  }

  const sources = media.querySelectorAll('source');
  for (const source of sources) {
    if (!(source instanceof HTMLSourceElement)) continue;
    const type = (source.type || '').toLowerCase();
    if (type === 'audio/mpeg' || type === 'audio/mp3') return true;
    if (looksLikeMp3(source.src)) return true;
  }

  return false;
}

/**
 * @param {HTMLMediaElement} media
 * @returns {boolean}
 */
export function isSupportedMedia(media) {
  return (
    (media instanceof HTMLAudioElement || media instanceof HTMLVideoElement) &&
    isMp3Media(media)
  );
}
