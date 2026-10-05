(function () {
  var STORE_URL = 'https://play.google.com/store/apps/details?id=com.oakever.gemcoloring';
  var root = document.getElementById('novvy-cta');
  if (!root) return;

  /* 没有 ke66qzj0xf 里那条 3 秒等待:注入即显示。 */
  function show() { root.classList.add('novvy-cta-visible'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();

  function openStore() {
    if (window.NovvyAnalytics && typeof window.NovvyAnalytics.track === 'function') {
      try { window.NovvyAnalytics.track('cta_click', { target: 'primary_cta', action: 'click', scene: 'playable_end_card' }); } catch (e) {}
    }
    if (window.NovvyAnalytics && typeof window.NovvyAnalytics.click === 'function') {
      try { window.NovvyAnalytics.click('primary_cta', 'open_destination', { scene: 'playable_end_card' }); } catch (e) {}
    }
    /* Novvy SDK 桥(双端一致):只发点击信号,落地页由 SDK 取 adm.clicktrack,
       所以不传 URL(参数在两端都被忽略)。必须排在 super_html 之前——那是包内
       AppLovin loader 自带的 shim,在 SDK WebView 里永远存在,而它兜底的
       window.open 在 WebView 里是 no-op,会把这次跳转吞掉。 */
    if (window.__novvyBridgeVersion >= 1 && window.novvy && typeof window.novvy.open === 'function') {
      window.novvy.open();
      return;
    }
    /* 模板自带的跳转桥:广告 WebView 里走 mraid.open,普通浏览器里 window.open。 */
    if (window.super_html && typeof window.super_html.download === 'function') {
      window.super_html.download(STORE_URL);
      return;
    }
    if (window.mraid && typeof window.mraid.open === 'function') {
      window.mraid.open(STORE_URL);
      return;
    }
    window.open(STORE_URL, '_blank');
  }

  var btn = document.getElementById('novvy-cta-btn');
  if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); openStore(); });
  /* 点到卡片外的压暗层也算一次 CTA 点击(与参考的 end-card 行为一致)。 */
  root.addEventListener('click', function (e) { if (e.target === root) openStore(); });

  /* 结算页 canvas 还会画出烘焙的下载条(DownButtonNode,素材 images/DownButtomBg,
     MetaGame 运行时创建,节点名不保证)——正是这张 DOM 卡片替换掉的东西。
     尽力按名字把它按下去,结算时就不会出现两个 CTA。找不到也无害:
     这张卡片本来就叠在它上面。持续轮询而不是找到即停,游戏每次显示它都再压一次。 */
  function find(node, re, depth) {
    if (!node || depth > 9) return null;
    var name = node.name || '';
    if (re.test(name)) return node;
    var children = node.children || [];
    for (var i = 0; i < children.length; i++) {
      var hit = find(children[i], re, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  setInterval(function () {
    try {
      var scene = window.cc && window.cc.director && window.cc.director.getScene && window.cc.director.getScene();
      if (!scene) return;
      var node = find(scene, /downbut/i, 0);
      if (node && node.active) node.active = false;
    } catch (e) {}
  }, 500);
})();
