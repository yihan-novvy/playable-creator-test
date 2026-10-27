#!/usr/bin/env node
// Local inspection only: never execute, import, or fetch the supplied content.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { brotliDecompressSync } from 'node:zlib';

const LIMIT = 32 * 1024 * 1024;
const MAX_CANDIDATES = 64;
const hash = data => createHash('sha256').update(data).digest('hex');
const utf8 = data => new TextDecoder('utf-8', { fatal: true }).decode(data);

function cleanReference(value) {
  if (/^(?:data|javascript|blob):/i.test(value)) return null;
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.username = ''; url.password = ''; url.search = ''; url.hash = '';
    return url.href;
  } catch {
    return value.split(/[?#]/, 1)[0].slice(0, 1024);
  }
}

// Read a literal JSON object, respecting strings/braces, without evaluating JS.
function jsonObjectAt(text, start) {
  while (/\s/.test(text[start] || '') && start < text.length) start++;
  if (text[start] !== '{') return null;
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; }
    }
  }
  return null;
}

function summarizeParameters(params) {
  const result = { keys: Object.keys(params).slice(0, 200), collections: {}, storeTriggers: {} };
  if (typeof params.adNetwork === 'string') result.adNetwork = params.adNetwork.slice(0, 100);
  for (const [key, value] of Object.entries(params)) {
    if (/asset|texture|atlas|audio|level/i.test(key) && value && typeof value === 'object') {
      result.collections[key] = { type: Array.isArray(value) ? 'array' : 'object', count: Object.keys(value).length };
    }
    if (/market|store|endcard/i.test(key) && ['number', 'boolean'].includes(typeof value)) {
      result.storeTriggers[key] = value;
    }
  }
  if (Array.isArray(params.levelAssets)) {
    result.levelCount = params.levelAssets.length;
    // BMS is a known source-specific shape, not a universal level format.
    if (params.levelAssets.every(level => Array.isArray(level?.BMS))) {
      result.bmsBlockCounts = params.levelAssets.map(level => level.BMS.length);
    }
  }
  result.hasAssetSignature = Object.keys(params).some(key => /signature/i.test(key));
  return result;
}

