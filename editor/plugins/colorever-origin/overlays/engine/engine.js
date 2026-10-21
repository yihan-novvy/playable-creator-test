/* Colorever Origin 引擎适配(shim)。aplv playable 是外部交付的 Cocos 单文件
   包,游戏逻辑混淆不可改;本脚本只通过运行时的三个缝把素材接进 novvy 事件
   规范,转化/切段语义与 colorever-new 对齐(core playable-bridge + cta-bridge
   共享注入,本文件只派发事件、不直接触碰 SDK API 之外的东西):

   1. 有效步(一次完成的单指点按 = 一步):document 捕获段数指针手势,驱动
      CTA 循环节奏——触发点表由打包侧 lib.mjs 纯函数预计算注入
      (__ORIGIN_CTA_POLICY__.schedule),命中即派发 novvy:cta-moment(首次
      repeat:false,其后 repeat:true,由转化桥绕自动闩锁逐次转化)。步数同时
      经 NovvyPlayable.onStep 上报;游戏真实进度不可知,不编造 percent
      (docs/original-zip-required-event-integration.md §4)。
   2. 完成:游戏自带结算回调 super_html.game_end 被替换为先派发
      novvy:playable-complete(转化桥在该时刻主动跳转一次并武装回访每击,
      endMask=false 与 colorever-new 同款),再调用原回调。
   3. CTA:playable 自带下载横幅最终走 super_html.download(url)。SDK 在场时
      改派 novvy:cta-interact(桥 → NovvyPlayable.click,click_source=cta_click),
      由 SDK 统一跳转;SDK 不在场(编辑器预览)保留原始 mraid/window.open 裸
      跳转且不派发事件——桥的 openStoreFallback 兜底会再入本函数,派发会成环。

   super_html 由 aplv 包装层脚本在本脚本之前同步定义;引擎 boot 是异步资源
   加载,启动后仍短周期重试补丁,防包装层替换对象。全程 try/catch + 零 DOM
   依赖(监听在 document 捕获段)。 */
(function () {
  var policy = window.__ORIGIN_CTA_POLICY__ || null;
  if (!policy) return;
  var schedule = Array.isArray(policy.schedule) ? policy.schedule : [];
  var started = false, ended = false, step = 0, scheduleIndex = 0;

  function sdkPresent() {
    return !!(window.NovvyPlayable && typeof window.NovvyPlayable.click === 'function');
  }

  /* 试玩开始判定与转化桥一致:有片头覆盖层时等 novvy:intro-finished
     (播完/跳过/出错收场都会派发),未启用片头 = 注入即开算。 */
  function begin() {
    if (started) return;
    started = true;
  }
  if (document.getElementById('novvy-video-intro') && !window.__novvyIntroFinished) {
    window.addEventListener('novvy:intro-finished', begin, { once: true });
  } else begin();

  function onGameEnd() {
    if (ended) return;
    ended = true;
    try { document.dispatchEvent(new CustomEvent('novvy:playable-complete', { bubbles: true, detail: {} })); } catch (e) {}
  }

  function onCtaTap() {
    if (!sdkPresent()) return false;
    try { window.dispatchEvent(new CustomEvent('novvy:cta-interact')); } catch (e) {}
    return true;
  }

  function onValidTap() {
    if (!started || ended) return;
    step += 1;
    if (window.NovvyPlayable && typeof window.NovvyPlayable.onStep === 'function') {
      try { window.NovvyPlayable.onStep(step, {}); } catch (e) {}
    }
    while (scheduleIndex < schedule.length && schedule[scheduleIndex].step === step) {
      var entry = schedule[scheduleIndex];
      scheduleIndex += 1;
      try {
        document.dispatchEvent(new CustomEvent('novvy:cta-moment', { bubbles: true, detail: { repeat: scheduleIndex > 1, everySteps: entry.gap > 0 ? entry.gap : 0 } }));
      } catch (e) {}
    }
  }

  /* —— 手势计数:单指按下→抬起算一次;第二指按下/超长按不计。
      pointer 事件优先,老内核回落 touch(单指)。 —— */
  var activeId = null, multiTouch = false, downAt = 0;
  function gestureStart(event) {
    if (activeId !== null) { multiTouch = true; return; }
    activeId = event && event.pointerId !== undefined ? event.pointerId : 1;
    multiTouch = false;
    downAt = Date.now();
  }
  function gestureEnd(event) {
    if (activeId === null) return;
    var same = !event || event.pointerId === undefined || event.pointerId === activeId;
    var multi = multiTouch;
    activeId = null;
    multiTouch = false;
    if (!same || multi || Date.now() - downAt > 8000) return;
    onValidTap();
  }
  function gestureCancel() {
    activeId = null;
    multiTouch = false;
  }
  if (window.PointerEvent) {
    document.addEventListener('pointerdown', gestureStart, true);
    document.addEventListener('pointerup', gestureEnd, true);
    document.addEventListener('pointercancel', gestureCancel, true);
  } else {
    document.addEventListener('touchstart', function (event) {
      if (event.touches && event.touches.length > 1) { multiTouch = true; return; }
      activeId = 1;
      multiTouch = false;
      downAt = Date.now();
    }, true);
    document.addEventListener('touchend', function () {
      var counts = activeId !== null && !multiTouch;
      gestureCancel();
      if (counts) onValidTap();
    }, true);
    document.addEventListener('touchcancel', gestureCancel, true);
  }

  /* —— super_html 缝:download = CTA 跳转,game_end = 结算回调。不改对象
      本体之外的任何状态;包装层若在 boot 后替换 super_html,靠身份比对
      重新接线(补丁成功且稳定 4 秒,或总时长 15 秒后停表)。 —— */
  var patchedChannel = null;
  function patchChannel() {
    var channel = window.super_html;
    if (!channel || channel === patchedChannel) return;
    var originalDownload = typeof channel.download === 'function' ? channel.download : null;
    var originalEnd = typeof channel.game_end === 'function' ? channel.game_end : null;
    try {
      channel.game_end = function () {
        onGameEnd();
        if (originalEnd) { try { return originalEnd.apply(channel, arguments); } catch (e) {} }
      };
      channel.download = function (url) {
        if (onCtaTap()) return;
        if (originalDownload) return originalDownload.call(channel, url);
        if (window.mraid && typeof window.mraid.open === 'function') return window.mraid.open(url);
        return window.open(url, '_blank');
      };
      patchedChannel = channel;
    } catch (e) {}
  }
  patchChannel();
  var elapsed = 0;
  var patchTimer = setInterval(function () {
    elapsed += 400;
    if (window.super_html === patchedChannel && elapsed >= 4000) { clearInterval(patchTimer); return; }
    patchChannel();
    if (elapsed >= 15000) clearInterval(patchTimer);
  }, 400);
})();
