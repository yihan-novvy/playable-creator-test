const $=id=>document.getElementById(id);
let catalog=[],draft=null,brush=1,tool='draw',selectedPart=null,history=[],future=[],dirty=false,completed=true,timer,revision=0,loadRevision=0,pointer=null;
const pitch=18,copy=value=>structuredClone(value);
const currentPicture=()=>catalog.find(p=>p.id===$('pattern').value);
const parts=()=>currentPicture()?.editableParts??[];
async function request(url,options){const response=await fetch(url,options);const data=await response.json();if(!response.ok)throw new Error(data.error?.message??'请求失败');return data;}
function status(text,error=false){$('status').textContent=text;$('status').className=error?'error':'';}
function remember(){history.push(copy(draft));if(history.length>60)history.shift();future=[];}
function changed(resetOpening=false){if(resetOpening)draft.opening=null;dirty=true;$('dirty').textContent='未保存的修改';render();clearTimeout(timer);timer=setTimeout(preview,650);}
function syncFields(){$('opening-mode').value=draft.openingMode??'scattered';$('difficulty-field').style.display=draft.openingMode==='easy'?'none':'flex';$('mode-hint').textContent=draft.openingMode==='easy'?'打乱四块连续的大区域，验证最多 6 次搬运可完成。选择“试玩开局”查看整块错位效果。':'随机交换分散的珠子；打散对数越高，碎块越多。';for(const id of ['name','width','height','capacity','trayCols','difficulty','seed'])$(id).value=draft[id];$('json').value=JSON.stringify(draft,null,2);$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
function setTool(value){tool=value;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));$('board').style.cursor=tool==='move'?'grab':'crosshair';}
function renderPalette(){const root=$('palette');root.replaceChildren();for(const [id,color]of Object.entries(draft.colors)){
 const wrap=document.createElement('div');wrap.className='swatch-wrap';const button=document.createElement('button');button.className='swatch';button.style.background=color;button.title=draft.colorNames?.[id]??'颜色 '+id;button.setAttribute('aria-label','画笔颜色 '+id);button.setAttribute('aria-pressed',String(Number(id)===brush));button.onclick=()=>{brush=Number(id);setTool('draw');renderPalette();};
 const picker=document.createElement('input');picker.type='color';picker.value=color;picker.setAttribute('aria-label','调整颜色 '+id);picker.onchange=()=>{remember();draft.colors[id]=picker.value;changed();};wrap.append(button,picker);root.append(wrap);
 }const add=document.createElement('button');add.textContent='+ 新颜色';add.disabled=Object.keys(draft.colors).length>=16;add.onclick=()=>{remember();let id=1;while(draft.colors[id])id++;draft.colors[id]='#66bd9e';brush=id;setTool('draw');changed();};root.append(add);}
function transform(id){return draft.decorations?.[id]??{offsetX:0,offsetY:0,scale:1};}
function anchor(part){const scale=Math.min(3,33/Math.max(draft.width,draft.height)),t=transform(part.id);return {x:(part.x-780)/(39.2*scale)+(draft.width-1)/2+.5+t.offsetX,y:(part.y-1441)/(39.2*scale)+(draft.height-1)/2+.5+t.offsetY,scale};}
function renderParts(){const root=$('parts');root.replaceChildren();for(const part of parts()){const b=document.createElement('button');b.textContent=part.name;b.classList.toggle('active',part.id===selectedPart);b.onclick=()=>{selectedPart=part.id;setTool('move');renderParts();draw();};root.append(b);}
 if(!parts().length){root.textContent='此图案目前没有额外装饰，直接编辑格子即可。';selectedPart=null;}
 $('part-fields').style.display=selectedPart?'grid':'none';$('reset-part').hidden=!selectedPart;if(selectedPart){const t=transform(selectedPart);$('offsetX').value=t.offsetX;$('offsetY').value=t.offsetY;$('part-scale').value=t.scale;}}
