import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wasm': 'application/wasm',
  '.bin': 'application/octet-stream',
};

export function mimeFor(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

export function sendError(res, status, message, extra = {}) {
  sendJson(res, status, { error: { message, ...extra } });
}

export async function readJsonBody(req, capBytes = 1024 * 1024) {
  const raw = await readRawBody(req, capBytes);
  if (raw.length === 0) return {};
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    const err = new Error('请求体不是合法 JSON');
    err.statusCode = 400;
    throw err;
  }
}

export async function readRawBody(req, capBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > capBytes) {
      const err = new Error(`请求体超过 ${capBytes} 字节上限`);
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function isInsideRoot(rootPath, candidatePath) {
  const resolvedRoot = path.resolve(rootPath);
  const resolved = path.resolve(candidatePath);
  return resolved === resolvedRoot || resolved.startsWith(resolvedRoot + path.sep);
}

// Static file serving with byte-range support (Safari refuses to play
// <video> without it). Always streams; never readFileSync per request.
export function serveFile(req, res, filePath, { cacheable = false } = {}) {
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    sendError(res, 404, '文件不存在');
    return;
  }
  if (!stat.isFile()) {
    sendError(res, 404, '文件不存在');
    return;
  }

  const mime = mimeFor(filePath);
  const headers = {
    'Content-Type': mime,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheable ? 'public, max-age=3600' : 'no-cache',
  };

  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match) {
      const start = match[1] === '' ? undefined : Number(match[1]);
      const end = match[2] === '' ? undefined : Number(match[2]);
      let rangeStart;
      let rangeEnd;
      if (start === undefined) {
        // suffix range: bytes=-N → last N bytes
        rangeStart = Math.max(0, stat.size - Number(match[2]));
        rangeEnd = stat.size - 1;
      } else {
        rangeStart = start;
        rangeEnd = end === undefined || end >= stat.size ? stat.size - 1 : end;
      }
      if (Number.isNaN(rangeStart) || Number.isNaN(rangeEnd) || rangeStart > rangeEnd || rangeStart >= stat.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        res.end();
        return;
      }
      headers['Content-Range'] = `bytes ${rangeStart}-${rangeEnd}/${stat.size}`;
      headers['Content-Length'] = rangeEnd - rangeStart + 1;
      res.writeHead(206, headers);
      fs.createReadStream(filePath, { start: rangeStart, end: rangeEnd }).pipe(res);
      return;
    }
  }

  headers['Content-Length'] = stat.size;
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

// Stream a request body (raw bytes) straight to disk with a hard cap.
export async function writeBodyToFile(req, targetPath, capBytes) {
  ensureParent(targetPath);
  const tmpPath = `${targetPath}.uploading`;
  const out = fs.createWriteStream(tmpPath);
  let total = 0;
  try {
    for await (const chunk of req) {
      total += chunk.length;
      if (total > capBytes) {
        const err = new Error(`上传超过 ${capBytes} 字节上限`);
        err.statusCode = 413;
        throw err;
      }
      if (!out.write(chunk)) {
        await new Promise((resolve, reject) => {
          out.once('drain', resolve);
          out.once('error', reject);
        });
      }
    }
    out.end();
    await new Promise((resolve, reject) => {
      out.once('finish', resolve);
      out.once('error', reject);
    });
    fs.renameSync(tmpPath, targetPath);
  } finally {
    if (fs.existsSync(tmpPath)) fs.rmSync(tmpPath, { force: true });
  }
  return total;
}

function ensureParent(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

export function readableToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

export { Readable };
