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
   5. 裸跳归一:全素材出站跳转原语只有 window.open 与横幅通道的 mraid.open。
      SDK 在场时两口都按棋盘进度分双路(解完=完成,其余=手动 CTA)——否则 SDK
      的裸跳侦测会对同一击再归因一次(forced_click_to_appstore/scene=playable),
      一次点击双计转化;mraid 用整只假身替换(宿主的侦测包装挂在原对象上,
      就地包拦不住),补丁定时器常驻低频不停表,防包装层换回原版 super_html
      复活裸跳。

   super_html 由 aplv 包装层脚本在本脚本之前同步定义;引擎 boot 是异步资源
   加载,启动后先快频后常驻低频重试补丁,防包装层替换对象。全程 try/catch +
   零 DOM 依赖(监听在 document 捕获段)。 */
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
  var audioRunningLogged = false;
  function LOG(message) {
    try { console.log('[novvy-origin] ' + message); } catch (e) {}
  }

  /* 试玩开始判定与转化桥一致:有片头覆盖层时等 novvy:intro-finished
     (播完/跳过/出错收场都会派发),未启用片头 = 注入即开算。 */
  /* —— iOS 静音键:WebAudio 输出遵循 iOS 静音拨片(媒体元素不受限)——首次
     手势时用 <audio> 播一小段静音 wav,把 App 音频会话切到 playback 档,此后
     WebAudio 在震动模式下照常出声(Howler/Phaser 同款社区方案)。 —— */
  var SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'; /* Howler 同款:2 个非零采样(全零采样会被 iOS 跳过) */
  var silentPlayed = false;
  /* —— WebAudio 解锁:游戏 boot 于片头/覆盖层之下,引擎的"首触解锁"监听在画布
     上,前几触被覆盖层吃掉后上下文停在 suspended;游戏代码后续的 resume() 不在
     用户手势栈内,浏览器策略会忽略 → 永久静音。shim 在加载期记录全部
     AudioContext,并在每次有效触压的手势栈内逐个解锁。产品语义:点击 playable
     即有声,不追求零点击自动出声（iOS 系统本就禁止零激活出声）。 —— */
  var audioContexts = [];
  var audioDecoded = 0, audioSources = 0, audioStatusLogged = false;
  try {
    var NativeAudioContext = window.AudioContext || window.webkitAudioContext;
    if (NativeAudioContext) {
      var WrappedAudioContext = function () {
        var ctx = new NativeAudioContext();
        audioContexts.push(ctx);
        try {
          var origDecode = ctx.decodeAudioData ? ctx.decodeAudioData.bind(ctx) : null;
          if (origDecode) ctx.decodeAudioData = function () { audioDecoded += 1; return origDecode.apply(null, arguments); };
        } catch (e) {}
        try {
          var origCreateSrc = ctx.createBufferSource ? ctx.createBufferSource.bind(ctx) : null;
          if (origCreateSrc) ctx.createBufferSource = function () {
            var src = origCreateSrc();
            var origStart = src.start ? src.start.bind(src) : null;
            if (origStart) src.start = function () { audioSources += 1; return origStart(); };
            return src;
          };
        } catch (e) {}
        return ctx;
      };
      WrappedAudioContext.prototype = NativeAudioContext.prototype;
      window.AudioContext = WrappedAudioContext;
      if (window.webkitAudioContext) window.webkitAudioContext = WrappedAudioContext;
    }
  } catch (e) {}
  function logAudioStatus(tag) {
    if (audioStatusLogged) return;
    audioStatusLogged = true;
    try {
      var states = audioContexts.map(function (c) { return c.state; }).join(',') || '无';
      LOG('音频状态[' + tag + ']: 上下文=' + audioContexts.length + ' [' + states + '] 解码=' + audioDecoded + ' 已启动源=' + audioSources);
    } catch (e) {}
  }
  function unlockAudio() {
    for (var i = 0; i < audioContexts.length; i += 1) unlockOne(audioContexts[i]);
  }
  /* Howler 同款组合拳:resume 之外再让一个"空 buffer"过一遍该上下文——部分
     iOS 版本仅 resume 不生效,必须有 buffer 在手势栈内 start 过。 */
  function unlockOne(ctx) {
    try {
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    } catch (e) {}
    try {
      if (!ctx.__novvyUnlockedBuffer) {
        var source = ctx.createBufferSource();
        source.buffer = ctx.createBuffer(1, 1, 22050);
        source.connect(ctx.destination);
        if (source.start) source.start(0);
        else if (source.noteOn) source.noteOn(0);
        ctx.__novvyUnlockedBuffer = true;
      }
    } catch (e) {}
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
    /* WebAudio 运行状态验收日志:任何上下文首次 running 即打一条 */
    if (!audioRunningLogged) {
      for (var i = 0; i < audioContexts.length; i += 1) {
        try {
          if (audioContexts[i].state === 'running') { audioRunningLogged = true; LOG('WebAudio running ✓'); break; }
        } catch (e) {}
      }
    }
    if (ended) return;
    pollProgress(false);
    hideTitleSprite();
  }, 400);
  /* iOS 兜底:pointer 事件可能被画布的 touch preventDefault 吞掉(此时
     gestureStart/gestureEnd 都不触发),原生 touch 路再挂一对纯解锁监听
     (不计步)。iOS 解锁惯例挂在 touchstart,这里 start/end 都覆盖。 */
  document.addEventListener('touchstart', function () {
    playSilent();
    unlockAudio();
    logAudioStatus('touchstart');
  }, true);
  document.addEventListener('touchend', function () {
    playSilent();
    unlockAudio();
    logAudioStatus('touchend');
  }, true);

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

  /* 同一次触压可能前后脚命中多个 CTA 入口(横幅 window.open + 包装层原版
     download 的 mraid.open),300ms 去抖只派一次——与桥的回访每击去抖同款;
     人工连点由 SDK 冷却护栏管,这里只管"一击多口"双计转化。 */
  var lastCtaTapAt = -1e9;
  function onCtaTap() {
    if (!sdkPresent()) return false;
    var now = Date.now();
    if (now - lastCtaTapAt < 300) return true;
    lastCtaTapAt = now;
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
    playSilent();
    unlockAudio();
    logAudioStatus('手势开始');
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
    if (!audioRunningLogged) {
      for (var i = 0; i < audioContexts.length; i += 1) {
        try {
          if (audioContexts[i].state === 'running') { audioRunningLogged = true; LOG('WebAudio running ✓'); break; }
        } catch (e) {}
      }
    }
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
      重新接线(补丁定时器常驻低频,不再停表——见文末守卫注释)。 —— */
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
  /* —— 裸跳归一:SDK 在场时把全素材仅有的两个出站跳转原语都收编到统一双路,
     否则 SDK 会把绕过 click API 的裸跳再归因一次(forced_click_to_appstore/
     scene=playable),一次点击双计转化。两个口:window.open(横幅 DownButton/
     原生胜利走它;SDK WebView 里本是无声 no-op)与 window.mraid.open(横幅的
     installForGame 通道首选它;真实链路见 QA 追踪:onDownButton → installForGame
     → super_eval → mraid.open)。window.open 就地包;mraid 整只换受控假身
     (见 guardMraid——宿主可能已在原对象上包了侦测层,就地包拦不住外层归因)。
     拦截后按棋盘真实进度区分:解完(≥99.9%)=完成信号 nativeComplete(强制跳转
     一次并武装回访每击);其余=手动 CTA novvy:cta-interact(cta_click,不触发
     完成、不武装)。预览(无 SDK)保留裸跳。 —— */
  function sdkJumpDualPath(source) {
    var ratio = null;
    try {
      if (fillSource && typeof fillSource.getCorrectFillRatio === 'function') ratio = fillSource.getCorrectFillRatio();
    } catch (e) {}
    LOG('裸跳 ' + source + ' 拦截（进度 ' + (ratio === null ? '未知' : Math.round(ratio * 100) + '%') + '）');
    if (ratio !== null && ratio >= 0.999) nativeComplete();
    else onCtaTap();
  }
  var originalOpen = window.open;
  var guardedOpen = function () {
    if (sdkPresent()) {
      sdkJumpDualPath('window.open');
      return {};
    }
    return originalOpen.apply(window, arguments);
  };
  window.open = guardedOpen;
  /* 与 guardMraid 同理:宿主可能在我方包装外再包一层裸跳侦测。定时器身份
     比对,发现 window.open 被再包就把我方函数顶回最外——宿主那层成孤儿
     (我方在 SDK 模式从不 call through,宿主包装收不到任何调用)。预览不守。 */
  function guardWindowOpen() {
    if (!sdkPresent()) return;
    if (window.open !== guardedOpen) window.open = guardedOpen;
  }
  /* mraid 假身:SDK 在场时整只替换 window.mraid。就地包 open 不够——宿主
     (SDK 侦测层)可能在同一对象上再包一层裸跳归因(forced_click_to_appstore/
     scene=playable),调用先过宿主包装再进我们的内层,双计照旧;换成假身后
     宿主包在原对象上的那层彻底不可达,裸调用永远到不了 SDK,跳转全部走
     click API 统一开店。包装层的用法只有 open(跳转)/addEventListener+
     getState(MRAID 可见性桥,换假身后桥空挂,生命周期由 SDK 自己驱动)。
     替换被宿主钉死(defineProperty)时退回就地包 open。预览(无 SDK)不动。
     注入时序不定,随补丁定时器重试;身份比对防重复换。 */
  var mraidDecoy = null;
  function guardMraid() {
    if (!sdkPresent()) return;
    if (mraidDecoy && window.mraid === mraidDecoy) return;
    var real = window.mraid;
    if (!real || typeof real.open !== 'function' || real === mraidDecoy) return;
    var decoy = {
      __novvyMraidDecoy: true,
      open: function () { sdkJumpDualPath('mraid.open'); },
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () { return false; },
      getState: function () { return 'ready'; },
      getVersion: function () { return '2.0'; },
      getPlacementType: function () { return 'default'; },
      getViewable: function () { return 'visible'; },
      isViewable: function () { return true; },
      getScreenSize: function () { return { width: window.innerWidth || 0, height: window.innerHeight || 0 }; },
      getMaxSize: function () { return null; },
      getCurrentPosition: function () { return null; },
      getDefaultPosition: function () { return null; },
      setOrientationProperties: function () {},
      setExpandProperties: function () {},
      expand: function () {},
      close: function () {},
      createCalendarEvent: function () {},
      storePicture: function () {},
      playVideo: function () {},
      supports: function () { return false; },
      useCustomClose: function () {}
    };
    try {
      window.mraid = decoy;
      if (window.mraid === decoy) {
        mraidDecoy = decoy;
        LOG('mraid 已换受控假身（裸跳归一）');
        return;
      }
    } catch (e) {}
    if (real.__novvyGuardedOpen) return;
    try {
      real.open = function () { sdkJumpDualPath('mraid.open'); };
      real.__novvyGuardedOpen = true;
      LOG('mraid 假身替换失败,open 已就地接管');
    } catch (e) {}
  }
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
  function patchAll() {
    patchSdkStageLog();
    patchChannel();
    guardMraid();
    guardWindowOpen();
  }
  patchAll();
  /* 守卫常驻不停表:boot 期 400ms 快频(SDK/包装层注入时序不定),4 秒后降为
     2s 一拍。旧版 15 秒停表是个漏洞——窗口一过,包装层换回的原版 super_html
     连同 download 内的 mraid.open 裸跳一起复活;身份比对让常驻守卫开销可忽略。 */
  var elapsed = 0;
  var fastTimer = setInterval(function () {
    elapsed += 400;
    patchAll();
    if (elapsed >= 4000) {
      clearInterval(fastTimer);
      setInterval(patchAll, 2000);
    }
  }, 400);
})();
