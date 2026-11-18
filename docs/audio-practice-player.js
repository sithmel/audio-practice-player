/**
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
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
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {HTMLMediaElement} media
 * @returns {boolean}
 */
function isMp3Media(media) {
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
function isSupportedMedia(media) {
  return (
    (media instanceof HTMLAudioElement || media instanceof HTMLVideoElement) &&
    isMp3Media(media)
  );
}

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
function createIcon(name) {
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

const STYLE_ID = 'audio-practice-player-styles';
const WRAPPER_CLASS = 'app-audio-practice-player';
const INITIALIZED_ATTR = 'data-audio-practice-player-initialized';
const MIN_SPEED = 0.5;
const MAX_SPEED = 2;
const SPEED_STEP = 0.1;

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
  padding: 0.6rem;
  border: 1px solid #d3d3d3;
  border-radius: 8px;
  background: #f7f7f8;
}
.${WRAPPER_CLASS} .app-transport {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.${WRAPPER_CLASS} .app-transport-left,
.${WRAPPER_CLASS} .app-transport-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.${WRAPPER_CLASS} .app-transport-right {
  margin-left: auto;
}
.${WRAPPER_CLASS} button {
  cursor: pointer;
  border: 1px solid #999;
  border-radius: 4px;
  background: #fff;
  padding: 0.2rem 0.5rem;
  line-height: 1.2;
  font: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}
.${WRAPPER_CLASS} button:hover {
  background: #f0f0f0;
}
.${WRAPPER_CLASS} .app-icon {
  width: 1em;
  height: 1em;
  flex: none;
  fill: currentColor;
}
.${WRAPPER_CLASS} .app-speed-btn-label {
  font-variant-numeric: tabular-nums;
}
.${WRAPPER_CLASS} .app-toggle[aria-pressed="true"] {
  background: #d7ebff;
  border-color: #2b78c5;
  box-shadow: inset 0 0 0 1px #2b78c5;
  font-weight: 600;
}
.${WRAPPER_CLASS} .app-popover-control {
  position: relative;
}
.${WRAPPER_CLASS} .app-popover {
  position: absolute;
  bottom: calc(100% + 0.4rem);
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.4rem;
  background: #fff;
  border: 1px solid #c8c8c8;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 10;
}
.${WRAPPER_CLASS} .app-popover[hidden] {
  display: none;
}
.${WRAPPER_CLASS} .app-popover-value {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.${WRAPPER_CLASS} .app-vertical-slider {
  writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
  appearance: slider-vertical;
  width: 1.5rem;
  height: 7rem;
  padding: 0;
  margin: 0;
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
.${WRAPPER_CLASS} .app-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-variant-numeric: tabular-nums;
}
.${WRAPPER_CLASS} .app-time-end {
  text-align: right;
}
`;
  document.head.appendChild(style);
}

/**
 * @param {HTMLMediaElement} media
 * @returns {PlayerInstance | null}
 */
function createPlayerForMedia(media) {
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
  transport.className = 'app-transport';

  const transportLeft = document.createElement('div');
  transportLeft.className = 'app-transport-left';

  const transportRight = document.createElement('div');
  transportRight.className = 'app-transport-right';

  const playPauseBtn = document.createElement('button');
  playPauseBtn.type = 'button';
  playPauseBtn.className = 'app-play-pause';
  playPauseBtn.append(createIcon('play'));
  playPauseBtn.setAttribute('aria-label', 'Play');
  playPauseBtn.title = 'Play';

  const repeatBtn = document.createElement('button');
  repeatBtn.type = 'button';
  repeatBtn.className = 'app-toggle';
  repeatBtn.append(createIcon('repeat'));
  repeatBtn.setAttribute('aria-pressed', 'false');
  repeatBtn.setAttribute('aria-label', 'Repeat: off');
  repeatBtn.title = 'Repeat: off';

  transportLeft.append(playPauseBtn, repeatBtn);

  // Speed control (popover with vertical slider)
  const speedControl = document.createElement('div');
  speedControl.className = 'app-popover-control app-speed-control';

  const speedBtn = document.createElement('button');
  speedBtn.type = 'button';
  speedBtn.className = 'app-speed-btn';
  speedBtn.setAttribute('aria-label', 'Playback speed');
  speedBtn.setAttribute('aria-expanded', 'false');
  speedBtn.title = 'Playback speed';

  const speedBtnLabel = document.createElement('span');
  speedBtnLabel.className = 'app-speed-btn-label';
  speedBtn.append(createIcon('speed'), speedBtnLabel);

  const speedPopover = document.createElement('div');
  speedPopover.className = 'app-popover app-speed-popover';
  speedPopover.hidden = true;

  const speedValue = document.createElement('div');
  speedValue.className = 'app-popover-value app-speed-value';

  const speedSlider = document.createElement('input');
  speedSlider.type = 'range';
  speedSlider.className = 'app-vertical-slider app-speed-slider';
  speedSlider.min = String(MIN_SPEED);
  speedSlider.max = String(MAX_SPEED);
  speedSlider.step = String(SPEED_STEP);
  speedSlider.value = '1';
  speedSlider.setAttribute('orient', 'vertical');
  speedSlider.setAttribute('aria-label', 'Playback speed');

  speedPopover.append(speedValue, speedSlider);
  speedControl.append(speedBtn, speedPopover);

  // Volume control (popover with vertical slider, no mute toggle)
  const volumeControl = document.createElement('div');
  volumeControl.className = 'app-popover-control app-volume-control';

  const volumeBtn = document.createElement('button');
  volumeBtn.type = 'button';
  volumeBtn.className = 'app-volume-btn';
  volumeBtn.append(createIcon('volume'));
  volumeBtn.setAttribute('aria-label', 'Volume');
  volumeBtn.setAttribute('aria-expanded', 'false');
  volumeBtn.title = 'Volume';

  const volumePopover = document.createElement('div');
  volumePopover.className = 'app-popover app-volume-popover';
  volumePopover.hidden = true;

  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.className = 'app-vertical-slider app-volume-slider';
  volumeSlider.min = '0';
  volumeSlider.max = '1';
  volumeSlider.step = '0.01';
  volumeSlider.setAttribute('orient', 'vertical');
  volumeSlider.setAttribute('aria-label', 'Volume');

  volumePopover.append(volumeSlider);
  volumeControl.append(volumeBtn, volumePopover);

  transportRight.append(speedControl, volumeControl);
  transport.append(transportLeft, transportRight);

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
  timeRow.className = 'app-time-row';

  const timeCurrent = document.createElement('span');
  timeCurrent.className = 'app-time-current';

  const timeEnd = document.createElement('span');
  timeEnd.className = 'app-time-end';

  timeRow.append(timeCurrent, timeEnd);

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
  function syncSpeedUI() {
    const percent = Math.round(state.rate * 100);
    const text = `${percent}%`;
    speedSlider.value = String(state.rate);
    speedValue.textContent = text;
    speedBtnLabel.textContent = text;
    speedBtn.setAttribute('aria-label', `Playback speed: ${text}`);
    speedBtn.title = `Playback speed: ${text}`;
  }

  /** @param {'play'|'pause'} name @returns {void} */
  function setPlayPauseIcon(name) {
    const icon = playPauseBtn.querySelector('svg');
    if (icon?.getAttribute('data-icon') === name) return;
    playPauseBtn.replaceChildren(createIcon(name));
  }

  /** @returns {void} */
  function syncVolumeUI() {
    const v = clamp(Number.isFinite(media.volume) ? media.volume : 1, 0, 1);
    volumeSlider.value = String(v);
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
    markerA.label.textContent = `(${formatTime(state.a)})`;
    markerB.label.textContent = `(${formatTime(state.b)})`;
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

    timeCurrent.textContent = formatTime(current);
    timeEnd.textContent = `(${formatTime(state.b)}) ${formatTime(d)}`;

    const paused = media.paused;
    setPlayPauseIcon(paused ? 'play' : 'pause');
    const playPauseLabel = paused ? 'Play' : 'Pause';
    playPauseBtn.setAttribute('aria-label', playPauseLabel);
    playPauseBtn.title = playPauseLabel;

    const repeatLabel = state.repeat ? 'Repeat: on' : 'Repeat: off';
    repeatBtn.setAttribute('aria-pressed', state.repeat ? 'true' : 'false');
    repeatBtn.setAttribute('aria-label', repeatLabel);
    repeatBtn.title = repeatLabel;

    syncSpeedUI();
    syncVolumeUI();
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

  /** @param {'speed'|'volume'|null} which */
  function setPopoverOpen(which) {
    const speedOpen = which === 'speed';
    const volumeOpen = which === 'volume';
    speedPopover.hidden = !speedOpen;
    volumePopover.hidden = !volumeOpen;
    speedBtn.setAttribute('aria-expanded', speedOpen ? 'true' : 'false');
    volumeBtn.setAttribute('aria-expanded', volumeOpen ? 'true' : 'false');
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

  function onPlayPauseClick() {
    if (state.duration <= 0) return;
    if (media.paused) {
      enforceRangeOnPlay();
      const p = media.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      media.pause();
    }
  }

  function onRepeatClick() {
    state.repeat = !state.repeat;
    updateUI();
  }

  /** @param {MouseEvent} e */
  function onSpeedBtnClick(e) {
    e.stopPropagation();
    const open = !speedPopover.hidden;
    setPopoverOpen(open ? null : 'speed');
  }

  /** @param {MouseEvent} e */
  function onVolumeBtnClick(e) {
    e.stopPropagation();
    const open = !volumePopover.hidden;
    setPopoverOpen(open ? null : 'volume');
  }

  function onSpeedSliderInput() {
    const value = Number(speedSlider.value);
    if (!Number.isFinite(value)) return;
    state.rate = Math.round(clamp(value, MIN_SPEED, MAX_SPEED) * 10) / 10;
    media.playbackRate = state.rate;
    syncSpeedUI();
  }

  function onVolumeSliderInput() {
    const value = Number(volumeSlider.value);
    if (!Number.isFinite(value)) return;
    media.volume = clamp(value, 0, 1);
  }

  function onVolumeChange() {
    syncVolumeUI();
  }

  /** @param {MouseEvent} e */
  function onDocumentClick(e) {
    const target = e.target;
    if (!(target instanceof Node)) {
      setPopoverOpen(null);
      return;
    }
    if (!speedControl.contains(target) && !volumeControl.contains(target)) {
      setPopoverOpen(null);
    } else if (!speedControl.contains(target)) {
      speedPopover.hidden = true;
      speedBtn.setAttribute('aria-expanded', 'false');
    } else if (!volumeControl.contains(target)) {
      volumePopover.hidden = true;
      volumeBtn.setAttribute('aria-expanded', 'false');
    }
  }

  /** @param {KeyboardEvent} e */
  function onDocumentKeydown(e) {
    if (e.key === 'Escape') {
      setPopoverOpen(null);
    }
  }

  playPauseBtn.addEventListener('click', onPlayPauseClick);
  repeatBtn.addEventListener('click', onRepeatClick);
  speedBtn.addEventListener('click', onSpeedBtnClick);
  volumeBtn.addEventListener('click', onVolumeBtnClick);
  speedSlider.addEventListener('input', onSpeedSliderInput);
  volumeSlider.addEventListener('input', onVolumeSliderInput);
  progress.addEventListener('input', onProgressInput);
  markerA.marker.addEventListener('pointerdown', (e) => onMarkerPointerDown(e, 'a'));
  markerB.marker.addEventListener('pointerdown', (e) => onMarkerPointerDown(e, 'b'));
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);
  media.addEventListener('loadedmetadata', onLoadedMetadata);
  media.addEventListener('durationchange', onLoadedMetadata);
  media.addEventListener('timeupdate', onTimeUpdate);
  media.addEventListener('play', onPlay);
  media.addEventListener('pause', updateUI);
  media.addEventListener('ended', handleRangeEnd);
  media.addEventListener('volumechange', onVolumeChange);

  // initialize if metadata already available
  if (media.readyState >= 1 && Number.isFinite(media.duration)) {
    onLoadedMetadata();
  } else {
    syncProgressMax();
  }
  media.playbackRate = state.rate;
  syncVolumeUI();
  updateUI();

  function destroy() {
    playPauseBtn.removeEventListener('click', onPlayPauseClick);
    repeatBtn.removeEventListener('click', onRepeatClick);
    speedBtn.removeEventListener('click', onSpeedBtnClick);
    volumeBtn.removeEventListener('click', onVolumeBtnClick);
    speedSlider.removeEventListener('input', onSpeedSliderInput);
    volumeSlider.removeEventListener('input', onVolumeSliderInput);
    progress.removeEventListener('input', onProgressInput);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeydown);
    media.removeEventListener('loadedmetadata', onLoadedMetadata);
    media.removeEventListener('durationchange', onLoadedMetadata);
    media.removeEventListener('timeupdate', onTimeUpdate);
    media.removeEventListener('play', onPlay);
    media.removeEventListener('pause', updateUI);
    media.removeEventListener('ended', handleRangeEnd);
    media.removeEventListener('volumechange', onVolumeChange);
  }

  return { media, root, destroy };
}

/**
 * @param {HTMLMediaElement} media
 * @returns {boolean}
 */
function isInitialized(media) {
  return media.getAttribute(INITIALIZED_ATTR) === 'true';
}

/**
 * @param {Element} el
 * @returns {void}
 */
function initMediaElement(el) {
  if (!(el instanceof HTMLAudioElement || el instanceof HTMLVideoElement)) return;
  if (isInitialized(el)) return;
  if (!isSupportedMedia(el)) return;
  createPlayerForMedia(el);
}

/**
 * @param {ParentNode} [root]
 * @returns {void}
 */
function init(root = document) {
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
function observe(root = document.body || document.documentElement) {
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
function start() {
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

export { init, initMediaElement, observe, start };
//# sourceMappingURL=audio-practice-player.js.map