export function inspectPlayable({ input, out, sourceUrl }) {
  if (!input || !out) throw new Error('--input and --out are required');
  const extension = path.extname(input).toLowerCase();
  if (!['.html', '.htm', '.js', '.mjs'].includes(extension)) {
    throw new Error('Input must be HTML or JavaScript; inspect and extract ZIP entries separately');
  }
  if (!fs.statSync(input).isFile() || fs.statSync(input).size > LIMIT) {
    throw new Error('Input must be a regular file no larger than 32 MiB');
  }
  if (fs.existsSync(out)) throw new Error('Output directory already exists; choose a new directory');
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) throw new Error('--source-url must be an HTTP(S) URL');
  const raw = fs.readFileSync(input);
  const text = utf8(raw);
  const files = new Map();
  const add = (name, value) => files.set(name, Buffer.isBuffer(value) ? value : Buffer.from(value));
  add(`source-original${extension === '.htm' ? '.html' : extension}`, raw);
  const report = {
    schemaVersion: 1,
    source: { filename: path.basename(input), bytes: raw.length, sha256: hash(raw) },
    format: 'javascript',
    references: [], editorParameters: [], engineHints: [], warnings: [],
    brotli: { candidates: 0, decoded: 0, failed: 0, nonUtf8: 0, truncated: false },
  };
  if (sourceUrl) report.source.url = cleanReference(sourceUrl);
  let html;
  const wrapper = text.trim().match(/^al_renderHtml\s*\(\s*([\s\S]*)\s*\)\s*;?$/);
  if (wrapper) {
    try {
      const payload = JSON.parse(wrapper[1]);
      if (typeof payload.html !== 'string') throw new Error('Missing html string');
      html = payload.html;
      report.format = 'applovin-json-html';
    } catch {
      report.warnings.push('al_renderHtml payload is not a supported literal JSON object with an html string; preserved without execution');
    }
  } else if (['.html', '.htm'].includes(extension) || /^\s*(?:<!doctype\s+html|<html\b)/i.test(text)) {
    html = text;
    report.format = 'html';
  }
  const scripts = [];
  if (html !== undefined) {
    add('unpacked.html', html);
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
      if (!match[1].trim()) continue;
      const name = `inline-${String(scripts.length + 1).padStart(3, '0')}.js`;
      scripts.push({ name, text: match[1] });
      add(name, match[1]);
    }
    const seen = new Set();
    for (const match of html.matchAll(/<(script|iframe|link)\b[^>]*?\s(?:src|href)\s*=\s*(["'])(.*?)\2[^>]*>/gi)) {
      const reference = cleanReference(match[3]);
      const key = `${match[1].toLowerCase()}:${reference}`;
      if (reference && !seen.has(key)) {
        seen.add(key);
        if (report.references.length < 200) report.references.push({ tag: match[1].toLowerCase(), reference });
        else if (!report.warnings.includes('Reference list truncated at 200')) report.warnings.push('Reference list truncated at 200');
      }
    }
    if (!scripts.length) report.warnings.push('No inline scripts found; inspect the declared external dependencies');
  } else scripts.push({ name: path.basename(input), text });

  const decodedTexts = [];
  let decodedBytes = 0;
  const seenCompressed = new Set();
  candidateLoop: for (const script of scripts) {
    for (const match of script.text.matchAll(/(["'])([A-Za-z0-9+/]{20000,}={0,2})\1/g)) {
      const fingerprint = hash(match[2]);
      if (seenCompressed.has(fingerprint)) continue;
      seenCompressed.add(fingerprint);
      if (report.brotli.candidates >= MAX_CANDIDATES) {
        report.brotli.truncated = true;
        break candidateLoop;
      }
      report.brotli.candidates++;
      let decoded;
      try { decoded = brotliDecompressSync(Buffer.from(match[2], 'base64'), { maxOutputLength: LIMIT }); }
      catch { report.brotli.failed++; continue; }
      let decodedText;
      try { decodedText = utf8(decoded); } catch { report.brotli.nonUtf8++; continue; }
      if (decodedBytes + decoded.length > 2 * LIMIT) {
        report.brotli.truncated = true;
        break candidateLoop;
      }
      decodedBytes += decoded.length;
      const name = `decoded-${String(++report.brotli.decoded).padStart(3, '0')}.txt`;
      add(name, decoded);
      decodedTexts.push({ name, text: decodedText });
    }
  }
  if (report.brotli.truncated) report.warnings.push('Brotli inspection stopped at the candidate or cumulative output limit');
  if (!report.brotli.decoded) report.warnings.push('No long Brotli UTF-8 payload identified; this is not proof of a broken or complete playable');
  report.inlineScriptCount = html === undefined ? 0 : scripts.length;
  for (const script of [...scripts, ...decodedTexts]) {
    for (const match of script.text.matchAll(/\bwindow\.editorParameters\s*=\s*/g)) {
      const params = jsonObjectAt(script.text, match.index + match[0].length);
      if (params) report.editorParameters.push({ file: script.name, ...summarizeParameters(params) });
      else report.warnings.push(`Non-JSON editorParameters assignment in ${script.name}; not evaluated`);
      if (report.editorParameters.length >= 16) break;
    }
    for (const [engine, pattern] of [['PixiJS', /\bPIXI\b|pixi\.js/i], ['Cocos', /\bcc\.game\b|CocosCreator|cocos-engine/i], ['Three.js', /\bTHREE\b|three\.js/i]]) {
      if (pattern.test(script.text) && !report.engineHints.includes(engine)) report.engineHints.push(engine);
    }
  }
  report.files = [...files].map(([name, data]) => ({ name, bytes: data.length, sha256: hash(data) }));
  add('inspection.json', JSON.stringify(report, null, 2) + '\n');
  // mkdir without recursive prevents races from overwriting an existing output.
  fs.mkdirSync(out);
  try {
    for (const [name, data] of files) fs.writeFileSync(path.join(out, name), data, { flag: 'wx' });
  } catch (error) {
    fs.rmSync(out, { recursive: true, force: true });
    throw error;
  }
  return report;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: node inspect-playable.mjs --input FILE --out NEW_DIRECTORY [--source-url URL]\nLocal HTML/JS only; no network or code execution. Node.js 22+.');
    return;
  }
  const options = {};
  const names = { '--input': 'input', '--out': 'out', '--source-url': 'sourceUrl' };
  for (let i = 0; i < args.length; i += 2) {
    if (!names[args[i]] || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Invalid argument: ${args[i]}`);
    options[names[args[i]]] = args[i + 1];
  }
  const report = inspectPlayable(options);
  console.log(JSON.stringify({ output: path.resolve(options.out), format: report.format, sourceSha256: report.source.sha256, decoded: report.brotli.decoded, warnings: report.warnings }, null, 2));
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
