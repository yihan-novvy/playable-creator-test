/* 段桥:把模板的试玩语义翻译成打包侧新事件规范(docs/original-zip-required-event-integration.md)。
   只使用落地页注入引擎的公开导出 —— window.NovvyPlayable(段链声明/切段/步骤/结算)与
   window.NovvyAnalytics(视频媒体注册)。两者都由打包程序注入;缺失(编辑器预览)时全部
   no-op,预览行为与改造前完全一致。零 DOM:只读 window.__novvyStageChain__(打包时由
   插件 lib.mjs 按 intro/outro/双关配置算好的字面量段链)和监听模板既有 novvy:* 事件,
   不引用任何埋点 API。
   语义约定:脚本必须以 bodyScripts 首位注入(插件 lib.mjs unshift),先于 intro.js 求值
   和 defer 的 game.js 执行 —— 段链声明与首段 setStage 赶在首段播放前;媒体注册(doc §3)
   赶在该段切段监听之前。onStart 依赖 SDK 自动捕获不显式调用;素材无同段重玩,不提供
   endStage/onReplay。阶段下标 1 起,与 __novvyStageChain__ 一一对应:
   ['video','playable','video','playable'] = intro → 试玩 → outro → 第二关。 */
(function () {
  var chain = window.__novvyStageChain__;
  if (!chain || !chain.length) return;
  var playableApi = window.NovvyPlayable;
  var analyticsApi = window.NovvyAnalytics;

  /* 切段:除首段外的每次切入都先 setStage 再继续,失败不阻断素材运行。 */
  function enter(index, type) {
    if (!playableApi || typeof playableApi.setStage !== 'function') return;
    try { playableApi.setStage(index, type); } catch (e) {}
  }

  function settle() {
    if (!playableApi || typeof playableApi.onComplete !== 'function') return;
    try { playableApi.onComplete({ result: 'win' }); } catch (e) {}
  }

  /* 既有结构:chain = [intro?] playable [outro?] [phase2?]。阶段号 1 起:
     首段 = chain[0];intro 后的 playable 在 firstPlayable+1;紧随 playable
     的 video 即 outro 段(单关链里 playable 后没有 video,intro 段不会误认
     —— 判据是 firstPlayable+1 处,不是 lastIndexOf);链尾是 playable 且
     前面有 outro 段,才是双关的第二 playable。 */
  var introIndex = chain[0] === 'video' ? 1 : 0;
  var firstPlayable = chain.indexOf('playable');
  if (firstPlayable < 0) return;
  var outroIndex = chain[firstPlayable + 1] === 'video' ? firstPlayable + 2 : 0;
  var phase2Index = outroIndex && chain[chain.length - 1] === 'playable' ? chain.length : 0;

  /* —— 启动:声明完整链路 + 首段切入 —— */
  try { playableApi.setStageList(chain.slice()); } catch (e) {}
  enter(1, chain[0]);

  /* —— 媒体注册:标准 <video> 由 SDK 自动上报 media_* 事件(doc §3),
     注册赶在各自切段监听之前;元素缺失(intro/outro 未启用)自然跳过 —— */
  if (analyticsApi && typeof analyticsApi.registerMedia === 'function') {
    var introVideo = document.getElementById('novvy-intro-video');
    var outroVideo = document.getElementById('novvy-outro-video');
    try { if (introVideo) analyticsApi.registerMedia(introVideo, { name: 'intro_video' }); } catch (e) {}
    try { if (outroVideo) analyticsApi.registerMedia(outroVideo, { name: 'outro_video' }); } catch (e) {}
  }

  /* —— 有效步骤与真实进度(doc §4):hud-progress 每次交互都发(colorever 系
     {percent,correct,total} 走 document、dragon-cube {percent} 走 window,
     window 监听两者都收),percent 仅在净正确放置/收集时上涨 —— 只在上涨时
     记一步,开局即约 90% 的真实完成度与 reset 归零都被"严格大于"过滤 —— */
  var step = 0, seenPercent = 0;
  window.addEventListener('novvy:hud-progress', function (event) {
    var percent = event && event.detail && event.detail.percent;
    if (typeof percent !== 'number' || !(percent > seenPercent) || percent > 100) return;
    seenPercent = percent;
    step += 1;
    if (playableApi && typeof playableApi.onStep === 'function') {
      try { playableApi.onStep(step, { progress: percent }); } catch (e) {}
    }
  });

  /* —— 结果与最终结束(doc §5):playable-complete 先于 victory,双触发按
     每关闩锁只结算一次;双关的 phase2-start 复位闩锁,第二关重新可结算 —— */
  var settled = false;
  function onWin() {
    if (settled) return;
    settled = true;
    settle();
  }
  window.addEventListener('novvy:playable-complete', onWin);
  window.addEventListener('novvy:victory', onWin);

  /* —— 切段监听 —— */
  if (introIndex) {
    window.addEventListener('novvy:intro-finished', function () {
      enter(firstPlayable + 1, 'playable');
    });
  }
  if (outroIndex) {
    window.addEventListener('novvy:outro-started', function () {
      enter(outroIndex, 'video');
    });
  }
  if (phase2Index) {
    window.addEventListener('novvy:phase2-start', function () {
      enter(chain.length, 'playable');
      settled = false;
      step = 0;
      seenPercent = 0;
    });
  }
})();
