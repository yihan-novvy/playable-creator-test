import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareLevel,validateLevel} from '../src/level.js';
const root=fileURLToPath(new URL('../',import.meta.url));
// 图案模板只导出标准图案(target/色板/篮子/装饰):开局统一由广告任务在广告
// 编辑器中决定,模板里的 openingMode/difficulty/seed 仅作为演示与离线样例的
// 默认参数,不再烘焙具体开局。
export async function compilePatterns(){
 const catalog=JSON.parse(await fs.readFile(path.join(root,'src/patterns/catalog.json'),'utf8'));
 const result=[];
 for(const picture of catalog){
  if(!/^[a-z][a-z0-9-]*$/.test(picture.id)||!/^[-a-z0-9]+\.json$/.test(picture.level)||!/^[-a-z0-9]+\.js$/.test(picture.module))throw new Error('Invalid picture catalog entry');
  const level=validateLevel({...JSON.parse(await fs.readFile(path.join(root,'src/patterns',picture.level),'utf8')),opening:null});
  result.push({id:picture.id,name:picture.name,description:picture.description,module:picture.module,level});
 }
 return result;
}
// 离线样例的兜底关卡在构建期用模板自带参数解析开局;广告包不走该兜底——
// 广告任务注入的开局永远来自任务配置。
export function resolveOpenings(pictures){
 return pictures.map(picture=>({...picture,level:prepareLevel({...picture.level}).level}));
}
// 引擎包不再携带任何图案数据与装饰代码:关卡由注入提供,装饰按选择以
// decorators/<id>.js 片段内联(见 build-decorators.mjs)。构建期用空注册表
// 遮蔽 src/patterns/index.js,保证真文件(54 份 import)永不进 game.js——
// 新增图案不再改变引擎字节与 engineSha256。真实注册表仅服务 vite dev。
export function patternRegistry(){
 return 'export const patterns={};';
}
