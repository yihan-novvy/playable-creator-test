import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const read = name => fs.readFileSync(new URL(name, import.meta.url), 'utf8');
function once(source, anchor, replacement) {
  if (source.split(anchor).length !== 2) throw new Error('Standalone source anchor changed: ' + anchor.slice(0, 100));
  return source.replace(anchor, () => replacement);
}
export function compileStandalone(root, files, scriptNames) {
  const id = path.basename(root).replace(/-origin$/, '');
  const local = name => fs.readFileSync(path.join(root, 'src', name), 'utf8');
  let html = files['game/index.html'], resources = {}, code, prelude = '';
  let css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  css = css.replace(/\s*#novvy[^{}]*\{[^{}]*\}/g, '').replace(/:root|html|body/g, '.engine-root').replace(/position:\s*fixed/g, 'position:absolute');
  let markup = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<!--[\s\S]*?-->/g, '').replace(/ data-novvy-replay/g, '');
  if (id === 'grill-sort') markup = html.match(/<script type="systemjs-importmap">[\s\S]*?<\/script>/)[0] + markup;
  let adapter = local('standalone-adapter.js');
  let layout = files['game/layout.js'] || '';
  if (id === 'tasty-travels') {
    // Keep the legacy HTML template intact and preserve its English creative
    // in the standalone adapter, including embedded order artwork.
    const start = layout.indexOf('      // SetLabel uses these settings');
    const end = layout.indexOf('      var originalBgm', start);
    if (start < 0 || end < start) throw new Error('Tasty locale seam changed');
    layout = local('standalone-language.js') + '\n' + layout.slice(0, start) +
      '      window.__TASTY_LANGUAGE__.install(requireModule);\n' + layout.slice(end);
  }
  layout = layout.replace(/    var card = document.getElementById\('novvy-cta'\);\n    if \(card[^\n]*\n/g, '');
  layout = layout.replace(/(getPropertyValue\('--(?:origin|tasty)-(?:hud|cta)-space'\)\) \|\| )\d+/g, '$10');
  if (id === 'tasty-travels' || id === 'grill-sort') {
    const context = {window: {}};
    vm.runInNewContext(files['game/assets.js'], context);
    resources = context.window.__res || context.window.playableres;
    for (const [key, value] of Object.entries(resources)) {
      if (!key.endsWith('.js')) continue;
      // Generic engine URL helpers are unused by these games. The native
      // conversion callbacks are handled separately by the game adapter.
      resources[key] = value.replaceAll('window.open(t)', 'void 0');
      if (id === 'grill-sort') resources[key] = resources[key].replace(/this\._openDataContext\.postMessage\(\{fromEngine:!0,type:"engine",event:"viewport",x:u,y:l,width:c,height:f\}\)/g, 'void 0');
    }
    const assets = `window.${id === 'tasty-travels' ? '__res' : 'playableres'}=window.ORIGIN_RESOURCES;`;
    code = [assets, ...scriptNames.filter(n => !['game/assets.js','game/layout.js'].includes(n)).map(n => files[n]), layout, adapter, local('standalone-boot.js')].join('\n');
  } else if (id === 'freecell') {
    let vendor = files['game/vendor.js'];
    // core-js's legacy immediate scheduler uses messaging only as a timer
    // fallback. Use the instance's tracked timeout in this browser runtime.
    const from = 'else if(c){y=new c;m=y.port2;y.port1.onmessage=x;g=n(m.postMessage,m,1)}else if(s.addEventListener&&typeof postMessage=="function"&&!s.importScripts){g=function(t){s.postMessage(t+"","*")};s.addEventListener("message",x,false)}';
    vendor = once(vendor, from, '');
    prelude = vendor;
    const scripts = scriptNames.filter(n => !['game/vendor.js','game/layout.js'].includes(n)).map(n => files[n]);
    // The source editor creates classes by name with Function(). Expose only
    // its declared constructors in this instance, without polluting the host.
    const names = [...new Set(scripts.flatMap(text => [...transformSync(text).code.matchAll(/^(?:var|let|const|class|function)\s+([\w$]+)/gm)].map(m => m[1])))];
    const expose = 'Object.assign(window,{' + names.join(',') + '});';
    code = [...scripts, expose, layout, adapter, local('standalone-boot.js')].join('\n');
  } else {
    // Drop the bundled advertising-network bridge wholesale. The native
    // engine already handles an absent bridge and the public lifecycle below.
    const assets = files['game/assets.js'].split(';"use strict";')[0] + ';';
    let core = files['game/core.js'];
    const store = /function Fo\(r,e=\{\}\)\{[^}]*\}/;
    if ((core.match(store) || [])[0]?.includes('window.open') !== true) throw new Error('Block Out store seam changed');
    core = core.replace(store, 'function Fo(r,e={}){return window.__BLOCK_OUT_ADAPTER__.openStore(e)}');
    core = once(core, 'pointerDown(A){A.stopPropagation(),Fo(p.links)}', 'pointerDown(A){A.stopPropagation(),Fo(p.links,{placement:this.params.sceneType==="game"?"logo":"end-logo"})}');
    core = once(core, 'onClick(){Fo(this.links)}', 'onClick(){Fo(this.links,{placement:"end-button"})}');
    core = once(core, 'function ji(r,e){var A;r.requestId&&((A=window.parent)==null||A.postMessage({type:"dashboard_tool_response",requestId:r.requestId,action:r.action,...e},"*"))}', 'function ji(){}');
    core = once(core, 'window.parent&&window.parent!==window&&window.parent.postMessage({type:"game_started"},"*")', 'void 0');
    // Unused compressed-texture workers are not part of this PNG/JPEG game.
    // Remove their source strings, rather than retaining alternate transports.
    core = once(core, 'preferWorkers:!0,preferCreateImageBitmap:!0', 'preferWorkers:!1,preferCreateImageBitmap:!1');
    for (let index; (index = core.indexOf('      self.postMessage(')) !== -1;) {
      const start = core.lastIndexOf('`', index), end = core.indexOf('`', index);
      if (start < 0 || end < 0) throw new Error('Compressed texture worker boundary changed');
      core = core.slice(0, start) + '``' + core.slice(end + 1);
    }
    for (const call of ['e.postMessage({data:A.arguments,uuid:cS++,id:t})','za.postMessage({type:"init",jsUrl:Bc.jsUrl,wasmUrl:Bc.wasmUrl,supportedTextures:r})','A.postMessage({type:"load",url:r})','qa.postMessage({type:"init",jsUrl:Cc.jsUrl,wasmUrl:Cc.wasmUrl,supportedTextures:r})']) {
      core = core.replaceAll(call, '(()=>{throw new Error("Compressed texture workers are not included in this embedded game")})()');
    }
    markup += local('standalone-result.html');
    css += local('standalone-result.css');
    code = [assets, adapter, core].join('\n');
  }
  const panel = {'tasty-travels':'tasty','grill-sort':'grill',freecell:'freecell','block-out':'block-out'}[id];
  markup = once(markup, `id="${panel}-replay"`, `id="${panel}-replay" data-origin-replay`);
  markup = markup.replace(new RegExp(`(<button[^>]+id="${panel}-replay"[^>]*>[\\s\\S]*?<\\/button>)`), '$1<button type="button" data-origin-continue hidden>Continue</button>');
  if (!markup.includes('data-origin-continue')) throw new Error('Missing native result panel: ' + id);
  css += '\n[data-origin-continue]{display:block;margin:12px auto 0;border:1px solid currentColor;border-radius:12px;padding:10px 24px;background:transparent;color:inherit;font:inherit;cursor:pointer;touch-action:manipulation}[data-origin-continue][hidden]{display:none}[data-origin-continue]:disabled{opacity:.65}';
  const settings = {intro:false, story:false, title:false, policy:{mode:'none'}, gameplay:{allowReplay:id==='grill-sort', ...(id==='grill-sort'?{countdownSeconds:180}:{}), ...(id==='tasty-travels'?{spawnTierOffset:0}:{})}};
  if (id === 'tasty-travels') settings.localizedImages = [...new Set(Object.values(JSON.parse(resources['assets/resources/config.json']).paths).map(entry => entry[0]))];
  const source = {title:id, levelCount:id==='block-out'?2:1, markup, css, resources, settings, placements:{}, prelude, code};
  new vm.Script(code);
  const scope = read('engine-scope.js').replace(/^export /gm, '');
  const entry = read('game.js').replace('gameplay: {...SOURCE.settings.gameplay}', 'gameplay: {...GAME_CONFIG}');
  const game = '(function(){\n' + scope + '\nconst SOURCE=' + JSON.stringify(source) + ';\nconst GAME_CONFIG=/*ORIGIN_GAME_CONFIG*/' + JSON.stringify(settings.gameplay) + ';\n' + entry + '\n})();\n';
  for (const pattern of [/NovvyPlayable|NovvyAnalytics|NovvyShell|__novvy/, /getElementById\(["']novvy/, /webkit\.messageHandlers/, /tracking\.novvy\.ai/, /postMessage/, /window\.open\(/]) {
    const match = pattern.exec(game);
    if (match) throw new Error(id + ': forbidden standalone dependency ' + pattern + ': ' + game.slice(match.index - 80, match.index + 150));
  }
  new vm.Script(game);
  // Keep the source map embedded as data and preserve names used by native DI.
  return game;
}
