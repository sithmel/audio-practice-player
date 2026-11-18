import { expect } from '@esm-bundle/chai';
import { createPlayerForMedia } from '../src/player.js';
import { init } from '../src/index.js';

/**
 * @param {number} seconds
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

  it('replaces native controls with custom controls', () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    audio.controls = true;
    mount(audio);

    const instance = createPlayerForMedia(audio);
    expect(instance).to.not.equal(null);
    expect(audio.controls).to.equal(false);
    expect(audio.style.display).to.equal('none');

    const root = instance?.root;
    expect(root?.querySelector('button')?.textContent).to.equal('Play');
    expect(root?.textContent).to.include('Pause');
    expect(root?.querySelector('input[type="range"]')).to.exist;
    expect(root?.textContent).to.include('Repeat: Off');
    expect(root?.textContent).to.include('100%');
  });

  it('changes speed in 10% steps within bounds', async () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    mount(audio);
    const instance = createPlayerForMedia(audio);
    const root = instance?.root;
    if (!root) throw new Error('no root');

    const buttons = Array.from(root.querySelectorAll('button'));
    const down = buttons.find((b) => b.textContent === '−10%');
    const up = buttons.find((b) => b.textContent === '+10%');
    if (!down || !up) throw new Error('speed buttons missing');

    up.click();
    expect(audio.playbackRate).to.be.closeTo(1.1, 0.001);
    for (let i = 0; i < 20; i++) up.click();
    expect(audio.playbackRate).to.be.closeTo(2.0, 0.001);
    for (let i = 0; i < 30; i++) down.click();
    expect(audio.playbackRate).to.be.closeTo(0.1, 0.001);
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

  it('shows A/B marker labels in mm:ss format', () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    mount(audio);
    const instance = createPlayerForMedia(audio);
    const root = instance?.root;
    if (!root) throw new Error('no root');

    Object.defineProperty(audio, 'duration', { configurable: true, value: 125 });
    audio.dispatchEvent(new Event('loadedmetadata'));

    const labels = Array.from(root.querySelectorAll('.app-marker-label')).map((el) => el.textContent);
    expect(labels).to.include('0:00');
    expect(labels).to.include('2:05');
  });

  it('toggles repeat state', () => {
    const audio = document.createElement('audio');
    audio.src = dataAudio();
    mount(audio);
    const instance = createPlayerForMedia(audio);
    const root = instance?.root;
    if (!root) throw new Error('no root');

    const repeat = Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.includes('Repeat'));
    if (!repeat) throw new Error('repeat missing');
    expect(repeat.getAttribute('aria-pressed')).to.equal('false');
    repeat.click();
    expect(repeat.textContent).to.equal('Repeat: On');
    expect(repeat.getAttribute('aria-pressed')).to.equal('true');
  });
});
