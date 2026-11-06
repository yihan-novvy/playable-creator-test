// Current game.js contract checks. The skill's older HTML/postMessage checker
// is deliberately not used. This script does not certify platform event logs.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [gameArchive,assemblyArchive,reportPath]=process.argv.slice(2);
if(!reportPath)throw new Error('Usage: node check-artifact.mjs game-only.zip assembly.zip report.json');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const list=file=>execFileSync('unzip',['-Z1',file],{encoding:'utf8'}).trim().split('\n');
const extract=(file,name)=>execFileSync('unzip',['-p',file,name],{maxBuffer:35000000});
const names=list(gameArchive);assert.deepEqual(names,['game.js']);
const bytes=extract(gameArchive,'game.js'),source=bytes.toString();
assert.equal((source.match(/NovvyGame\(function/g)||[]).length,1);new vm.Script(source);
assert.ok(!/postMessage|messageHandlers|NovvyPlayable|NovvyAnalytics|NovvyShell|window\.open\(|mraid\./.test(source));
const built=fs.readFileSync(new URL('../../../editor/templates/candy-crush-origin/game/game.js',import.meta.url));assert.ok(bytes.equals(built),'archive is the final built game');
assert.ok(fs.statSync(gameArchive).size<=5000000);
const entries=list(assemblyArchive);assert.deepEqual(entries.sort(),['game.js','index.html']);
assert.ok(extract(assemblyArchive,'game.js').equals(bytes));
const html=extract(assemblyArchive,'index.html').toString();assert.ok(html.includes('<script src="game.js"></script>'));
assert.ok(!html.includes('data-action="download"'));assert.ok(!html.includes('class="novvy-cta-btn cta download"'));
const rawBytes=entries.reduce((total,name)=>total+extract(assemblyArchive,name).length,0);
assert.ok(fs.statSync(assemblyArchive).size<=10000000&&rawBytes<=30000000&&entries.length<=4000);
const metadata=file=>({file:path.basename(file),sha256:sha(fs.readFileSync(file)),bytes:fs.statSync(file).size,entries:list(file)});
const report={schemaVersion:1,checkedAt:new Date().toISOString(),staticPass:true,platformEventsVerified:false,nativeFileRuntimeVerified:false,game:metadata(gameArchive),assembly:{...metadata(assemblyArchive),uncompressedBytes:rawBytes},gameJsSha256:sha(bytes),checks:['Root classic game.js, one synchronous registration and parseable syntax','Exact final build bytes in both archives','No legacy bridge, native channel, SDK, direct store opening or window messages in game','Standard host card has one event owner','Standalone and total assembly package limits'],limitations:['Static dependency inspection and local browser assembly testing do not establish official platform acceptance','Official message/Tracking correlation and native WebView/file execution remain unverified']};
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
