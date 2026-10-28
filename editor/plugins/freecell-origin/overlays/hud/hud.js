/* HUD 标题运行时填空:包内壳跨任务一致(注入时占位符清空),真实文案由
   打包/预览注入的 window.__NOVVY_UI__.hud 套用——与各模板 hud.js 同构。 */
(function () {
  var root = document.getElementById('novvy-training-hud');
  if (!root) return;
  var ui = window.__NOVVY_UI__ && window.__NOVVY_UI__.hud;
  if (ui && typeof ui.ariaLabel === 'string' && ui.ariaLabel) root.setAttribute('aria-label', ui.ariaLabel);
  var line1 = document.getElementById('novvy-hud-title-line1');
  var line2 = document.getElementById('novvy-hud-title-line2');
  if (!ui) return;
  if (line1 && typeof ui.titleLine1 === 'string') line1.textContent = ui.titleLine1;
  if (line2 && typeof ui.titleLine2 === 'string') line2.textContent = ui.titleLine2;
})();
