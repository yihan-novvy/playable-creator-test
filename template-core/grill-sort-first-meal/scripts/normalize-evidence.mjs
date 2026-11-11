// Normalize only retained UI exports. Never synthesize missing observations.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const dir=path.resolve(process.argv[2] || 'result/grill-sort-first-meal/validation');
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const lines=name=>read(name).trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));
const messages=lines('platform-messages.jsonl'), requests=lines('platform-tracking.jsonl');
const epoch=time=>Date.parse('2026-11-11T'+time+'+08:00');
const requirements=JSON.parse(read('requirements.json'));
const raw={source:'Official playable-debug Copy controls',captureDate:'2026-11-11',timezone:'Asia/Shanghai',messages,requests};
fs.writeFileSync(path.join(dir,'platform-raw.json'),JSON.stringify(raw,null,2)+'\n');
const records=messages.filter(item=>item.segment===1).map(item=>{
  const observation={source:'platform',received_at:epoch(item.time)};
  if(item.direction==='shell→playable')return {...observation,direction:'lifecycle',type:item.type,...(JSON.parse(item.raw).env?{data:JSON.parse(item.raw).env}:{})};
  return {...observation,direction:'game_log',message_id:item.seq,accepted:item.accepted,message:JSON.parse(item.raw),...(item.reason?{reason:item.reason}:{})};
});
const tracking_requests=requests.map(item=>({req_type:'GET',req_url:item.url,captured_at:epoch(item.time),
  ...(item.causeSeq?{message_id:item.causeSeq}:{}),...(item.name==='media_progress'?{milestone:Number(item.p.milestone)}:{})}));
// Each trace is one terminal round (either outcome); the aggregate retains the
// predeclared requirement to cover BOTH win and fail, plus pause/resume.
const trace={schema_version:3,integration_format:'game_js',requirements:{...requirements,required_branches:['end_card'],stage_index:1,play_round:1},records,tracking_requests,
  evidence:{source:'platform',operator:'human',complete:records.some(item=>item.message?.type==='result'),
    artifact_sha256:JSON.parse(fs.readFileSync('result/grill-sort-first-meal/manifest.json','utf8')).sha256,
    document_sha256:createHash('sha256').update(read('eventLogs.md')).digest('hex'),raw_log_path:'platform-raw.json'},
  errors:JSON.parse(read('browser-errors.json')),
  capture_notes:[
    'The UI does not export the exact shell initialization epoch; shell_started_at is intentionally absent.',
    'received_at and captured_at retain the UI export time columns in Asia/Shanghai. No timestamp has been rewritten to force a match.',
    'The debug parent observes calls a few milliseconds after the shell builds Tracking URLs; the fixed checker may flag these different clocks. Raw evidence is preserved.',
    'The independent preview operation is separate evidence and is not mixed into this official debug session.'
  ]};
fs.writeFileSync(path.join(dir,'platform-trace.json'),JSON.stringify(trace,null,2)+'\n');
console.log({records:records.length,requests:requests.length,dropped:records.filter(item=>item.accepted===false).length,terminal:trace.evidence.complete});
