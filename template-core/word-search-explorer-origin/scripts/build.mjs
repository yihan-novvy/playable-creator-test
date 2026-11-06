import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.resolve(root,'../../editor/templates/word-search-explorer-origin');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
const provenance=JSON.parse(read('source/provenance.json'));
for(const [file,hash] of Object.entries(provenance.files))if(sha(fs.readFileSync(path.join(root,'source',file)))!==hash)throw new Error('Frozen source changed: '+file);
const html=read('source/original.html');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m=>m[1]).filter(s=>s.trim());
if(scripts.length!==2)throw new Error('Expected boot helpers and one embedded Phaser payload');
let engine=scripts[1];
function patch(a,b){if(engine.split(a).length!==2)throw new Error('Patch anchor changed: '+a.slice(0,90));engine=engine.replace(a,b);}
function range(a,b,value){if(engine.split(a).length!==2||engine.split(b).length!==2)throw new Error('Range anchor changed: '+a);const start=engine.indexOf(a),end=engine.indexOf(b,start);if(end<start)throw new Error('Patch order');engine=engine.slice(0,start)+value+engine.slice(end);}
// The network launchers are packaging code, separate from Phaser and the puzzle.
range('const r={entry:','class et{',`function $A(){return {loadAssetsFromPath:false,handleOpenStore(){}};}class KA{isAvailable(){return false;}isReady(){return false;}}class tt extends KA{}`);
patch('return mraid.isViewable()','return false');
patch('return typeof mraid!="undefined"','return false');
patch('return typeof dapi!="undefined"','return false');
patch('parent.postMessage({missingFiles:this.filesFailedToLoad},"*")','window.WSE_CONTEXT.loadError(this.filesFailedToLoad)');
const autoplay='parent.postMessage({action:"autoplayFinished"},"*"),';
if(engine.split(autoplay).length!==4)throw new Error('Autoplay bridge anchor changed');
engine=engine.split(autoplay).join('');
patch('this.componentsReadyStatusMap=new Map,this.areComponentsReady', 'window.WSE_CONTEXT.configure(WA),this.componentsReadyStatusMap=new Map,this.areComponentsReady');
patch('He++,ai++,SA=0','He++,ai++,window.WSE_CONTEXT.step(He,js),SA=0');
patch('Ce.startAutoplay&&Ce.addActionsAndPlay()','Ce.startAutoplay&&Ce.addActionsAndPlay(),window.WSE_CONTEXT.ready(this,WA)');
patch('Kt=new mt','Kt=new mt,window.WSE_CONTEXT.attach(Kt)');
// Native components fit the available content area; the canvas remains full size.
patch("get BaseWidth(){let y;return _.has(this,\"options.shouldForcePortraitMode\")&&this.options.shouldForcePortraitMode&&this.scene.game.canvas.width>=this.scene.game.canvas.height?y=this.scene.game.canvas.height*(this.scene.game.canvas.height/this.scene.game.canvas.width):y=this.scene.game.canvas.width,y}get BaseLeftX(){return(this.scene.game.canvas.width-this.BaseWidth)*.5}",'get BaseWidth(){return window.WSE_CONTEXT.bounds(this).width}get BaseLeftX(){return window.WSE_CONTEXT.bounds(this).left}');
patch('this.RelativeY*this.scene.game.canvas.height-.5*this.AbsoluteHeight','window.WSE_CONTEXT.bounds(this).top+this.RelativeY*window.WSE_CONTEXT.bounds(this).height-.5*this.AbsoluteHeight');
patch('y=this.RelativeHeight*this.scene.game.canvas.height','y=this.RelativeHeight*window.WSE_CONTEXT.bounds(this).height');
patch('y=this.RelativeX*this.BaseWidth:y=this.parent.LeftAbsoluteX','y=this.BaseLeftX+this.RelativeX*this.BaseWidth:y=this.parent.LeftAbsoluteX');
patch('y=this.RelativeY*this.scene.game.canvas.height:y=this.parent.TopAbsoluteY','y=window.WSE_CONTEXT.bounds(this).top+this.RelativeY*window.WSE_CONTEXT.bounds(this).height:y=this.parent.TopAbsoluteY');
range('class Vt extends P{','class Jt extends P{',`class Vt extends P{
constructor(y){super(y),this.drawSpecificBoundsReferenceRectangle=false,this.drawReferenceRectangle=false;}
load(){super.load();this.onReady();}
getSpecificBounds(){return window.WSE_CONTEXT.contentBounds(this);}
get AbsoluteWidth(){return this.getSpecificBounds().width;}
get AbsoluteHeight(){return this.getSpecificBounds().height;}
get BaseWidth(){return this.getSpecificBounds().width;}
get BaseLeftX(){return this.getSpecificBounds().leftX;}
get LeftAbsoluteX(){return this.getSpecificBounds().leftX;}
get TopAbsoluteY(){return this.getSpecificBounds().topY;}
getX(){return this.getWidth()*.5;}getY(){return this.getHeight()*.5;}
render(){if(_.has(this,"onRender"))this.onRender({componentId:this.componentId});}
}`);
patch('k=w*.5,Y=Z*.5','k=window.WSE_CONTEXT.bounds(this).left+w*.5,Y=window.WSE_CONTEXT.bounds(this).top+Z*.5');
// All store behaviors are owned by the assembly shell; no native hit areas remain.
range('openStore(){console.debug("OPEN STORE");','getStoreUrlByPlatform(y){','openStore(){}');
const data={engine};
const game='(function(){\n'+read('src/engine-scope.js').replace(/^export /gm,'')+'\nconst SOURCE='+JSON.stringify(data)+';\n'+read('src/game.js')+'\n})();\n';
for(const forbidden of [/postMessage/,/messageHandlers/,/NovvyPlayable/,/NovvyAnalytics/,/NovvyShell/,/tracking\.novvy\.ai/,/window\.open\(/,/mraid\./])if(forbidden.test(game))throw new Error('Forbidden game dependency '+forbidden);
const icon=html.match(/<img[^>]*src="data:image\/([^;]+);base64,([^"\s]+)"/);
if(!icon)throw new Error('Loading brand icon missing');
const files={'game/game.js':game,'game/index.html':read('src/index.html'),'game/host.js':read('src/host.js'),'game/cta-icon.png':Buffer.from(icon[2],'base64'),'source/provenance.json':JSON.stringify(provenance,null,2)+'\n'};
const manifest={id:'word-search-explorer-origin',name:'Word Search Explorer · 原版网格找词',version:'1.0.0',entry:'game/index.html',levels:[{id:1,name:'7×11 网格 · 17 项找词目标',game:'game/game.js'}],constants:{game:{host:'game/host.js',hudInsideCanvas:true,ctaCard:{name:'Word Search Explorer',icon:'game/cta-icon.png'}},fileHashes:Object.fromEntries(Object.entries(files).map(([name,value])=>[name,sha(value)]))}};
fs.mkdirSync(output,{recursive:true});for(const [name,value] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(output,name)),{recursive:true});fs.writeFileSync(path.join(output,name),value);}fs.writeFileSync(path.join(output,'game-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Built Word Search Explorer: frozen Phaser puzzle, 17 original targets');