function drawDecoration(ctx,part){const a=anchor(part),t=transform(part.id),unit=pitch/(39.2*a.scale);ctx.save();ctx.translate(a.x*pitch,a.y*pitch);ctx.scale(t.scale*unit,t.scale*unit);ctx.lineCap='round';
 if(part.id.startsWith('eye-')){ctx.fillStyle='#080a0f';ctx.beginPath();ctx.ellipse(0,0,40,50,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.beginPath();ctx.arc(-12,-17,7,0,Math.PI*2);ctx.fill();}
 if(part.id==='nose'){ctx.fillStyle='#ff83ad';ctx.beginPath();ctx.moveTo(-25,-8);ctx.quadraticCurveTo(0,-20,25,-8);ctx.quadraticCurveTo(10,20,0,16);ctx.quadraticCurveTo(-10,20,-25,-8);ctx.fill();}
 if(part.id==='mouth'){ctx.strokeStyle='#18110f';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,-15);ctx.quadraticCurveTo(-18,30,-50,5);ctx.moveTo(0,-15);ctx.quadraticCurveTo(20,30,60,4);ctx.stroke();}
 if(part.id==='whiskers'){ctx.strokeStyle='#18110f';ctx.lineWidth=9;for(const [x,y,ex,ey]of [[-327,-52,-453,-62],[-329,1,-457,1],[-323,47,-441,84],[323,-52,472,-64],[327,0,478,1],[321,49,465,91]]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();}}
 if(part.id==='bow'){ctx.fillStyle='#039def';ctx.strokeStyle='#0064ae';ctx.lineWidth=10;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*15,-20);ctx.lineTo(side*120,-55);ctx.quadraticCurveTo(side*150,0,side*120,55);ctx.lineTo(side*15,20);ctx.closePath();ctx.fill();ctx.stroke();}ctx.beginPath();ctx.ellipse(0,0,23,25,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
 ctx.restore();if(selectedPart===part.id){ctx.save();ctx.strokeStyle='#5279e2';ctx.lineWidth=2;ctx.setLineDash([5,4]);const radius=Math.max(12,part.id==='bow'?66*unit*t.scale:32*unit*t.scale);ctx.strokeRect(a.x*pitch-radius,a.y*pitch-radius,radius*2,radius*2);ctx.setLineDash([]);ctx.fillStyle='#426cdb';ctx.beginPath();ctx.arc(a.x*pitch,a.y*pitch,4,0,Math.PI*2);ctx.fill();ctx.restore();}}
function sizeCanvas(){if(!draft)return;const canvas=$('board'),wrap=canvas.parentElement,rect=wrap.getBoundingClientRect(),style=getComputedStyle(wrap);
 const width=rect.width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-parseFloat(style.borderLeftWidth)-parseFloat(style.borderRightWidth);
 const height=rect.height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-parseFloat(style.borderTopWidth)-parseFloat(style.borderBottomWidth);
 // 100% fits the entire grid in both dimensions; larger zooms allow scrolling.
 const scale=Math.min(width/draft.width,height/draft.height)*Number($('zoom').value)/100;
 canvas.style.width=Math.max(1,Math.floor(draft.width*scale))+'px';canvas.style.height=Math.max(1,Math.floor(draft.height*scale))+'px';
 $('zoom-value').textContent=$('zoom').value+'%';
 if(Number($('zoom').value)<=100){wrap.scrollTop=0;wrap.scrollLeft=0;}}
function draw(){if(!draft)return;const canvas=$('board');canvas.width=draft.width*pitch;canvas.height=draft.height*pitch;sizeCanvas();const ctx=canvas.getContext('2d');ctx.fillStyle='#87929e33';ctx.fillRect(0,0,canvas.width,canvas.height);
 draft.target.forEach((color,i)=>{const col=i%draft.width,row=Math.floor(i/draft.width),x=col*pitch,y=row*pitch;if(color){ctx.fillStyle=draft.colors[color];ctx.fillRect(x+1,y+1,pitch-2,pitch-2);ctx.fillStyle='#ffffff40';ctx.fillRect(x+2,y+2,pitch-4,1);}else{ctx.fillStyle=(col+row)%2?'#bec5cd33':'#a8afb84d';ctx.fillRect(x+1,y+1,pitch-2,pitch-2);}});
 if($('show-parts').checked)for(const part of parts())drawDecoration(ctx,part);
 $('cell-info').textContent=`${draft.width} × ${draft.height} 格 · ${draft.target.filter(Boolean).length} 颗珠子`;}
