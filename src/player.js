import { clamp, formatTime } from './utils.js';

const STYLE_ID = 'audio-practice-player-styles';
const WRAPPER_CLASS = 'app-audio-practice-player';
const INITIALIZED_ATTR = 'data-audio-practice-player-initialized';

/**
 * @typedef {Object} PlayerInstance
 * @property {HTMLMediaElement} media
 * @property {HTMLElement} root
 * @property {() => void} destroy
 */

/**
 * @returns {void}
 */
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.${WRAPPER_CLASS} {
  display: block;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  color: #111;
  margin: 0.5rem 0;
}
.${WRAPPER_CLASS} .app-controls {
  display: grid;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f8f8f8;
}
.${WRAPPER_CLASS} .app-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.${WRAPPER_CLASS} button {
  cursor: pointer;
}
.${WRAPPER_CLASS} .app-timeline {
  position: relative;
  width: 100%;
  height: 2.25rem;
  user-select: none;
  touch-action: none;
}
.${WRAPPER_CLASS} .app-progress {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  margin: 0;
}
.${WRAPPER_CLASS} .app-range-highlight {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 6px;
  background: rgba(0, 120, 212, 0.25);
  border-radius: 3px;
  pointer-events: none;
}
.${WRAPPER_CLASS} .app-marker {
  position: absolute;
  top: 0;
  width: 16px;
  height: 100%;
  transform: translateX(-50%);
  cursor: ew-resize;
  z-index: 2;
}
.${WRAPPER_CLASS} .app-marker::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0.2rem;
  bottom: 0.2rem;
  width: 3px;
  transform: translateX(-50%);
  background: #0b5cad;
  border-radius: 2px;
}
.${WRAPPER_CLASS} .app-marker-b::before {
  background: #0a7a3d;
}
.${WRAPPER_CLASS} .app-marker-label {
  position: absolute;
  top: -1.1rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  white-space: nowrap;
  background: #fff;
  border: 1px solid #bbb;
  border-radius: 3px;
  padding: 0 0.2rem;
  pointer-events: none;
}
.${WRAPPER_CLASS} .app-time {
  min-width: 7.5rem;
  font-variant-numeric: tabular-nums;
}
.${WRAPPER_CLASS} .app-toggle[aria-pressed="true"] {
  font-weight: 600;
}
`;
  document.head.appendChild(style);
}

/**
 * @param {HTMLMediaElement} media
 * @returns {PlayerInstance | null}
 */
export function createPlayerForMedia(media) {
  if (media.getAttribute(INITIALIZED_ATTR) === 'true') {
    return null;
  }
  ensureStyles();
  media.controls = false;
  media.setAttribute(INITIALIZED_ATTR, 'true');

  const parent = media.parentElement;
  if (!parent) {
    media.removeAttribute(INITIALIZED_ATTR);
    return null;
  }

  const root = document.createElement('div');
  root.className = WRAPPER_CLASS;

  const controls = document.createElement('div');
  controls.className = 'app-controls';

  const transport = document.createElement('div');
  transport.className = 'app-row';

  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.textContent = 'Play';

  const pauseBtn = document.createElement('button');
  pauseBtn.type = 'button';
  pauseBtn.textContent = 'Pause';

  const repeatBtn = document.createElement('button');
  repeatBtn.type = 'button';
  repeatBtn.className = 'app-toggle';
  repeatBtn.textContent = 'Repeat: Off';
  repeatBtn.setAttribute('aria-pressed', 'false');

  const speedDown = document.createElement('button');
  speedDown.type = 'button';
  speedDown.textContent = '−10%';

  const speedUp = document.createElement('button');
  speedUp.type = 'button';
  speedUp.textContent = '+10%';

  const speedLabel = document.createElement('span');
  speedLabel.className = 'app-speed';

  transport.append(playBtn, pauseBtn, repeatBtn, speedDown, speedUp, speedLabel);

  const timeline = document.createElement('div');
  timeline.className = 'app-timeline';

  const progress = document.createElement('input');
  progress.type = 'range';
  progress.className = 'app-progress';
  progress.min = '0';
  progress.max = '0';
  progress.step = '0.01';
  progress.value = '0';
  progress.setAttribute('aria-label', 'Progress');

  const rangeHighlight = document.createElement('div');
  rangeHighlight.className = 'app-range-highlight';

  /** @param {'a'|'b'} which */
  const makeMarker = (which) => {
    const marker = document.createElement('div');
    marker.className = `app-marker app-marker-${which}`;
    marker.setAttribute('role', 'slider');
    marker.setAttribute('aria-label', which === 'a' ? 'Start marker' : 'End marker');
    marker.tabIndex = 0;
    const label = document.createElement('span');
    label.className = 'app-marker-label';
    marker.appendChild(label);
    return { marker, label };
  };

  const markerA = makeMarker('a');
  const markerB = makeMarker('b');

  timeline.append(progress, rangeHighlight, markerA.marker, markerB.marker);

  const timeRow = document.createElement('div');
  timeRow.className = 'app-row';
  const timeLabel = document.createElement('span');
  timeLabel.className = 'app-time';
  timeRow.appendChild(timeLabel);

  controls.append(transport, timeline, timeRow);
  root.appendChild(controls);

  parent.insertBefore(root, media);
  root.insertBefore(media, controls);
  media.style.display = 'none';

  /** @type {{a: number, b: number, repeat: boolean, rate: number, duration: number, dragging: 'a'|'b'|null}} */
  const state = {
    a: 0,
    b: 0,
    repeat: false,
    rate: 1,
    duration: 0,
    dragging: null,
  };

  /** @returns {void} */
  function updateSpeedLabel() {
    speedLabel.textContent = `${Math.round(state.rate * 100)}%`;
  }

  /** @returns {void} */
  function syncProgressMax() {
    const d = Number.isFinite(media.duration) ? media.duration : 0;
    state.duration = d;
    progress.max = String(d || 0);
    if (d > 0) {
      if (state.b === 0 || state.b > d) state.b = d;
      state.a = clamp(state.a, 0, d);
      state.b = clamp(state.b, 0, d);
      if (state.a > state.b) state.a = state.b;
    } else {
      state.a = 0;
      state.b = 0;
    }
  }

  /** @returns {void} */
  function updateUI() {
    const d = state.duration || 0;
    const current = Number.isFinite(media.currentTime) ? media.currentTime : 0;
    progress.value = String(clamp(current, 0, d || 0));
    progress.disabled = d <= 0;

    const aPct = d > 0 ? (state.a / d) * 100 : 0;
    const bPct = d > 0 ? (state.b / d) * 100 : 0;
    markerA.marker.style.left = `${aPct}%`;
    markerB.marker.style.left = `${bPct}%`;
    markerA.label.textContent = formatTime(state.a);
    markerB.label.textContent = formatTime(state.b);
    markerA.marker.setAttribute('aria-valuemin', '0');
    markerA.marker.setAttribute('aria-valuemax', String(d));
    markerA.marker.setAttribute('aria-valuenow', String(state.a));
    markerA.marker.setAttribute('aria-valuetext', formatTime(state.a));
    markerB.marker.setAttribute('aria-valuemin', '0');
    markerB.marker.setAttribute('aria-valuemax', String(d));
    markerB.marker.setAttribute('aria-valuenow', String(state.b));
    markerB.marker.setAttribute('aria-valuetext', formatTime(state.b));

    const left = Math.min(aPct, bPct);
    const width = Math.abs(bPct - aPct);
    rangeHighlight.style.left = `${left}%`;
    rangeHighlight.style.width = `${width}%`;

    timeLabel.textContent = `${formatTime(current)} / ${formatTime(d)}  (A ${formatTime(state.a)} – B ${formatTime(state.b)})`;
    updateSpeedLabel();
    repeatBtn.textContent = `Repeat: ${state.repeat ? 'On' : 'Off'}`;
    repeatBtn.setAttribute('aria-pressed', state.repeat ? 'true' : 'false');
  }

  /** @param {number} time */
  function seek(time) {
    if (!Number.isFinite(state.duration) || state.duration <= 0) return;
    media.currentTime = clamp(time, 0, state.duration);
    updateUI();
  }

  /** @returns {void} */
  function enforceRangeOnPlay() {
    const d = state.duration;
    if (d <= 0) return;
    const t = media.currentTime;
    if (t < state.a) media.currentTime = state.a;
    else if (t > state.b) media.currentTime = state.a;
  }

  /** @returns {void} */
  function handleRangeEnd() {
    if (state.duration <= 0) return;
    if (state.repeat) {
      media.currentTime = state.a;
      const p = media.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      media.pause();
      media.currentTime = state.b;
    }
    updateUI();
  }

  /** @param {PointerEvent} e @param {'a'|'b'} which */
  function onMarkerPointerDown(e, which) {
    if (state.duration <= 0) return;
    state.dragging = which;
    const target = e.currentTarget;
    if (target instanceof HTMLElement) target.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  /** @param {PointerEvent} e */
  function onPointerMove(e) {
    if (!state.dragging || state.duration <= 0) return;
    const rect = timeline.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const time = ratio * state.duration;
    const minGap = Math.min(0.1, state.duration);
    if (state.dragging === 'a') {
      state.a = Math.min(time, state.b - minGap);
      state.a = clamp(state.a, 0, Math.max(0, state.b - minGap));
    } else {
      state.b = Math.max(time, state.a + minGap);
      state.b = clamp(state.b, Math.min(state.duration, state.a + minGap), state.duration);
    }
    // if duration very small ensure valid
    if (state.a > state.b) {
      if (state.dragging === 'a') state.a = state.b; else state.b = state.a;
    }
    if (media.currentTime < state.a) media.currentTime = state.a;
    if (media.currentTime > state.b) media.currentTime = state.b;
    updateUI();
  }

  /** @param {PointerEvent} e */
  function onPointerUp(e) {
    if (!state.dragging) return;
    const which = state.dragging;
    state.dragging = null;
    const marker = which === 'a' ? markerA.marker : markerB.marker;
    if (marker.hasPointerCapture(e.pointerId)) marker.releasePointerCapture(e.pointerId);
  }

  function onLoadedMetadata() {
    const wasUninitialized = state.duration === 0;
    syncProgressMax();
    if (wasUninitialized && Number.isFinite(media.duration)) {
      state.a = 0;
      state.b = media.duration;
    }
    updateUI();
  }

  function onTimeUpdate() {
    if (state.duration <= 0) syncProgressMax();
    const t = media.currentTime;
    if (!media.paused && state.duration > 0) {
      if (t < state.a) {
        media.currentTime = state.a;
      } else if (t >= state.b) {
        handleRangeEnd();
        return;
      }
    }
    updateUI();
  }

  function onPlay() {
    enforceRangeOnPlay();
    updateUI();
  }

  function onProgressInput() {
    const value = Number(progress.value);
    if (!Number.isFinite(value)) return;
    // Full-track scrub: allow seeking anywhere; playback enforcement happens on play/timeupdate
    seek(value);
  }

  function onPlayClick() {
    if (state.duration <= 0) return;
    enforceRangeOnPlay();
    const p = media.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  function onPauseClick() {
    media.pause();
  }

  function onRepeatClick() {
    state.repeat = !state.repeat;
    updateUI();
  }

  /** @param {number} delta */
  function changeRate(delta) {
    state.rate = Math.round(clamp(state.rate + delta, 0.1, 2.0) * 10) / 10;
    media.playbackRate = state.rate;
    updateUI();
  }

  playBtn.addEventListener('click', onPlayClick);
  pauseBtn.addEventListener('click', onPauseClick);
  repeatBtn.addEventListener('click', onRepeatClick);
  speedDown.addEventListener('click', () => changeRate(-0.1));
  speedUp.addEventListener('click', () => changeRate(0.1));
  progress.addEventListener('input', onProgressInput);
  markerA.marker.addEventListener('pointerdown', (e) => onMarkerPointerDown(e, 'a'));
  markerB.marker.addEventListener('pointerdown', (e) => onMarkerPointerDown(e, 'b'));
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  media.addEventListener('loadedmetadata', onLoadedMetadata);
  media.addEventListener('durationchange', onLoadedMetadata);
  media.addEventListener('timeupdate', onTimeUpdate);
  media.addEventListener('play', onPlay);
  media.addEventListener('pause', updateUI);
  media.addEventListener('ended', handleRangeEnd);

  // initialize if metadata already available
  if (media.readyState >= 1 && Number.isFinite(media.duration)) {
    onLoadedMetadata();
  } else {
    syncProgressMax();
  }
  media.playbackRate = state.rate;
  updateUI();

  function destroy() {
    playBtn.removeEventListener('click', onPlayClick);
    pauseBtn.removeEventListener('click', onPauseClick);
    repeatBtn.removeEventListener('click', onRepeatClick);
    progress.removeEventListener('input', onProgressInput);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    media.removeEventListener('loadedmetadata', onLoadedMetadata);
    media.removeEventListener('durationchange', onLoadedMetadata);
    media.removeEventListener('timeupdate', onTimeUpdate);
    media.removeEventListener('play', onPlay);
    media.removeEventListener('pause', updateUI);
    media.removeEventListener('ended', handleRangeEnd);
  }

  return { media, root, destroy };
}

/**
 * @param {HTMLMediaElement} media
 * @returns {boolean}
 */
export function isInitialized(media) {
  return media.getAttribute(INITIALIZED_ATTR) === 'true';
}
