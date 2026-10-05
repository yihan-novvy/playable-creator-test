import { createGame } from './create-game.js';
import DEFAULT_LEVEL from './level.json';
import './ad.css';

// Standalone ad shell, file://-safe: no runtime fetches at all. The default
// level ships inside game.js; an inline `window.__WATER_SORT_LEVEL__` script
// placed before game.js overrides it (per-task injection / single-file use).
const $ = id => document.getElementById(id);
let game = null;
let wasWon = false;
try {
  game = createGame({
    host: $('scene'),
    level: window.__WATER_SORT_LEVEL__ ?? DEFAULT_LEVEL,
    // Wholehouse 覆盖层占用的竖直比例:顶部 hud(标题+进度条,宽 88dvw、
    // 高约 16%)与底部 cta 下载卡(约 15%),画布被悬浮其上,瓶子须排进中间。
    insets: { top: .18, bottom: .16 },
    ui: {
      onStatus: text => { $('status').textContent = text; },
      onState: ({ canUndo, busy, won, sorted, colors }) => {
        $('undo').disabled = !canUndo;
        $('reset').disabled = busy;
        $('win').hidden = !won;
        // HUD 进度条契约:归位比例每次状态变化广播,胜利上升沿单独广播。
        // bubbles 必须开启:监听方(hud.js)挂在 window 上,事件从 document
        // 冒泡过去;不冒泡的自定义事件对 window 不可见。
        if (colors > 0) {
          document.dispatchEvent(new CustomEvent('novvy:hud-progress', { bubbles: true, detail: { percent: Math.round((sorted / colors) * 100) } }));
        }
        if (won && !wasWon) document.dispatchEvent(new CustomEvent('novvy:victory', { bubbles: true }));
        wasWon = won;
      },
    },
  });
} catch (error) { $('status').textContent = error.message; }
$('undo').onclick = () => game?.undo();
$('reset').onclick = $('again').onclick = () => game?.reset();
