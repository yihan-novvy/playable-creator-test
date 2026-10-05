// Cartoon water-pour sound, synthesized with the Web Audio API — no audio assets, keeping the playable lightweight.
// ?inline bundles the BGM mp3 as a data URI, so the ad base package carries no audio file of its own.
import BGM_URL from './bgm.mp3?inline';
// A lookahead scheduler fires pitched "glug" bubbles whose pitch and tempo climb as the vessel fills,
// each with a splashy noise transient. Browsers require a user gesture, so unlockAudio() runs in pointerdown.
let context = null, master = null, noise = null, voice = null, bgm = null, fillNow = 0;

export function unlockAudio() {
  if (context) { if (context.state === 'suspended') context.resume(); return; }
  context = new (window.AudioContext || window.webkitAudioContext)();
  master = context.createGain(); master.gain.value = .6; master.connect(context.destination);
  noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

// One cartoon "glug": a rising sine bloop with a short splashy transient, into the shared pour bus.
function glug(time, out, amplitude = .34) {
  const f0 = 330 * Math.pow(2, fillNow * 1.15) * (.85 + Math.random() * .3);
  const osc = context.createOscillator(); osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, time);
  osc.frequency.exponentialRampToValueAtTime(f0 * 2.7, time + .085);
  const gain = context.createGain();
  gain.gain.setValueAtTime(.0001, time);
  gain.gain.exponentialRampToValueAtTime(amplitude, time + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, time + .13);
  osc.connect(gain); gain.connect(out);
  osc.start(time); osc.stop(time + .16);
  const burst = context.createBufferSource(); burst.buffer = noise;
  burst.playbackRate.value = .8 + Math.random() * .4;
  const band = context.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 900 + Math.random() * 900; band.Q.value = 1.2;
  const wet = context.createGain();
  wet.gain.setValueAtTime(.0001, time);
  wet.gain.exponentialRampToValueAtTime(amplitude * .18, time + .01);
  wet.gain.exponentialRampToValueAtTime(.0001, time + .05);
  burst.connect(band); band.connect(wet); wet.connect(out);
  burst.start(time, Math.random() * .9); burst.stop(time + .07);
}

export function startPour() {
  unlockAudio();
  if (voice) return;
  fillNow = 0;
  const bus = context.createGain(); bus.gain.setValueAtTime(0, context.currentTime);
  const pump = () => {
    const horizon = context.currentTime + .28;
    while (voice.next < horizon) {
      glug(voice.next, bus);
      voice.next += .095 - fillNow * .035 + (Math.random() - .5) * .02; // tempo climbs as the cup fills
    }
  };
  voice = { bus, next: context.currentTime + .04, timer: 0 };
  bus.gain.linearRampToValueAtTime(1, context.currentTime + .06);
  bus.connect(master);
  pump(); voice.timer = setInterval(pump, 90);
}

export function updatePour(flow, fill) {
  if (!voice) return;
  fillNow = fill;
  voice.bus.gain.setTargetAtTime(flow, context.currentTime, .04);
}

export function stopPour() {
  if (!voice) return;
  const { bus } = voice;
  clearInterval(voice.timer); voice = null;
  // One last high "plip" buttons the pour off, bypassing the faded bus.
  fillNow = Math.min(1, fillNow + .12);
  glug(context.currentTime + .05, master, .2);
  setTimeout(() => bus.disconnect(), 1000);
}

// Background music: loads once, then loops under the pour effects. The raw
// asset sits at -27.5 LUFS; feeding the destination directly (not the .6 SFX
// master) at 0.5 lands around -33.5 LUFS — roughly midway between "too quiet
// to notice" (-41) and "too loud" (-23.5). One knob: gain.value below.
export function startBGM() {
  unlockAudio();
  if (bgm) return;
  bgm = 'loading';
  fetch(BGM_URL)
    .then(response => { if (!response.ok) throw new Error(response.status); return response.arrayBuffer(); })
    .then(data => context.decodeAudioData(data))
    .then(buffer => {
      const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
      const gain = context.createGain(); gain.gain.value = .5;
      source.connect(gain); gain.connect(context.destination); source.start();
      bgm = { source, gain };
    })
    .catch(() => { bgm = null; });
}
