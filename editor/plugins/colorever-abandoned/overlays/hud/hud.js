(function () {
  var START = 10;
  var progress = START;
  var correct = null;
  var total = null;
  var root = document.getElementById('novvy-training-hud');
  var label = document.getElementById('novvy-hud-progress-label');

  // Package mode ships the shell byte-identical across tasks: the title, aria
  // texts and the start percent live in the window.__NOVVY_UI__ head script
  // and are applied here. Colorever supplies the actual homed bead count
  // and total alongside the percent used by the analytics listener.
  var ui = window.__NOVVY_UI__ && window.__NOVVY_UI__.hud;
  if (ui && typeof ui.progressStart === 'number') START = ui.progressStart;
  progress = START;
  if (root && ui) {
    var line1 = document.getElementById('novvy-hud-title-line1');
    var line2 = document.getElementById('novvy-hud-title-line2');
    if (line1 && typeof ui.titleLine1 === 'string') line1.textContent = ui.titleLine1;
    if (line2 && typeof ui.titleLine2 === 'string') line2.textContent = ui.titleLine2;
    if (typeof ui.ariaLabel === 'string') root.setAttribute('aria-label', ui.ariaLabel);
  }
  window.addEventListener('novvy:phase2-start', function (event) {
    var title = event.detail && event.detail.hud;
    if (!title) return;
    var line1 = document.getElementById('novvy-hud-title-line1');
    var line2 = document.getElementById('novvy-hud-title-line2');
    if (line1) line1.textContent = title.titleLine1 || '';
    if (line2) line2.textContent = title.titleLine2 || '';
  });
  // Title-only overlays have no progress elements or progress controller.
  if (!root || !label) return;

  function render() {
    var shown = Math.round(progress);
    root.style.setProperty('--hud-progress', shown + '%');
    label.textContent = total !== null ? correct + '/' + total : '';
  }

  // Real counts keep both the label and bar in sync through undo/restart.
  // Older percent-only signals retain their existing progress behavior.
  function onHudProgress(event) {
    var detail = event.detail || {};
    if (Number.isInteger(detail.correct) && Number.isInteger(detail.total) && detail.total > 0 && detail.correct >= 0 && detail.correct <= detail.total) {
      correct = detail.correct;
      total = detail.total;
      progress = Math.min(99, Math.round(correct / total * 100));
      render();
      return;
    }
    var percent = Math.round(Number(detail.percent) || 0);
    var value = Math.min(99, Math.max(progress, Math.max(START, percent)));
    if (value > progress) {
      progress = value;
      render();
    }
  }

  // Fill the last percent after the final beads and celebration finish.
  function snapComplete() {
    progress = 100;
    render();
  }

  window.addEventListener('novvy:hud-progress', onHudProgress);
  window.addEventListener('novvy:victory', snapComplete);
  window.novvyTrainingProgress = {
    get: function () { return Math.round(progress); },
    complete: snapComplete,
    reset: function () { progress = total !== null ? Math.min(99, Math.round(correct / total * 100)) : START; render(); }
  };

  render();
})();
