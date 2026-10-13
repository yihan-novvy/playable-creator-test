import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Normalize an uploaded intro/outro video into the packaging artifact:
// playable-ads delivery needs H.264 (never HEVC/VP9/AV1), and uploaded
// exports land at 11-12 Mbps — near-lossless editor presets that bloat the
// zip far past the ~5 MB channel caps. The recipe caps the short side at
// 720 px (playable quality), rate-caps bursts so high-motion content cannot
// blow the budget, and collapses audio to mono 64k AAC.
//
//   node transcode-video.mjs --video <mp4> --out <mp4>
//
// Prints a JSON metrics line on stdout (last line): packaged dimensions.

const SHORT_SIDE_CAP = 720;
const FPS_CAP = 30;

function flag(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : undefined;
}

const videoPath = path.resolve(flag('video') || '');
const outPath = path.resolve(flag('out') || '');
if (!videoPath || !fs.existsSync(videoPath)) throw new Error(`Missing video: ${videoPath}`);
if (!outPath) throw new Error('Missing --out');

const probeJson = execFileSync(
  'ffprobe',
  [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,codec_name:format=duration',
    '-of', 'json',
    videoPath,
  ],
  { encoding: 'utf8' },
);
const probe = JSON.parse(probeJson);
const stream = probe.streams?.[0];
if (!stream) throw new Error(`No video stream found: ${videoPath}`);

// Downscale only, capping the short side (720p portrait = 720x1280). Long side
// stays even — H.264 4:2:0 requires even dimensions.
const width = stream.width;
const height = stream.height;
const shortSide = Math.min(width, height);
const longSide = Math.max(width, height);
let scaleArgs = [];
if (shortSide > SHORT_SIDE_CAP) {
  const longTarget = Math.floor((longSide * SHORT_SIDE_CAP) / shortSide / 2) * 2;
  // Portrait sources keep width as the capped side; landscape flip it.
  const scale = width <= height ? `${SHORT_SIDE_CAP}:${longTarget}` : `${longTarget}:${SHORT_SIDE_CAP}`;
  scaleArgs = ['-vf', `scale=${scale}:flags=lanczos`];
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
execFileSync(
  'ffmpeg',
  [
    '-y', '-i', videoPath,
    ...scaleArgs,
    // Rate control: CRF for quality-scaled size, maxrate as the worst-case
    // ceiling (~700k video + 64k audio ≈ 95 KB/s ⇒ 30 s ≈ 2.9 MB hard cap).
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '25',
    '-maxrate', '700k', '-bufsize', '1400k',
    // Webview-safe profile; yuv420p for cross-device chroma compatibility.
    '-profile:v', 'main', '-level', '4.0', '-pix_fmt', 'yuv420p',
    '-fpsmax', String(FPS_CAP),
    // Audio is real in current sources (intro has a sound toggle) — keep it,
    // but mono 64k is plenty under playback conditions.
    '-c:a', 'aac', '-b:a', '64k', '-ac', '1',
    // moov atom up front so the SDK WebView can start playback on load.
    '-movflags', '+faststart',
    outPath,
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
);

const packaged = fs.readFileSync(outPath);
if (packaged.length <= 12 || packaged.readUInt32BE(4) !== 0x66747970) {
  throw new Error('Transcoded output is not an MP4 (ftyp magic missing)');
}

const outProbe = JSON.parse(execFileSync(
  'ffprobe',
  ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', outPath],
  { encoding: 'utf8' },
));
const outStream = outProbe.streams?.[0];
if (!outStream) throw new Error('Transcoded output has no video stream');

const metrics = {
  sourceWidth: width,
  sourceHeight: height,
  packagedWidth: outStream.width,
  packagedHeight: outStream.height,
  durationSec: Number(probe.format?.duration ?? 0),
  sourceBytes: fs.statSync(videoPath).size,
  packagedBytes: fs.statSync(outPath).size,
};
console.log(JSON.stringify(metrics));
