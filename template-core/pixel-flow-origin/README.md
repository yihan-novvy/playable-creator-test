# Pixel Flow! 原版 playable 模板

模板 ID：`pixel-flow-origin`。已接入编辑器的新任务创建、片头转码、工作台、预览和两种 ZIP 导出。当前是可复查的候选版本；官方事件平台及广告 WebView 验收尚未完成。

## 使用

在编辑器选择 **Pixel Flow!（片头+原版像素传送带）**，或打开本次保留的 [示例任务](http://localhost:8107/task.html?id=pixel-flow-origin-demo)。已有 8088 服务需要重启后才会加载新增的创建列表；本次单独启动了 8107 服务，没有停止其他任务的服务。

- 默认直接进入试玩。可开启片头、上传 MP4 并运行“开场视频”，自然结束或倒计时后自动进入游戏。旧 GO 设置被强制关闭。
- 可编辑双行 HUD 标题；默认隐藏，保留原生 Pixel Flow Logo。启用 HUD 时隐藏重复的原生 Logo。
- 可允许重玩，模板默认关闭，本次示例任务已开启。开启后使用 Tasty Travels 式居中结算弹窗：失败显示 `Try Again`，成功显示 `Retry`。点击请求一次 CTA，随即关闭弹窗并重新创建原版场景，重置关卡、本局计数和下载策略，不重复片头。
- 底部下载卡默认开启，可独立关闭或修改按钮、引导文案；使用对应 App Store 的本地图标和名称。
- 自动跳转默认开启：第 10 次有效操作首跳，随后间隔 8、6、4 步，最后每 4 步重复。空列表表示只首跳一次。开关独立于底卡。
- 按用户确认的入口清单，卡片为 `cta_click`，步数策略及成功/失败弹窗的重玩按钮为 `forced_click_to_appstore`；原生 Play Now、原生触摸次数/计时跳转和结算整屏跳转均停用。弹窗出现本身不跳店，只有点击重玩按钮才请求一次 CTA；此次决定取代此前“重玩不跳店”的决定。工作台只暴露步数模式。

独立 ZIP 仅包含根 `game.js`，用于新版 Novvy 平台的游戏入口；片头、标题、底卡和自动策略由平台宿主配置。项目组装 ZIP 包含根 `index.html` 与 `game.js`，使用本项目的产品宿主设置，是等待发布服务注入官方 SDK 的纯净包；本地预览只输出 CTA 诊断，不会实际打开商店。

结算弹窗和重玩同样属于项目组装宿主，独立 `game.js` 本次未变。CTA 接受后立即关闭弹窗并重建，不显示 `Waiting` 或等待“离开再返回”。无 SDK 的本地预览记录 CTA 后直接重开。实际打开商店时，`visibilitychange`、`novvy:viewablechange` 或 `pagehide/pageshow` 只负责暂停/恢复；新场景可以加载，但不可见时不启动玩法和声音。新场景启动完成后只报一次 `onReplay`，重复可见信号不额外重建。SDK 拒绝/抛错恢复原按钮，加载失败显示 `Reload`，重试加载不重复请求商店。

## 来源和玩法

[App Store](https://apps.apple.com/us/app/pixel-flow/id6751056652) 对应 Loom Games 的 Pixel Flow!。采用 Insightrackr 候选 `ff2dbfa4ecf11109c88fc4e8500718dc`：iOS、Mintegral、彩色拼图画面，页面显示约 26 亿曝光。该数字是素材平台展示值，未作为效果承诺。原 HTML 的环境与资源内 iOS 链接均指向 `6751056652`；这只能核实游戏关联，不能证明素材发布者身份。

原始 HTML 和图标冻结在 `source/`，构建先校验 SHA-256。完整筛选条件、无鉴权素材 URL 和取得方式见 `source/provenance.json`，用户确认见 `source/cta-decision.json`。

保留 Unity/Luna/PlayCanvas 原版引擎、单一 Gameplay 场景、31×35 的 1080 个像素、3 列各 10 个猪猪、原始颜色和弹药、5 个暂存槽、5 格传送带容量及原生成功/失败条件。没有另写玩法或伪造关卡。

## 事件及兼容改动

- `MapController.OnTapShooter` 内发生 `TriggerShootersWillBePlacedToConveyor` 的成功预约才报一次 `shell.step`；一组角色仍算一次手势。容量不足、预约失败、空点、自动放置与射击不记步。
- 进度来自 `PixelGridDamageController.OnPixelDamaged` 的真实死亡像素数 / 1080，按对象去重；不会把操作次数当进度。
- 原生 `PlayableIntegration.OnGameWin / OnGameOver` 分别接 `shell.win / fail`；每实例只接受一个最终结果。
- `NovvyGame` 在顶层同步注册，实例实现 start/pause/resume/setEnv/destroy。每轮独立 DOM、作用域、计时器、音频和资源；不使用 iframe、不访问原广告 SDK、不联网请求游戏资源。
- 原版桌面鼠标转触摸逻辑保留在实例作用域内，navigator 覆盖不会写入宿主。摄像机使用真实 PlayCanvas 接口，为标题、底卡和安全区留空间；Canvas 和背景仍铺满容器。
- 可重复的引擎补丁：Deserializers 暴露到实例作用域；Bridge 调度改本地计时器；删除原网络/导航入口；修正局部 Mecanim/Function 解析；原调试 JSON 检查改为实际 JSON.parse；为 GetSiblingIndex 在重设父节点的短暂空父节点状态加保护。原始文件不修改。

事件协议按 2026-11-06 取得的 [官方 eventLogs 文档](https://developer.novvy.ai/eventLogs) 的 `NovvyGame / shell` 契约实现。文档哈希在 `source/event-protocol.json`。已安装 events skill 的检查器仍检查旧 postMessage 协议，不能据此认证新版包。

## 已完成与未完成的验收

已通过：

- 源哈希、补丁锚点、确定性构建、生成 JS 语法检查及注册表校验。
- 原版放置和伤害回调的适配器测试；无效输入、自动动作、重复伤害、胜负去重检查。
- 宿主测试：10/18/24/28/32/36 的实际阈值序列、冷却、后台/片头抑制及无结算补跳；成功/失败弹窗、CTA 在重建前且仅一次、点击立即关闭弹窗、本地无 SDK 直接重玩、隐藏期间加载但不启动、重复可见信号不重建、同步 SDK 隐藏、pagehide 返回、连点抑制、关闭重玩、加载失败恢复和场景就绪后上报。
- 编辑器专项 49 项，包括配置部分保存、非法配置拒绝、预览/导出一致、旧包失效、弹窗及旧底部按钮移除、片头转码、旧 GO 关闭、关闭片头清理残留媒体和两种真实导出接口。此前共享 config-patch 10 项、task-creation 15 项通过；本次未修改共享配置层。
- 浏览器实际放置猪猪、传送带射击、像素消除、暂存槽和旋转后点击；测试任务临时使用 2 步首跳 / 1 步间隔，真实操作观察到 `forced_click_to_appstore`，主动按钮观察到单次 `cta_click`。这些是本地诊断，不能替代平台上报证据。
- 390×844、320×568、844×390 的实际 Canvas 边界与容器一致；小屏和横屏双行标题、原生 Logo 隐藏、底卡均已截图。模拟器安全区为 0，不能代表刘海真机验证。

本次重玩修复已在实际成品页面自然操作到失败，看到居中 Try Again 弹窗；点击后只记录一条 `playable-replay / forced_click_to_appstore` 本地诊断，弹窗关闭、棋盘/弹药/暂存槽恢复，并成功操作新一局的第一个角色。没有等待页面切走再返回，浏览器控制台无错误。前后截图及本地诊断保存在 `dist/pixel-flow-origin/qa/replay-*`。这是无 SDK 预览验证，不能代替实际商店跳转或平台上报。

未完成：自然完整通关、连续多轮重玩、真实商店往返、长文案/灵动岛遮挡、视频切入的真实浏览器播放、file://、iOS/Android 广告 WebView；这些不能由单元测试替代。成功 Retry 的同一路径已覆盖宿主测试，尚未自然通关验证。前述三种尺寸截图是之前的棋盘验收，本次弹窗及重开实测尺寸为 1280×720。

官方事件页加载返回 `ERR_BLOCKED_BY_CLIENT`，尚无官方“试玩日志调试”的完整人工游玩和原始 tracking 请求证据；未宣称事件正式验收通过，也未把本地 console 或测试 fixture 当官方验收报告。

本次保留 `project/pixel-flow-origin-demo` 与 `result/pixel-flow-origin-demo`；可下载产物和截图位于 `dist/pixel-flow-origin/`（均为 Git 忽略的本地交付物）。独立 ZIP 约 2.23 MB，组装 ZIP 约 2.29 MB，分别满足 5 MB 和 10 MB 的静态预算。

## 构建与检查

```sh
npm run build -w template-core/pixel-flow-origin
npm test -w template-core/pixel-flow-origin
node editor/test/run-all.mjs pixel-flow-origin
npm run validate
```

`src/` 是可维护适配层，`scripts/build.mjs` 生成 `editor/templates/pixel-flow-origin`；插件位于 `editor/plugins/pixel-flow-origin`。请修改源文件后重建，不直接修改生成目录。