function render(){syncFields();renderPalette();renderParts();draw();}
function point(e){const r=$('board').getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*draft.width,y:(e.clientY-r.top)/r.height*draft.height};}
function applyCell(p){const x=Math.floor(p.x),y=Math.floor(p.y);if(x<0||y<0||x>=draft.width||y>=draft.height)return;const index=y*draft.width+x;
 if(tool==='pick'){if(draft.target[index])brush=draft.target[index];setTool('draw');renderPalette();return;}
 const color=tool==='erase'?0:brush;if(draft.target[index]===color)return;
 if(tool==='fill'){const source=draft.target[index],queue=[index],seen=new Set();while(queue.length){const i=queue.pop();if(seen.has(i)||draft.target[i]!==source)continue;seen.add(i);draft.target[i]=color;const col=i%draft.width;if(col>0)queue.push(i-1);if(col<draft.width-1)queue.push(i+1);if(i>=draft.width)queue.push(i-draft.width);if(i<draft.target.length-draft.width)queue.push(i+draft.width);}}else draft.target[index]=color;
 draft.opening=null;dirty=true;draw();}
$('board').onpointerdown=e=>{if(!draft)return;const p=point(e);if(tool==='move'){
 if(!selectedPart){const hits=parts().map(part=>({part,a:anchor(part)})).sort((a,b)=>Math.hypot(a.a.x-p.x,a.a.y-p.y)-Math.hypot(b.a.x-p.x,b.a.y-p.y));if(!hits.length)return;selectedPart=hits[0].part.id;renderParts();}
 remember();pointer={start:p,t:copy(transform(selectedPart)),move:true};
 }else{if(tool!=='pick')remember();pointer={move:false,pick:tool==='pick'};applyCell(p);} $('board').setPointerCapture(e.pointerId);};
