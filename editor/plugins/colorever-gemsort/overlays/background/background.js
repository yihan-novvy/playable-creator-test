(function () {
  /* 透明画布配套补丁:pack 时引擎宏 ENABLE_TRANSPARENT_CANVAS 已被打开
     (见 meta-patch 的 enableTransparentCanvas),这里负责运行时侧的两件事:
     1. 相机停止涂不透明底色(SOLID_COLOR 的 clearColor 归零,保留深度/模板清除);
     2. 隐藏引擎自带的 GameBg 背景精灵,让 DOM 层的 background.webp 透出来。
     轮询到场景就绪;找不到 GameBg 也无害——DOM 背景与引擎背景是同一张图。 */
  var attempts = 0;
  var colorCleared = false;
  var bgHidden = false;

  function findGameBg(node, depth) {
    if (!node || depth > 9) return null;
    if (/gamebg/i.test(node.name || '')) return node;
    var children = node.children || [];
    for (var i = 0; i < children.length; i++) {
      var hit = findGameBg(children[i], depth + 1);
      if (hit) return hit;
    }
    return null;
  }

  var timer = window.setInterval(function () {
    try {
      var scene = window.cc && window.cc.director && window.cc.director.getScene && window.cc.director.getScene();
      if (!scene) return; // 引擎未起:不计入预算
      attempts += 1;
      if (!bgHidden) {
        var bg = findGameBg(scene, 0);
        if (bg && bg.isActiveInHierarchy !== false) {
          bg.active = false;
          bgHidden = true;
        }
      }
      // 相机清零必须在真实游戏场景里做:引擎启动期的临时场景也有一个
      // SOLID_COLOR 相机,清它毫无意义,还会让补丁提前"完工"。因此以
      // GameBg 已找到(= 真实场景已加载)为闸门,且每 tick 复查直到所有
      // SOLID_COLOR 相机的 clearColor alpha 归零(自愈引擎回写)。
      if (bgHidden && !colorCleared) {
        var cameras = scene.getComponentsInChildren(window.cc.Camera) || [];
        var allZero = cameras.length > 0;
        for (var i = 0; i < cameras.length; i++) {
          var camera = cameras[i];
          if (camera.clearFlags === 7 && camera.clearColor.a !== 0) {
            camera.clearColor = new window.cc.Color(0, 0, 0, 0);
          }
          if (camera.clearFlags === 7 && camera.clearColor.a !== 0) allZero = false;
        }
        if (allZero) colorCleared = true;
      }
      // file:// 冷启动引擎可能要 10 秒以上,预算按"场景就绪后 30 秒"计。
      if ((colorCleared && bgHidden) || attempts >= 300) window.clearInterval(timer);
    } catch (e) {}
  }, 100);
})();
