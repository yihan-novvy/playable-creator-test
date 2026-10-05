import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';


export const execFile = promisify(execFileCallback);

// Subprocess helpers. Always execFile with args arrays — several project
// paths contain spaces ("Dragon Baby - Color Ever - Drink Milk"), so shell
// strings are forbidden.

const TOOL_CACHE = new Map();

// Version flags differ per tool: ffmpeg/ffprobe only accept -version, macOS
// unzip only accepts -v, node/python3 want --version.
const TOOL_PROBE_ARGS = {
  node: ['--version'],
  python3: ['--version'],
  ffmpeg: ['-version'],
  ffprobe: ['-version'],
  zip: ['-v'],
  unzip: ['-v'],
};

export async function hasTool(command, probeArgs) {
  const args = probeArgs ?? TOOL_PROBE_ARGS[command] ?? ['--version'];
  if (TOOL_CACHE.has(command)) return TOOL_CACHE.get(command);
  let ok = false;
  try {
    await execFile(command, args, { timeout: 10_000 });
    ok = true;
  } catch {
    ok = false;
  }
  TOOL_CACHE.set(command, ok);
  return ok;
}

export async function environment() {
  const [node, python3, ffmpeg, ffprobe, zip, unzip] = await Promise.all([
    hasTool('node'),
    hasTool('python3'),
    hasTool('ffmpeg'),
    hasTool('ffprobe'),
    hasTool('zip'),
    hasTool('unzip'),
  ]);
  let pil = false;
  if (python3) {
    try {
      await execFile('python3', ['-c', 'import PIL'], { timeout: 15_000 });
      pil = true;
    } catch {
      pil = false;
    }
  }
  return { node, python3, pil, ffmpeg, ffprobe, zip, unzip, ok: node && python3 && pil && ffmpeg && ffprobe && zip && unzip };
}

// Run a tool, capturing stdout; throws an Error carrying stderr on failure.
export async function run(command, args, options = {}) {
  const { stdout } = await execFile(command, args, {
    maxBuffer: 64 * 1024 * 1024,
    timeout: options.timeoutMs ?? 10 * 60_000,
    ...options,
  });
  return stdout;
}

export async function probeVideo(videoPath) {
  const stdout = await run('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,codec_name:format=duration',
    '-of', 'json',
    videoPath,
  ]);
  const probe = JSON.parse(stdout);
  const stream = probe.streams?.[0];
  if (!stream) throw new Error('视频文件里没有视频流');
  return {
    videoWidth: stream.width,
    videoHeight: stream.height,
    codec: stream.codec_name,
    durationSec: Number(probe.format?.duration ?? 0),
  };
}

// Works for PNG, JPEG, and WebP stills alike.
export async function probeImage(imagePath) {
  const stdout = await run('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,codec_name',
    '-of', 'json',
    imagePath,
  ]);
  const stream = JSON.parse(stdout).streams?.[0];
  if (!stream) throw new Error(`无法读取图片尺寸: ${imagePath}`);
  return { width: stream.width, height: stream.height, format: stream.codec_name };
}

// PNG IHDR geometry without pulling in a decoder: 8-byte signature, then the
// IHDR chunk with width/height at fixed offsets.
export function pngDimensions(buffer) {
  if (buffer.length < 24) throw new Error('PNG 文件太短');
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('不是 PNG 文件');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export function isJpeg(buffer) {
  return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}
