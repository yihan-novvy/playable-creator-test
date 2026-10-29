# Block Out Origin 编辑器插件

在新建任务中选择 **Block Out Origin（片头+原版两关）**。纯试玩直接打包；视频广告开启「使用开场视频」，上传 MP4，运行「开场视频」后再打包。可选海报 JPG、GO 按钮、顶部标题。

默认第 20 次有效操作请求商店跳转，随后按 10、8、6、4 的间隔触发，最后一个间隔循环。可改为仅完成后跳转。计步条件是方块移动到新格子或成功出门；空白点击、点选、无法移动不计步。两关共 39 块，进度为累计出门数 / 39，换关不清零。

「游戏设置 → 允许重玩」默认关闭，历史任务保持原来的结算行为。开启后，通关或失败显示英文重玩按钮；点击先经共享 CTA-card 请求跳转，再重建第一关。两关共 39 块的进度、有效操作数及 CTA 循环一并归零；不重播片头、不重复进入 stage、不重启音乐。

## 事件契约

| 事件 | 接线 |
| --- | --- |
| 段链 | `setStageList(['video','playable'])`，无片头则 `['playable']` |
| 视频 | `NovvyAnalytics.registerMedia` 注册一次，片头结束后 `setStage` |
| 首次互动 | 由宿主 SDK 的 DOM 捕获负责 |
| 有效操作 | `NovvyPlayable.onStep(step,{progress})`，移动可以保持原进度 |
| 最终胜利 / 失败 | 原引擎最终结算入口 → `onComplete({result})`；允许重玩时带 `continue_playing: true`，每局只结算一次 |
| 重玩 | CTA-card → 重建原生棋盘 → `onReplay()`，同一 playable stage |
| 未完成离开 | 非 bfcache 的 `pagehide` → `endStage()`；后台或商店回访不结算 |
| 主动 CTA | 底部 Download、原生 logo/结算按钮 → `click_source: 'cta_click'` |
| 策略 CTA | 有效步数 / 最终完成 → `click_source: 'forced_click_to_appstore'` |

原版 `ad_end` 不用于判断通关。原版自动跳商店和原生「已跳转」玩法锁都不进入广告通道。所有点击统一交给宿主 `NovvyPlayable.click`；编辑器无 SDK 时只在控制台记录，不打开商店。

片头结束前不启动棋盘。支持宿主 `novvy:viewablechange`、页面可见性与原生焦点暂停；默认启用游戏声音，浏览器要求手势解锁时由首个手势恢复。自定义标题开启时隐藏原生 logo 和关卡标题，避免叠字。

## 产物与验证

纯试玩：`index.html`、`assets.js`、`core.js`。启用视频另带转码后的 `intro-video.mp4` 和 `poster.webp`。预览和打包共用同一组装逻辑；共享 `core:intro` 负责转码和海报。

运行 `node editor/test/run-all.mjs block-out-origin` 和模板源测试。适配器回归覆盖移动/出门去重、累计进度、CTA 间隔、原生跳转治理、视频闸门、成功/失败和离开结算。正式投放仍需使用真实宿主 SDK 在 iOS/Android 广告 WebView 验收，编辑器预览不会发送生产埋点。

转化统一复用 core CTA bridge：步数循环已触发后，通关不重复自动跳转；最终通关后普通触压可再次转化，CTA-card 保留 `cta_click` 且不重复。无 SDK 的编辑器预览只记录触发，不调用原版跳转兜底。
