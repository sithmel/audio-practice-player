import { expect } from '@esm-bundle/chai';
import { createPlayerForMedia } from '../src/player.js';
import { init } from '../src/index.js';

/**
 * @returns {string}
 */
function dataAudio() {
  // short silent WAV data URI (browser can load metadata/duration in most cases)
  return 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
}

describe('audio-practice-player', () => {
  /** @type {HTMLElement[]} */
  let containers = [];

  afterEach(() => {
    for (const el of containers) el.remove();
    containers = [];
  });

  /**
   * @param {HTMLMediaElement} media
   * @returns {HTMLElement}
   */
  function mount(media) {
    const container = document.createElement('div');
    container.appendChild(media);
    document.body.appendChild(container);
    containers.push(container);
    return container;
  }

  it('replaces native controls with redesigned custom controls', () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    audio.controls = true;
    mount(audio);

    const instance = createPlayerForMedia(audio);
    expect(instance).to.not.equal(null);
    expect(audio.controls).to.equal(false);
    expect(audio.style.display).to.equal('none');

    const root = instance?.root;
    if (!root) throw new Error('no root');

    const playPause = /** @type {HTMLButtonElement | null} */ (root.querySelector('.app-play-pause'));
    expect(playPause?.textContent).to.equal('▶');
    expect(playPause?.getAttribute('aria-label')).to.equal('Play');

    const repeat = /** @type {HTMLButtonElement | null} */ (root.querySelector('.app-toggle'));
    expect(repeat?.textContent).to.equal('🔃');
    expect(repeat?.getAttribute('aria-pressed')).to.equal('false');

    expect(root.querySelector('input.app-progress')).to.exist;

    const speedBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('.app-speed-btn'));
    const volumeBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('.app-volume-btn'));
    expect(speedBtn?.textContent).to.equal('⏱ 100%');
    expect(volumeBtn?.textContent).to.equal('🔊');

    const speedPopover = /** @type {HTMLElement | null} */ (root.querySelector('.app-speed-popover'));
    const volumePopover = /** @type {HTMLElement | null} */ (root.querySelector('.app-volume-popover'));
    expect(speedPopover?.hidden).to.equal(true);
    expect(volumePopover?.hidden).to.equal(true);

    const speedSlider = /** @type {HTMLInputElement | null} */ (root.querySelector('.app-speed-slider'));
    expect(speedSlider?.min).to.equal('0.1');
    expect(speedSlider?.max).to.equal('2');
    expect(speedSlider?.step).to.equal('0.1');

    const volumeSlider = /** @type {HTMLInputElement | null} */ (root.querySelector('.app-volume-slider'));
    expect(volumeSlider?.min).to.equal('0');
    expect(volumeSlider?.max).to.equal('1');
    expect(volumeSlider?.step).to.equal('0.01');
  });

  it('toggles play/pause symbol from media events', () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    mount(audio);
    const instance = createPlayerForMedia(audio);
    const root = instance?.root;
    if (!root) throw new Error('no root');

    let paused = true;
    Object.defineProperty(audio, 'paused', { configurable: true, get: () => paused });
    Object.defineProperty(audio, 'duration', { configurable: true, value: 10 });
    audio.dispatchEvent(new Event('loadedmetadata'));

    const playPause = /** @type {HTMLButtonElement | null} */ (root.querySelector('.app-play-pause'));
    if (!playPause) throw new Error('play/pause missing');

    expect(playPause.textContent).to.equal('▶');
    paused = false;
    audio.dispatchEvent(new Event('play'));
    expect(playPause.textContent).to.equal('⏸');
    expect(playPause.getAttribute('aria-label')).to.equal('Pause');
    paused = true;
    audio.dispatchEvent(new Event('pause'));
    expect(playPause.textContent).to.equal('▶');
    expect(playPause.getAttribute('aria-label')).to.equal('Play');
  });

  it('changes speed in strict 10% increments with clear indication', () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    mount(audio);
    const instance = createPlayerForMedia(audio);
    const root = instance?.root;
    if (!root) throw new Error('no root');

    const speedBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('.app-speed-btn'));
    const speedSlider = /** @type {HTMLInputElement | null} */ (root.querySelector('.app-speed-slider'));
    const speedValue = /** @type {HTMLElement | null} */ (root.querySelector('.app-speed-value'));
    if (!speedBtn || !speedSlider || !speedValue) throw new Error('speed controls missing');

    speedSlider.value = '1.1';
    speedSlider.dispatchEvent(new Event('input', { bubbles: true }));
    expect(audio.playbackRate).to.be.closeTo(1.1, 0.001);
    expect(speedBtn.textContent).to.equal('⏱ 110%');
    expect(speedValue.textContent).to.equal('110%');

    speedSlider.value = '2';
    speedSlider.dispatchEvent(new Event('input', { bubbles: true }));
    expect(audio.playbackRate).to.be.closeTo(2.0, 0.001);
    expect(speedBtn.textContent).to.equal('⏱ 200%');

    speedSlider.value = '0.1';
    speedSlider.dispatchEvent(new Event('input', { bubbles: true }));
    expect(audio.playbackRate).to.be.closeTo(0.1, 0.001);
    expect(speedBtn.textContent).to.equal('⏱ 10%');
  });

  it('toggles speed and volume popovers (one at a time)', () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    mount(audio);
    const instance = createPlayerForMedia(audio);
    const root = instance?.root;
    if (!root) throw new Error('no root');

    const speedBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('.app-speed-btn'));
    const volumeBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('.app-volume-btn'));
    const speedPopover = /** @type {HTMLElement | null} */ (root.querySelector('.app-speed-popover'));
    const volumePopover = /** @type {HTMLElement | null} */ (root.querySelector('.app-volume-popover'));
    if (!speedBtn || !volumeBtn || !speedPopover || !volumePopover) throw new Error('popover controls missing');

    speedBtn.click();
    expect(speedPopover.hidden).to.equal(false);
    expect(speedBtn.getAttribute('aria-expanded')).to.equal('true');
    expect(volumePopover.hidden).to.equal(true);

    volumeBtn.click();
    expect(volumePopover.hidden).to.equal(false);
    expect(speedPopover.hidden).to.equal(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(volumePopover.hidden).to.equal(true);
  });

  it('initializes MP3 audio elements via init()', () => {
    const audio = document.createElement('audio');
    const source = document.createElement('source');
    source.src = 'track.mp3';
    source.type = 'audio/mpeg';
    audio.appendChild(source);
    audio.controls = true;
    mount(audio);

    init(document);
    expect(audio.controls).to.equal(false);
    expect(audio.getAttribute('data-audio-practice-player-initialized')).to.equal('true');
  });

  it('shows A/B marker labels in parentheses without A/B', () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    mount(audio);
    const instance = createPlayerForMedia(audio);
    const root = instance?.root;
    if (!root) throw new Error('no root');

    Object.defineProperty(audio, 'duration', { configurable: true, value: 125 });
    audio.dispatchEvent(new Event('loadedmetadata'));

    const labels = Array.from(root.querySelectorAll('.app-marker-label')).map((el) => el.textContent);
    expect(labels).to.include('(0:00)');
    expect(labels).to.include('(2:05)');
  });

  it('shows time as current on the left and (ending marker) total on the right', () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    mount(audio);
    const instance = createPlayerForMedia(audio);
    const root = instance?.root;
    if (!root) throw new Error('no root');

    Object.defineProperty(audio, 'duration', { configurable: true, value: 125 });
    audio.dispatchEvent(new Event('loadedmetadata'));

    expect(root.querySelector('.app-time-current')?.textContent).to.equal('0:00');
    expect(root.querySelector('.app-time-end')?.textContent).to.equal('(2:05) 2:05');
  });

  it('toggles repeat state', () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    mount(audio);
    const instance = createPlayerForMedia(audio);
    const root = instance?.root;
    if (!root) throw new Error('no root');

    const repeat = /** @type {HTMLButtonElement | null} */ (root.querySelector('.app-toggle'));
    if (!repeat) throw new Error('repeat missing');
    expect(repeat.getAttribute('aria-pressed')).to.equal('false');
    expect(repeat.getAttribute('aria-label')).to.equal('Repeat: off');
    repeat.click();
    expect(repeat.textContent).to.equal('🔃');
    expect(repeat.getAttribute('aria-pressed')).to.equal('true');
    expect(repeat.getAttribute('aria-label')).to.equal('Repeat: on');
  });

  it('controls volume with a vertical slider', () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    mount(audio);
    const instance = createPlayerForMedia(audio);
    const root = instance?.root;
    if (!root) throw new Error('no root');

    const volumeSlider = /** @type {HTMLInputElement | null} */ (root.querySelector('.app-volume-slider'));
    if (!volumeSlider) throw new Error('volume slider missing');

    volumeSlider.value = '0.4';
    volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
    expect(audio.volume).to.be.closeTo(0.4, 0.001);

    audio.volume = 0.7;
    audio.dispatchEvent(new Event('volumechange'));
    expect(Number(volumeSlider.value)).to.be.closeTo(0.7, 0.001);
  });
});
