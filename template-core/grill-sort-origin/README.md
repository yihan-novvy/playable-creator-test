# Grill Sort Origin

原版 Cocos 3.8.5 烧烤分类试玩，12 个烤盘、120 串，默认 180 秒倒计时。冻结 HTML、来源指纹及 SHA-256 见 `source/`。Insightrackr 发行方和载荷 iOS ID 对应目标应用，素材作者未独立确认。

构建确定性解开两份 Brotli JSON，保留原 Cocos 引擎、资源、匹配规则、关卡与本地资源加载器。仅替换广告网络启动桥，通过命名 SystemJS 模块的独立适配器接入事件；不修改原玩法核心。

`npm run build -w template-core/grill-sort-origin`；`npm test -w template-core/grill-sort-origin`。原生三串匹配、120 串守恒及确定性生成有测试。原版隐藏盘随机补货仍按原规则运行。

`src/layout.js` 通过命名模块适配完整画布布局：HUD 位于灵动岛下方，倒计时放在左上侧，12 个烤盘与餐盘缩放到标题和下载卡之间。隐藏原生结算下载按钮，统一使用 App Store 正式名称和内嵌图标（来源、图片校验值见 `source/app-store.json`）。声音默认开启，受浏览器交互解锁规则约束；隐藏或不可见时静音。

编辑器「游戏设置」支持 `gameplay.countdownSeconds`（1–3600 秒，默认 180）和 `gameplay.allowReplay`（默认开启）。倒计时从首次游戏操作开始，页面隐藏或广告不可见时暂停。设置变动只需重新打包，不需重新处理视频。

允许重玩时，成功显示 **Play again**，超时显示 **Try again**；重玩沿用 Escape Arrow 的 `novvy:replay-cta` 路径，先触发 CTA，再重建缓存中的 Cocos 场景。新一轮恢复 120 串、引导、倒计时及步数转化窗口，发送一次 `onReplay`，不重复片头或 SDK 阶段。关闭重玩则隐藏按钮并按一次性结算处理。原生资源只加载一次，旧场景的事件、动画与水印定时器不会残留。

引擎、资源与首帧在片头播放期间预加载；首帧完成后暂停场景并静音，片头结束时直接恢复已有 canvas，不提前消耗倒计时或接受操作。无片头时显示英文加载提示，完成首帧后进入游戏。
