import fs from 'node:fs';

export const marker = 'window.__res=';

export function locateResourceObject(source) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Could not find ${marker}`);
  const start = markerIndex + marker.length;
  if (source[start] !== '{') throw new Error('Resource bundle does not start with an object');

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  throw new Error('Resource bundle object is not closed');
}

export function readBundle(htmlPath) {
  const source = fs.readFileSync(htmlPath, 'utf8');
  const range = locateResourceObject(source);
  const resources = JSON.parse(source.slice(range.start, range.end));
  return { source, range, resources };
}

export function locateZipPayload(source) {
  const match = /window\.__zip\s*=\s*"([A-Za-z0-9+/=]+)"/.exec(source);
  if (!match) throw new Error('Could not find the embedded ZIP payload');
  const start = match.index + match[0].indexOf(match[1]);
  return { start, end: start + match[1].length, payload: match[1] };
}
