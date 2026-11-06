import {inflateRawSync} from 'node:zlib';

// Read only the frozen creative's embedded model, without executing its engine.
export function candyModel(source){
  const matches=[...source.matchAll(/const t=\{zip:"([A-Za-z0-9+/=]+)"/g)];
  if(matches.length!==1)throw new Error('Embedded archive anchor changed');
  const zip=Buffer.from(matches[0][1],'base64');
  let end=zip.length-22;
  while(end>=0&&zip.readUInt32LE(end)!==0x06054b50)end--;
  if(end<0)throw new Error('Missing ZIP directory');
  let cursor=zip.readUInt32LE(end+16),world;
  for(let i=0;i<zip.readUInt16LE(end+10);i++){
    if(zip.readUInt32LE(cursor)!==0x02014b50)throw new Error('Invalid ZIP entry');
    const method=zip.readUInt16LE(cursor+10),size=zip.readUInt32LE(cursor+20),rawSize=zip.readUInt32LE(cursor+24),len=zip.readUInt16LE(cursor+28),extra=zip.readUInt16LE(cursor+30),comment=zip.readUInt16LE(cursor+32),offset=zip.readUInt32LE(cursor+42);
    const name=zip.subarray(cursor+46,cursor+46+len).toString();cursor+=46+len+extra+comment;
    if(name!=='world.glb')continue;
    const begin=offset+30+zip.readUInt16LE(offset+26)+zip.readUInt16LE(offset+28),compressed=zip.subarray(begin,begin+size);
    world=method===8?inflateRawSync(compressed,{maxOutputLength:3000000}):method===0?compressed:null;
    if(!world||world.length!==rawSize)throw new Error('Invalid model bytes');
  }
  if(!world||world.readUInt32LE(0)!==0x46546c67||world.readUInt32LE(16)!==0x4e4f534a)throw new Error('Missing GLB JSON');
  const model=JSON.parse(world.subarray(20,20+world.readUInt32LE(12)).toString());
  const balls=model.nodes.filter(node=>node.name==='сolorbomb');
  if(balls.length!==1)throw new Error('Candy ball changed');
  const children=balls[0].children.map(id=>model.nodes[id]);
  const candies=children.filter(node=>/^сolorbombCandy_[bgprwy]_/.test(node.name)&&Number.isInteger(node.mesh));
  if(candies.length!==children.length-1||children.filter(node=>node.name==='сolorbombBg').length!==1)throw new Error('Candy/background inventory changed');
  return {world,model,candies,maxHits:candies.length};
}
