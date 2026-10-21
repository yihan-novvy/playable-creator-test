/* Colorever Origin 引擎适配(shim)。aplv playable 是外部交付的 Cocos 单文件
   包,游戏逻辑混淆不可改;本脚本只通过运行时的几个缝把素材接进 novvy 事件
   规范,转化/切段语义与 colorever-new 对齐(core playable-bridge + cta-bridge
   共享注入,本文件只派发事件、不直接触碰 SDK API 之外的东西):

   1. 真实进度:棋盘模型的 getCorrectFillRatio(正确/已占,0..1)是游戏获胜检查
      (winTargetProgressPercent)用的同一指标。寻路与 aplv 自带集成脚本同款:
      window.cc.director.getScene() 找 BS_GameDirector 组件的 _model;扫描退化
      为通用组件遍历(gemsort hud 同款,属性名在混淆下保留)。读数上涨即派
      novvy:hud-progress,由共享段桥统一 onStep(step,{progress}) 上报 —— SDK
      的进度曲线由此获得真值;扫描未命中前,有效步退回直接 onStep(step,{})
      (无 percent,不编造,docs/original-zip-required-event-integration.md §4)。
   2. 有效步(一次完成的单指点按 = 一步):document 捕获段数指针手势,驱动
      CTA 循环节奏——触发点表由打包侧 lib.mjs 纯函数预计算注入
      (__ORIGIN_CTA_POLICY__.schedule),命中即派发 novvy:cta-moment(首次
      repeat:false,其后 repeat:true,由转化桥绕自动闩锁逐次转化)。
   3. 完成:游戏自带结算回调 super_html.game_end 被替换为收尾读一次进度
      (棋盘解完 ratio=1 → percent 100 真值入流)后派发 novvy:playable-complete
      (转化桥在该时刻主动跳转一次并武装回访每击,endMask=false 与
      colorever-new 同款),再调用原回调。
   4. CTA:playable 自带下载横幅最终走 super_html.download(url)。SDK 在场时
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

  /* —— 调试日志（设备验收用,统一前缀方便抓取）:hud-progress 每次派发、
     25/50/75/100 里程碑跨越、SDK 段切换/链声明、试玩开始。 —— */
  var MILESTONES = [25, 50, 75, 100];
  var seenMilestone = {};
  function LOG(message) {
    try { console.log('[novvy-origin] ' + message); } catch (e) {}
  }

  /* 试玩开始判定与转化桥一致:有片头覆盖层时等 novvy:intro-finished
     (播完/跳过/出错收场都会派发),未启用片头 = 注入即开算。 */
  /* —— iOS 静音键:WebAudio 输出遵循 iOS 静音拨片(媒体元素不受限)——首次
     手势时用 <audio> 播一小段静音 wav,把 App 音频会话切到 playback 档,此后
     WebAudio 在震动模式下照常出声(Howler/Phaser 同款社区方案);试玩开始时
     也尝试一次(历史用户激活存在即可成功,否则等首次触压)。 —— */
  var SILENT_WAV = 'data:audio/wav;base64,UklGRkQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
  var silentPlayed = false;
  /* —— WebAudio 解锁:游戏 boot 于片头/覆盖层之下,引擎的"首触解锁"监听在画布
     上,前几触被覆盖层吃掉后上下文停在 suspended;游戏代码后续的 resume() 不在
     用户手势栈内,浏览器策略会忽略 → 永久静音。shim 在加载期记录全部
     AudioContext,并在每次有效触压的手势栈内逐个 resume（resume 只在手势栈内
     生效,这正是浏览器的要求）。本段必须先于 begin()（无片头形态 begin 在 IIFE
     求值期即调用）。 —— */
  var audioContexts = [];
  try {
    var NativeAudioContext = window.AudioContext || window.webkitAudioContext;
    if (NativeAudioContext) {
      var WrappedAudioContext = function () {
        var ctx = new NativeAudioContext();
        audioContexts.push(ctx);
        return ctx;
      };
      WrappedAudioContext.prototype = NativeAudioContext.prototype;
      window.AudioContext = WrappedAudioContext;
      if (window.webkitAudioContext) window.webkitAudioContext = WrappedAudioContext;
    }
  } catch (e) {}
  function unlockAudio() {
    for (var i = 0; i < audioContexts.length; i += 1) {
      try {
        if (audioContexts[i].state === 'suspended' && audioContexts[i].resume) audioContexts[i].resume();
      } catch (e) {}
    }
  }
  function playSilent() {
    if (silentPlayed) return;
    try {
      if (typeof Audio !== 'function') return;
      var element = new Audio(SILENT_WAV);
      var played = element.play();
      if (played && played.catch) played.catch(function () { silentPlayed = false; });
      silentPlayed = true;
      LOG('iOS 静音键解锁:静音 wav 已播放（音频会话切 playback）');
    } catch (e) {}
  }

  function begin() {
    if (started) return;
    started = true;
    LOG('试玩开始（有效步开始计数）');
    playSilent();
    unlockAudio();
  }
  if (document.getElementById('novvy-video-intro') && !window.__novvyIntroFinished) {
    window.addEventListener('novvy:intro-finished', begin, { once: true });
  } else begin();

  /* —— 真实进度:BS_GameDirector._model.getCorrectFillRatio 场景扫描 —— */
  var fillSource = null, lastPercent = 0, progressLive = false;
  function findFillSource() {
    try {
      var scene = window.cc && window.cc.director && window.cc.director.getScene && window.cc.director.getScene();
      if (!scene) return null;
      var stack = [scene];
      while (stack.length > 0) {
        var node = stack.pop();
        if (!node) continue;
        var comps = node.components || node._components;
        if (comps) {
          for (var i = 0; i < comps.length; i++) {
            var comp = comps[i];
            if (!comp) continue;
            if (comp._model && typeof comp._model.getCorrectFillRatio === 'function') return comp._model;
            if (typeof comp.getCorrectFillRatio === 'function') return comp;
          }
        }
        var kids = node.children;
        if (kids) for (var j = 0; j < kids.length; j++) stack.push(kids[j]);
      }
    } catch (e) {}
    return null;
  }
  function pollProgress(finalRead) {
    if (!fillSource || typeof fillSource.getCorrectFillRatio !== 'function') {
      fillSource = findFillSource();
      if (!fillSource) return;
    }
    try {
      var ratio = fillSource.getCorrectFillRatio();
      if (typeof ratio !== 'number' || !(ratio > 0)) return;
      progressLive = true;
      var value = Math.round(Math.min(1, ratio) * 100);
      if (value >= 100) value = finalRead ? 100 : 99; /* 100 只在结算读数给(棋盘解完 ratio=1) */
      if (value > lastPercent) {
        lastPercent = value;
        LOG('hud-progress percent=' + value);
        for (var m = 0; m < MILESTONES.length; m += 1) {
          if (value >= MILESTONES[m] && !seenMilestone[MILESTONES[m]]) {
            seenMilestone[MILESTONES[m]] = 1;
            LOG('进度里程碑 ' + MILESTONES[m] + '%（当前 ' + value + '%）');
          }
        }
        try { document.dispatchEvent(new CustomEvent('novvy:hud-progress', { bubbles: true, detail: { percent: value } })); } catch (e) {}
      }
    } catch (e) {}
  }
  /* —— aplv 原标题横幅隐藏:TitleSprite 节点("The Best Brain-Training Game"
     图),视觉由 HUD 标题在原位接管。按名查找(与 aplv 自带集成脚本同款寻路),
     随进度轮询重试直至隐藏。 —— */
  var titleHidden = false;
  function hideTitleSprite() {
    if (titleHidden) return;
    try {
      var scene = window.cc && window.cc.director && window.cc.director.getScene && window.cc.director.getScene();
      if (!scene) return;
      var stack = [scene];
      while (stack.length > 0) {
        var node = stack.pop();
        if (!node) continue;
        if (node.name === 'TitleSprite') {
          node.active = false;
          titleHidden = true;
          LOG('TitleSprite 已隐藏(HUD 标题接管)');
          return;
        }
        var kids = node.children;
        if (kids) for (var i = 0; i < kids.length; i += 1) stack.push(kids[i]);
      }
    } catch (e) {}
  }
  setInterval(function () {
    if (ended) return;
    pollProgress(false);
    hideTitleSprite();
  }, 400);

  function onGameEnd() {
    nativeComplete();
  }

  /* —— 完成信号统一闩锁:game_end(渠道结算回调)与原生胜利跳转(window.open,
     GlobalConfig 阈值补丁后只在棋盘解完时发生)都汇到这里,只派一次
     novvy:playable-complete(转化桥主动跳转一次),终局后手势/节奏停表。 —— */
  function nativeComplete() {
    if (ended) return;
    ended = true;
    LOG('完成信号（game_end / 原生胜利跳转）');
    pollProgress(true);
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
    /* 真实进度在场时段桥按 percent 上涨统一 onStep;未命中(或尚无读数)才
       直接上报步数 —— 两条路互斥,SDK 侧不重复计步。 */
    if (!progressLive && window.NovvyPlayable && typeof window.NovvyPlayable.onStep === 'function') {
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

  /* —— 音频解锁:游戏 boot 于片头/覆盖层之下,引擎的"首触解锁"监听在画布上,
     前几触被覆盖层吃掉后 WebAudio 上下文停在 suspended;游戏代码后续的
     resume() 不在用户手势栈内,浏览器策略会忽略 → 永久静音。shim 在加载期
     记录全部 AudioContext,并在每次有效触压的手势栈内逐个 resume
     （resume 只在手势栈内生效,这正是浏览器的要求）。 —— */

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
    playSilent(); /* iOS 静音键:首个手势时切音频会话 */
    unlockAudio(); /* 手势栈内解锁音频,越早越好(含未开始计步的触压) */
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
        if (sdkPresent()) {
          /* 终局前 = 玩家点自带横幅(手动 CTA,cta_click);终局后不再动作——
             完成转化已由 nativeComplete 发出,回访触压由桥的回访每击接管。 */
          if (!ended) onCtaTap();
          return;
        }
        if (originalDownload) return originalDownload.call(channel, url);
        if (window.mraid && typeof window.mraid.open === 'function') return window.mraid.open(url);
        return window.open(url, '_blank');
      };
      patchedChannel = channel;
    } catch (e) {}
  }
  patchChannel();
  /* —— window.open 跳转归一:游戏有两处跳转都走 window.open(gemsort 同款
     installForGame 形态;SDK WebView 里本是无声 no-op)——①棋盘解完的原生胜利
     跳转(阈值补丁后只在解完时发生);②自带横幅/结算按钮的手动 CTA 跳转。拦截
     后按棋盘真实进度区分:解完(≥99.9%)=完成信号 nativeComplete(强制跳转一次
     并武装回访每击);其余=手动 CTA novvy:cta-interact(cta_click,不触发完成、
     不武装)。预览(无 SDK)保留裸跳。 —— */
  var originalOpen = window.open;
  window.open = function () {
    if (sdkPresent()) {
      var ratio = null;
      try {
        if (fillSource && typeof fillSource.getCorrectFillRatio === 'function') ratio = fillSource.getCorrectFillRatio();
      } catch (e) {}
      if (ratio !== null && ratio >= 0.999) nativeComplete();
      else onCtaTap();
      return {};
    }
    return originalOpen.apply(window, arguments);
  };
  /* —— SDK 段切换日志:包装 NovvyPlayable.setStage/setStageList（段桥的切段
     都走这两个入口）。SDK 注入时序不定，随补丁定时器短周期重试直至包上。 —— */
  var stageWrapped = null;
  function patchSdkStageLog() {
    var sdk = window.NovvyPlayable;
    if (!sdk || sdk === stageWrapped || typeof sdk.setStage !== 'function') return;
    var origSetStage = sdk.setStage;
    var origSetStageList = sdk.setStageList;
    try {
      sdk.setStage = function (index, type) {
        LOG('stage → ' + index + (type ? ' (' + type + ')' : ''));
        return origSetStage.call(sdk, index, type);
      };
      if (typeof origSetStageList === 'function') {
        sdk.setStageList = function (list) {
          LOG('stage 链声明: ' + JSON.stringify(list));
          return origSetStageList.call(sdk, list);
        };
      }
      stageWrapped = sdk;
      LOG('SDK 段切换日志已挂接');
    } catch (e) {}
  }
  patchSdkStageLog();
  var elapsed = 0;
  var patchTimer = setInterval(function () {
    elapsed += 400;
    patchSdkStageLog();
    var sdkIdle = !window.NovvyPlayable || window.NovvyPlayable === stageWrapped;
    if (window.super_html === patchedChannel && sdkIdle && elapsed >= 4000) { clearInterval(patchTimer); return; }
    patchChannel();
    if (elapsed >= 15000) clearInterval(patchTimer);
  }, 400);
})();
