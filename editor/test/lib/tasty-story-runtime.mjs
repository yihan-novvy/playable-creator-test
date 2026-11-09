import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../plugins/tasty-travels-origin/overlays/story/story.js', import.meta.url), 'utf8');
const audioSource = fs.readFileSync(new URL('../../plugins/tasty-travels-origin/overlays/story/story-audio.js', import.meta.url), 'utf8');
function runtime({ intro = false, introFinished = false, reduced = false, audio = false, autoplay = true } = {}) {
  const timers = new Set(), timeouts = [], events = [], listeners = new Map(), documentListeners = new Map();
  const audioState = { allowed: autoplay, contexts: [], sources: [] };
  class AudioContext {
    state = audioState.allowed ? 'running' : 'suspended'; currentTime = 0; destination = {}; sampleRate = 48000;
    constructor() { audioState.contexts.push(this); }
    resume() { if (!audioState.allowed) return Promise.reject(new Error('Autoplay denied')); if (this.state !== 'closed') { this.state = 'running'; this.onstatechange?.(); } return Promise.resolve(); }
    suspend() { this.state = 'suspended'; this.onstatechange?.(); return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
    createGain() { return { gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
    createBuffer(channels, length, sampleRate) {
      const samples = new Float32Array(length);
      return { duration: length / sampleRate, getChannelData() { return samples; } };
    }
    createBufferSource() {
      const source = { loop: false, connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
      audioState.sources.push(source); return source;
    }
  }
  class Element {
    children = []; style = {}; dataset = {}; attributes = {}; handlers = {}; textContent = ''; scrollTop = 0; scrollHeight = 100;
    classList = { toggle() {}, add() {} };
    appendChild(child) { this.children.push(child); }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, handler) { this.handlers[name] = handler; }
    removeEventListener(name) { delete this.handlers[name]; }
    querySelector() { return this.label || (this.label = new Element()); }
    scrollTo({ top }) { this.scrollTop = top; }
    remove() { this.removed = true; }
    fire(type, properties = {}) { this.handlers[type]?.({ stopPropagation() {}, preventDefault() {}, ...properties }); }
  }
  const nodes = Object.fromEntries(['novvy-story', 'tasty-story-feed', 'tasty-story-next', 'tasty-story-skip', 'tasty-story-sound'].map(id => [id, new Element()]));
  const root = nodes['novvy-story'], feed = nodes['tasty-story-feed'], next = nodes['tasty-story-next'], skip = nodes['tasty-story-skip'];
  root.hidden = intro;
  const document = { hidden: false, getElementById: id => nodes[id], createElement: () => new Element(), addEventListener: (name, fn) => documentListeners.set(name, fn), removeEventListener: name => documentListeners.delete(name) };
  const window = {
    __ORIGIN_CONFIG__: { intro }, __novvyIntroFinished: introFinished, __novvyBridgeVersion: 1, __novvyViewable: true,
    matchMedia: () => ({ matches: reduced }), setTimeout: fn => timeouts.push(fn),
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
    dispatchEvent(event) { events.push(event); listeners.get(event.type)?.(event); },
  };
  if (audio) window.AudioContext = AudioContext;
  vm.runInNewContext(audioSource + '\n' + source, { URLSearchParams, location:{search:''}, document, window, setInterval(fn) { timers.add(fn); return fn; }, clearInterval(fn) { timers.delete(fn); }, CustomEvent: class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } } });
  return { root, feed, next, skip, document, window, events, timers, audioState, sound: nodes['tasty-story-sound'],
    visibility: hidden => { document.hidden = hidden; documentListeners.get('visibilitychange')?.(); },
    tick: () => [...timers].forEach(fn => fn()), flush: () => timeouts.splice(0).forEach(fn => fn()),
    lines: () => feed.children.filter(node => node.dataset.speaker).map(row => row.children[1].children[1].textContent),
  };
}

export async function testStory(a) {
  const r = runtime();
  a.check(!r.root.hidden && r.feed.children.length === 2, 'story starts with scene and first dialogue');
  r.tick(); const partial = r.lines()[0]; r.document.hidden = true; r.tick();
  a.equal(r.lines()[0], partial, 'typing pauses in hidden documents');
  r.document.hidden = false; r.window.__novvyViewable = false; r.tick();
  a.equal(r.lines()[0], partial, 'typing pauses when ad is not viewable');
  r.window.__novvyViewable = true; r.next.fire('click');
  a.equal(r.lines()[0], 'Ma’am, are you alright? What are you doing here?', 'first tap reveals full dialogue without skipping it');
  r.feed.fire('pointerdown', { clientX: 50, clientY: 200 }); r.feed.fire('click', { clientX: 50, clientY: 150 });
  a.equal(r.feed.children.length, 2, 'scroll gestures do not advance dialogue');
  r.feed.fire('keydown', { key: 'Enter' }); r.next.fire('click');
  a.equal(r.lines()[1], 'Officer, thank goodness you’re here! That way, hurry!', 'keyboard advances and tap reveals the next line');
  for (let count = 0; count < 25 && r.next.attributes['aria-label'] !== 'Continue to game'; count++) r.next.fire('click');
  a.equal(r.lines().length, 8, 'full story contains all eight dialogue lines');
  a.equal(r.lines().at(-1), 'It might’ve started the fire!', 'story reaches the final hook before entering the game');
  a.check(!r.window.__novvyStoryFinished && r.timers.size === 0, 'final line waits for Continue and leaves no typing timer');
  r.next.fire('click'); r.skip.fire('click'); r.flush();
  a.equal(r.events.filter(e => e.type === 'novvy:story-finished').map(e => [e.type, e.detail.reason]), [['novvy:story-finished', 'continue']], 'Continue signals entry only once even after another click');
  a.check(r.root.removed && r.next.disabled && r.skip.disabled, 'finished overlay is removed and controls are disabled');
  const video = runtime({ intro: true });
  a.check(video.root.hidden && !video.feed.children.length, 'story waits behind video');
  video.skip.fire('click'); a.equal(video.events.length, 0, 'hidden story cannot end early');
  video.window.dispatchEvent({ type: 'novvy:intro-finished' });
  a.check(!video.root.hidden && video.feed.children.length === 2, 'video completion reveals story');
  video.skip.fire('click'); video.skip.fire('click');
  a.equal(video.events.filter(e => e.type === 'novvy:story-finished').map(e => e.detail.reason), ['skip'], 'skip exits exactly once while typing');
  a.equal(video.timers.size, 0, 'skip clears active typing timer');
  const ready = runtime({ intro: true, introFinished: true, reduced: true });
  a.check(!ready.root.hidden && ready.lines()[0].length > 10 && !ready.timers.size, 'finished video starts immediately and reduced motion shows complete text');
  const typingAudio = runtime({ audio: true });
  typingAudio.next.fire('click');
  a.equal(typingAudio.audioState.sources.length, 1, 'revealing typed text does not repeat the dialogue cue');
  typingAudio.skip.fire('click');
  a.check(typingAudio.audioState.contexts[0].state === 'closed' && !typingAudio.timers.size, 'skipping during typing clears both audio and typing timers');
  const music = runtime({ audio: true, reduced: true });
  const cues = () => music.audioState.sources.length;
  a.check(music.window.__novvyStorySound.active && cues() === 1, 'story enables native music and plays one first-dialogue bubble');
  const bubble = music.audioState.sources[0].buffer, samples = bubble.getChannelData(0);
  a.check(bubble.duration >= .115 && bubble.duration < .116 && Math.max(...samples) > .2 && samples.every(n => Number.isFinite(n) && Math.abs(n) <= 1), 'bubble is a short non-clipping PCM pop');
  music.next.fire('click');
  a.equal(cues(), 2, 'each new dialogue plays one cue');
  a.check(music.audioState.sources.every(s => !s.loop && s.buffer === bubble), 'dialogue reuses one buffer and never creates separate music loops');
  const step = music.root.dataset.step;
  music.sound.fire('click');
  a.check(music.audioState.contexts[0].state === 'suspended' && music.sound.dataset.muted === 'true' && music.window.__novvyStorySound.muted, 'sound control mutes bubbles and publishes native music mute');
  a.equal(music.root.dataset.step, step, 'sound control does not advance the story');
  music.visibility(true); music.visibility(false);
  a.equal(music.audioState.contexts[0].state, 'suspended', 'explicit mute survives visibility changes');
  music.next.fire('click'); a.equal(cues(), 2, 'muted dialogue does not make a cue');
  music.sound.fire('click');
  a.check(music.audioState.contexts[0].state === 'running' && music.sound.dataset.muted === 'false' && !music.window.__novvyStorySound.muted, 'sound control resumes bubbles and native music');
  a.equal(cues(), 2, 'unmuting does not replay old dialogue cues');
  music.visibility(true); a.equal(music.audioState.contexts[0].state, 'suspended', 'hidden page suspends story audio');
  music.visibility(false); a.equal(music.audioState.contexts[0].state, 'running', 'visible page resumes story audio');
  music.window.__novvyViewable = false; music.window.dispatchEvent({ type: 'novvy:viewablechange' });
  a.equal(music.audioState.contexts[0].state, 'suspended', 'non-viewable ad suspends story audio');
  music.window.__novvyViewable = true; music.window.dispatchEvent({ type: 'novvy:viewablechange' });
  const beforeScene = cues(); music.next.fire('click');
  a.equal(cues(), beforeScene, 'scene cards do not play dialogue cues');
  for (let count = 0; count < 10 && music.next.attributes['aria-label'] !== 'Continue to game'; count++) music.next.fire('click');
  music.next.fire('click'); await Promise.resolve();
  a.check(music.audioState.contexts[0].state === 'closed' && music.timers.size === 0 && music.audioState.sources.every(s => s.stopped), 'Continue releases the bubble context and clears typing');
  a.check(!music.window.__novvyStorySound.active && music.events.at(-1).type === 'novvy:story-finished', 'Continue hands native music over without an intervening mute event');
  const videoAudio = runtime({ audio: true, intro: true, reduced: true });
  a.check(videoAudio.audioState.contexts.length === 0 && !videoAudio.window.__novvyStorySound.active, 'video phase does not start story sound');
  videoAudio.window.dispatchEvent({ type: 'novvy:intro-finished' });
  a.check(videoAudio.audioState.contexts[0].state === 'running' && videoAudio.window.__novvyStorySound.active, 'video completion enables native music and bubbles');
  videoAudio.skip.fire('click'); await Promise.resolve();
  a.equal(videoAudio.audioState.contexts[0].state, 'closed', 'skip closes story audio');
  const blocked = runtime({ audio: true, autoplay: false, reduced: true });
  await Promise.resolve();
  a.equal(blocked.audioState.sources.length, 0, 'autoplay rejection keeps story usable and silent');
  blocked.audioState.allowed = true; blocked.next.fire('click');
  a.equal(blocked.audioState.sources.length, 1, 'first gesture unlocks audio and only cues the new dialogue');
  blocked.skip.fire('click'); blocked.visibility(false); await Promise.resolve();
  a.equal(blocked.audioState.contexts[0].state, 'closed', 'late resume promises and visibility cannot revive finished bubbles');
}
