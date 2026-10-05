import { validateLevel } from './game.js';
import { createGame } from './create-game.js';
import DEFAULT_LEVEL from './level.json';
import './style.css';

// Dev workshop shell: the full page (level editor, stats, swatches) around the
// shared game core. The standalone ad shell lives in ad-main.js.
const $ = id => document.getElementById(id);
const game = createGame({
  host: $('scene'),
  level: null,
  ui: {
    onStatus: text => { $('status').textContent = text; },
    onLevel: level => {
      $('level-name').textContent = level.name || level.id || 'Custom level';
      $('bottle-count').textContent = level.bottles.length;
      $('color-count').textContent = Object.keys(level.colors).length;
      $('capacity-count').textContent = level.capacity;
      $('swatches').replaceChildren(...Object.entries(level.colors).map(([name, color]) => {
        const element = document.createElement('span');element.className = 'swatch';element.style.background = color;element.title = `${name} · ${color}`;return element;
      }));
    },
    onState: ({ moves, canUndo, busy, won }) => {
      $('moves').textContent = String(moves).padStart(2, '0');
      $('undo').disabled = !canUndo;
      $('reset').disabled = busy; $('apply').disabled = busy;
      $('win').hidden = !won;
    },
  },
});
$('undo').onclick = () => game.undo();
$('reset').onclick = $('again').onclick = () => game.reset();
$('apply').onclick = () => {try{game.load(JSON.parse($('editor').value));$('error').textContent='';}catch(error){$('error').textContent=error.message;}};
$('download').onclick = () => {try{const data=validateLevel(JSON.parse($('editor').value));const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='level.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('error').textContent='';}catch(error){$('error').textContent=error.message;}};
$('editor').value = JSON.stringify(DEFAULT_LEVEL, null, 2);
game.load(DEFAULT_LEVEL);
