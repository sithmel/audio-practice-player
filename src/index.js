import { isSupportedMedia } from './utils.js';
import { createPlayerForMedia, isInitialized } from './player.js';

/**
 * @param {Element} el
 * @returns {void}
 */
export function initMediaElement(el) {
  if (!(el instanceof HTMLAudioElement || el instanceof HTMLVideoElement)) return;
  if (isInitialized(el)) return;
  if (!isSupportedMedia(el)) return;
  createPlayerForMedia(el);
}

/**
 * @param {ParentNode} [root]
 * @returns {void}
 */
export function init(root = document) {
  const elements = root.querySelectorAll('audio, video');
  for (const el of elements) {
    initMediaElement(el);
  }
}

/**
 * @param {Node} node
 * @returns {void}
 */
function scanNode(node) {
  if (node instanceof HTMLAudioElement || node instanceof HTMLVideoElement) {
    initMediaElement(node);
  }
  if (node instanceof Element || node instanceof Document || node instanceof DocumentFragment) {
    const elements = /** @type {ParentNode} */ (node).querySelectorAll?.('audio, video');
    if (!elements) return;
    for (const el of elements) {
      initMediaElement(el);
    }
  }
}

/**
 * @param {Node} [root]
 * @returns {MutationObserver | null}
 */
export function observe(root = document.body || document.documentElement) {
  if (!root || typeof MutationObserver === 'undefined') return null;
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        scanNode(node);
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  return observer;
}

/**
 * @returns {void}
 */
export function start() {
  init(document);
  if (document.body) {
    observe(document.body);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      init(document);
      observe(document.body || document.documentElement);
    }, { once: true });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => start(), { once: true });
  } else {
    start();
  }
}
