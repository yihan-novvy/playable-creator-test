(function () {
  window.addEventListener('novvy:phase2-start', function () {
    document.documentElement.classList.add('novvy-phase2');
    var first = document.getElementById('novvy-dom-bg');
    var second = document.getElementById('novvy-dom-bg2');
    if (first) first.hidden = true;
    if (second) second.hidden = false;
  });
})();
