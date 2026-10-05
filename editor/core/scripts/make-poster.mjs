import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Derive the intro poster from the uploaded intro video's first frame.
// -strict unofficial is required: the mjpeg encoder rejects the H.264 sources
// full YUV range declaration otherwise. The frame is extracted to a temp JPEG
// (this environment's ffmpeg has no libwebp encoder) and transcoded to lossy
// WebP with PIL — the poster is a full-screen placeholder frame, so q80 is
// visually identical and roughly half the JPEG weight.
//
//   node make-poster.mjs --video <mp4> --out <webp>
//
// Prints a JSON metrics line on stdout (last line): dimensions, duration.

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

function flag(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : undefined;
}

const videoPath = path.resolve(flag('video') || '');
const outPath = path.resolve(flag('out') || '');
const frame = flag('frame') || 'first';
if (!['first', 'last'].includes(frame)) throw new Error('Frame must be first or last');
if (!videoPath || !fs.existsSync(videoPath)) throw new Error(`Missing intro video: ${videoPath}`);
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
if (!stream) throw new Error('No video stream found in the intro video');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const framePath = outPath.replace(/\.[^.]+$/, '') + '.frame.jpg';
try {
  // Use the final decoded video frame's timestamp, rather than guessing an
  // offset from duration (which may include audio or variable frame rates).
  let seek = [];
  if (frame === 'last') {
    const timestamps = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=best_effort_timestamp_time', '-of', 'csv=p=0', videoPath], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
      .split('\n').map(line => parseFloat(line)).filter(Number.isFinite);
    if (!timestamps.length) throw new Error('No video frame timestamp found');
    seek = ['-ss', String(Math.max(0, timestamps.at(-1) - timestamps[0]))];
  }
  execFileSync(
    'ffmpeg',
    ['-y', '-strict', 'unofficial', '-i', videoPath, ...seek, '-frames:v', '1', '-q:v', '2', '-update', '1', framePath],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  if (!fs.existsSync(framePath)) throw new Error('ffmpeg did not produce a poster frame');

  const transcode = `
import sys
from PIL import Image

frame, target = sys.argv[1], sys.argv[2]
quality = int(sys.argv[3])
Image.open(frame).convert("RGB").save(target, "WEBP", quality=quality, method=6)
`;
  execFileSync('python3', ['-c', transcode, framePath, outPath, '80'], { stdio: 'inherit' });
} finally {
  fs.rmSync(framePath, { force: true });
}

const poster = fs.readFileSync(outPath);
if (poster.toString('utf8', 0, 4) !== 'RIFF' || poster.toString('utf8', 8, 12) !== 'WEBP') {
  throw new Error('Poster output is not a WebP');
}

const metrics = {
  videoWidth: stream.width,
  videoHeight: stream.height,
  codec: stream.codec_name,
  durationSec: Number(probe.format?.duration ?? 0),
  videoBytes: fs.statSync(videoPath).size,
  posterBytes: fs.statSync(outPath).size,
};
console.log(JSON.stringify(metrics));
