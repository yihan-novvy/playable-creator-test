import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('All original audio clips are binary MPEG audio, not exported data-URL text',()=>{for(const name of ['bgm','pickup','place','place-single','store','store-move','success']){const bytes=fs.readFileSync(new URL(`../public/audio/${name}.mp3`,import.meta.url));assert.ok(bytes.length>500,name);assert.ok((bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0)||bytes.subarray(0,3).toString()==='ID3',`${name} must be decodable audio`);}});