$('board').onpointermove=e=>{if(!pointer)return;const p=point(e);if(pointer.move){draft.decorations??={};draft.decorations[selectedPart]={...pointer.t,offsetX:Math.max(-40,Math.min(40,Math.round((pointer.t.offsetX+p.x-pointer.start.x)*10)/10)),offsetY:Math.max(-40,Math.min(40,Math.round((pointer.t.offsetY+p.y-pointer.start.y)*10)/10))};dirty=true;renderParts();draw();}else if(!pointer.pick&&tool!=='fill')applyCell(p);};
$('board').onpointerup=$('board').onpointercancel=()=>{if(!pointer)return;const edited=!pointer.pick;pointer=null;if(edited)changed();};
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));$('zoom').oninput=sizeCanvas;$('show-parts').onchange=draw;
new ResizeObserver(sizeCanvas).observe($('board').parentElement);
$('undo').onclick=()=>{if(!history.length)return;future.push(copy(draft));draft=history.pop();dirty=true;render();$('dirty').textContent='未保存的修改';clearTimeout(timer);timer=setTimeout(preview,650);};
$('redo').onclick=()=>{if(!future.length)return;history.push(copy(draft));draft=future.pop();changed();};
for(const [id,key]of [['offsetX','offsetX'],['offsetY','offsetY'],['part-scale','scale']]){
 const update=()=>{const raw=$(id).value,value=Number(raw);if(raw===''||!Number.isFinite(value)||value<(key==='scale'?.1:-40)||value>(key==='scale'?4:40)||!selectedPart)return;
 if(value===transform(selectedPart)[key])return;
 remember();const next={...transform(selectedPart),[key]:value};draft.decorations??={};draft.decorations[selectedPart]=next;changed();};
 $(id).addEventListener('input',update);$(id).addEventListener('change',update);
}
$('reset-part').onclick=()=>{remember();if(draft.decorations)delete draft.decorations[selectedPart];changed();};
for(const id of ['name','width','height','capacity','trayCols','difficulty','seed'])$(id).onchange=()=>{const value=id==='name'?$(id).value:Number($(id).value);if(id!=='name'&&(!Number.isInteger(value)||value<Number($(id).min)||value>Number($(id).max))){syncFields();return;}remember();if(id==='width'||id==='height'){const ow=draft.width,oh=draft.height,old=draft.target;draft[id]=value;draft.target=Array.from({length:draft.width*draft.height},(_,i)=>{const x=i%draft.width,y=Math.floor(i/draft.width);return x<ow&&y<oh?old[y*ow+x]:0;});}else draft[id]=value;changed(id!=='name');};
$('opening-mode').onchange=()=>{remember();draft.openingMode=$('opening-mode').value;showOpening();changed(true);};
function showOpening(){completed=false;$('play').classList.add('active');$('completed').classList.remove('active');}
$('shuffle').onclick=()=>{remember();draft.seed=(draft.seed+1)%2147483648;showOpening();changed(true);};
async function preview(){if(!draft)return;clearTimeout(timer);const rev=++revision;$('preview-state').textContent='正在更新真实游戏预览…';try{const response=await fetch(`/api/patterns/${$('pattern').value}/preview?completed=${completed?1:0}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});if(!response.ok){const error=await response.json();throw new Error(error.error?.message??'预览失败');}const moves=response.headers.get('X-Colorever-Solution-Moves'),html=await response.text();if(rev!==revision)return;$('preview').srcdoc=html;$('preview-state').textContent=(dirty?'当前显示未保存的草稿':'当前显示已保存的模板')+(draft.openingMode==='easy'&&moves?` · 开局验证 ${moves} 次搬运可完成`:'');}catch(error){if(rev===revision)$('preview-state').textContent='预览未更新：'+error.message;}}
async function load(){const rev=++loadRevision;++revision;clearTimeout(timer);const id=$('pattern').value,level=await request('/api/patterns/'+id);if(rev!==loadRevision)return;draft=level;brush=Number(Object.keys(draft.colors)[0]);selectedPart=null;history=[];future=[];dirty=false;$('dirty').textContent='已保存';$('description').textContent=currentPicture().description;$('module').textContent=`专属装饰代码：colorever/src/patterns/${currentPicture().module}。新增造型由作者或 AI 修改该模块后运行 npm run build:template。`;setTool('draw');status('已读取模板。修改只保存在草稿，点击保存才生效。');render();await preview();}
$('pattern').onchange=()=>load().catch(e=>status(e.message,true));$('reload').onclick=()=>load().catch(e=>status(e.message,true));
$('save').onclick=async()=>{const id=$('pattern').value,submitted=JSON.stringify(draft);$('save').disabled=true;try{const saved=await request('/api/patterns/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:submitted});if(id===$('pattern').value&&JSON.stringify(draft)===submitted){draft=saved;dirty=false;$('dirty').textContent='已保存';render();}status('已保存到 colorever。运行 npm run build:template 后广告项目才能使用新版本。');await preview();}catch(e){status(e.message,true);}finally{$('save').disabled=false;}};
$('play').onclick=()=>{completed=false;$('play').classList.add('active');$('completed').classList.remove('active');preview();};$('completed').onclick=()=>{completed=true;$('completed').classList.add('active');$('play').classList.remove('active');preview();};
$('apply-json').onclick=async()=>{try{const {validateLevel}=await import('/src/level.js');const next=validateLevel(JSON.parse($('json').value));if(next.decoration!==draft.decoration)throw new Error('不能替换专属装饰模块');remember();draft=next;changed();}catch(e){status(e.message,true);}};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=$('pattern').value+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
(async()=>{catalog=await request('/api/patterns');for(const p of catalog){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;$('pattern').append(o);}await load();})().catch(e=>status(e.message,true));
