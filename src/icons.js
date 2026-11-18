const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @typedef {'play'|'pause'|'repeat'|'speed'|'volume'} IconName
 */

/** @type {Record<IconName, string>} */
const ICON_PATHS = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
  repeat:
    'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
  speed:
    'M20.38 8.57l-1.23 1.85a8 8 0 01-.22 9.58H5.07A8 8 0 0115.58 6.85l1.85-1.23A10 10 0 003.35 19a2 2 0 002 2h13.3a2 2 0 002-2 10 10 0 00-.27-10.43zM13 3a1 1 0 00-2 0v6.5l-2.29 2.29a1 1 0 101.42 1.42l3-3a1 1 0 00.29-.71V3z',
  volume:
    'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
};

/**
 * @param {IconName} name
 * @returns {SVGSVGElement}
 */
export function createIcon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'app-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('data-icon', name);

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', ICON_PATHS[name]);
  path.setAttribute('fill', 'currentColor');
  svg.appendChild(path);

  return svg;
}
