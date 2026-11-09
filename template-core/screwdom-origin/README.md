# Screwdom 原版 playable 模板

模板 ID：`screwdom-origin`。保留 Cocos Creator 3.8.7 原版冬季粉色小屋、225 枚螺丝、颜色收集盒、五个暂存槽、旋转观察、物理拆件、声音与首步教学。

## 来源与构建

- [App Store](https://apps.apple.com/us/app/screwdom/id6740043080)，App ID `6740043080`。
- [Insightrackr 素材详情](https://data.insightrackr.com/creative/preplay/detail/7f6b3ce23e10ce02c5339d073fd1b547)，指纹 `7f6b3ce23e10ce02c5339d073fd1b547`。
- 2026-11-06 筛选：iOS，2025-11-07 至 2026-11-06，全国家/渠道，预估展示降序。在 621 个候选中采用首个素材；页面估算展示 204 亿、持续 351 天、AppLovin 渠道。这是来源平台的估算值。
- 原版标题：`251119_IGSD_PAIH_PLAPinkWinterHouse2B`。下载的 loader 与其显式引用的 JS 均保存在 `source/`；`provenance.json` 记录 URL、筛选条件、SHA-256。原始文件未修改。
- 构建解析源内 47 个 ZIP 文件和 299 个 loose resources，共 346 个资源。所有游戏资源嵌入 `game.js`；内存 fetch/XHR 仅解码这些资源，不向 `screwdom.local` 或原 CDN 请求。

```sh
npm run build -w template-core/screwdom-origin
npm test -w template-core/screwdom-origin
node editor/test/run-all.mjs screwdom-origin task-creation template-showcase config-patch
npm run validate
```

构建写入 `editor/templates/screwdom-origin/`。编辑器插件在 `editor/plugins/screwdom-origin/`。构建后若正在运行的编辑器缓存了旧 manifest，重启该服务再打包。

## 使用与导出

示例任务 `screwdom`，工作台 `/task.html?id=screwdom`，预览 `/result/screwdom/index.html`。

新任务默认关闭片头、HUD 标题及重玩，开启底部下载卡与自动跳转。示例任务还开启标题与重玩。片头自然结束后自动进入游戏，旧任务残留的 GO 配置被忽略。

成功/失败采用与 Word Search Explorer 一致的居中结算弹窗：暗色遮罩、绿色卡片和金色按钮。开启「允许重玩」后，成功显示 Play again，失败显示 Try again；按用户要求移除 Continue。弹窗阻止底层游戏输入；点击重玩时按 Pixel Flow 的行为先请求一次 `forced_click_to_appstore`（`scene=playable-replay`，携带本轮 `result`），请求被接受后立即关闭整个弹窗并重建，不等待商店返回信号。加载期间显示 Loading…；广告不可见时新局暂不启动，返回后才恢复操作并上报重玩。连点只跳转并创建一局；SDK 拒绝、抛错或一秒冷却期间保留弹窗，按钮仍可再次点击。真正加载失败时重新显示可重试的错误弹窗，加载恢复不重复跳店。无 SDK 的本地预览记录 CTA 后直接重开。关闭重玩时只显示结果。

工作台「底部下载卡」可开关卡片、编辑按钮与引导文案；图标来自核实过的 App Store `6740043080`，已冻结为本地 JPG 并纳入 manifest 哈希，来源与当时评分记录在 `source/provenance.json`。卡片进入试玩才显示，游戏相机、结算弹窗为卡片与安全区留出空间，画布背景保持全屏。

「自动跳转」可独立开关，支持按有效步数或通关时触发。默认第 20 步首次跳转，之后间隔 10、8、6、4 步，最后每 4 步重复；间隔留空表示仅首跳。每项接受 1–99 的整数，最多 24 个间隔。按步数模式在第一次自动跳转前通关会补跳一次，失败本身不跳，点击 Try again 才请求重玩跳转。只统计真实成功的玩家操作，自动转移不额外计步；重玩重置本轮计数。重玩按钮的跳转独立于底部卡片和自动跳转开关。卡片、重玩和自动策略共用 1 秒冷却，冷却期间到达步数阈值会在下一次有效操作重试，不提前消耗下一间隔。

修改下载卡或自动跳转设置会使旧 pack 失效，须重新打包；已转码片头保留。默认设置也适用于没有对应字段的旧任务，显式关闭值保留。

两种导出分别为：

- 项目组装 ZIP：根 `index.html` 和 `game.js`，片头开启时另含视频和海报。包含项目宿主，适用于本项目后续 SDK 注入流程。
- 独立游戏 ZIP：仅根 `game.js`，使用 `NovvyGame` 生命周期协议，不含项目宿主、视频、HUD、下载卡、重玩按钮和自动跳转策略。上传新版平台时选择单关、关卡制 `level`，下载卡和自动跳转在平台组装页配置。

游戏实例使用独立作用域和 Shadow DOM。`start` 前不运行关卡；`pause/resume` 控制引擎、动画、定时器及音频；`destroy` 释放监听、定时器、音频、字体、Object URL 和画面。`setEnv` 接收声音、屏幕与安全区变化；调整游戏相机区域，背景和 canvas 仍覆盖整个容器。

## 事件与下载入口

按 2026-11-07 重新读取的 [官方事件协议](https://developer.novvy.ai/eventLogs) 接入；读取的 Markdown SHA-256 为 `d8e11c14e3fc42db79a652c83e318f32f2342eb0e3b03db458ba93e1ef7e4b39`。

- `Screw.onPickHandle` 成功改变螺丝状态才调用 `shell.step`。无效/被遮挡点击、槽位满、自动转移不记额外步骤。进度为 `(totalScrewCount - CurrentScrewRemain) / totalScrewCount * 100`，不同于原版显示的已装盒计数。
- 原生 `GameSystem.win/lose` 调用 `shell.win/fail`，每局只上报一次，不用计时器或零剩余数提前伪造胜利。
- 项目宿主映射到 `NovvyPlayable` 的阶段、步骤、结果、离开和重玩 API；重玩创建全新实例，场景就绪后才调用 `onReplay`。独立包无内部重玩，因此结果不传 `continuePlaying`。
- 原生 Play Now、失败页假重玩跳店、原版广告触发阈值均禁用；项目组装壳统一控制底部卡片、重玩按钮和用户配置的自动策略。底部卡片为 `cta_click`，自动策略为 `forced_click_to_appstore`；2026-11-09 用户要求参考 Pixel Flow 为重玩增加 CTA，壳层重玩按钮同样使用 `forced_click_to_appstore`，原始决定见 [cta-decision.md](verification/cta-decision.md)。Continue 已移除；独立游戏包的 CTA 位置列表为空。
- 卡片只发一次交互信号，按钮移除 SDK 自动绑定选择器，由项目 host 独占 click 调用；避免自定义监听与 SDK 自动钩子同时触发。未注入 SDK 的预览只输出触发信息，不打开商店。
- 项目组装包是待官方 SDK 注入的原包；本地直接预览不代表事件已上报服务端。独立包只调用平台传入的 shell，不含旧 SDK、postMessage 桥或裸商店导航。

## 验证范围

2026-11-07 重玩闪现修复：旧实现仅隐藏按钮，将旧结果弹窗留到新场景启动完成，造成收缩后的卡片看起来像第二次弹窗。现于重建前同步关闭整个弹窗。新增延迟入口和延迟启动的回归用例，先在旧实现上复现失败，再验证成功/失败两种结果在整个重建期间无弹窗、连点去重、就绪后才上报重玩，以及真实加载错误仍可重试。构建、宿主/适配器测试与注册表检查通过，示例任务已重新打包。本轮真实浏览器确认新包加载及螺丝拾取，未完成自然失败后的整轮重玩；该过渡由异步回归覆盖，不能视为真实浏览器验收完成。产物与记录见 `output/screwdom-retry-fix-20261107/`。

2026-11-07 弹窗修改：构建、源完整性/原生回调/宿主单测、46 项 Screwdom 编辑器检查和注册表检查通过。自动化验证成功/失败弹窗、重玩后的输入恢复、连点去重及原有 CTA 策略。最新项目包已通过真实操作触发暂存槽满的自然失败，确认弹窗只显示 Try again，在 390×844、320×568 和 844×390 下完整显示；实际重玩后小屋与暂存槽复位，再次拾取成功。加载及重建时仍有历史记录中的 Cocos 5302 `cc.LightProbesData` 诊断，未出现新的宿主异常。证据与最终包检查见 `output/screwdom-result-modal-20261107/`；自然胜利和官方事件验收仍未完成。

2026-11-06：构建、源完整性、补丁锚点、确定性、脚本语法、346 资源检查通过；提取原生 Screw 方法的语义单测通过；编辑器四个相关套件共 127 项检查通过；registry 校验 0 警告。

Safari 实际试玩确认：首步与后续螺丝拾取、填满五槽后的自然失败、点击 Try again 重建关卡、重玩后再次拾取；390×844、320×568、844×390 画面与标题布局；工作台灵动岛遮挡下标题可读；成品 `file://` 打开并成功拾取。实际截图及产物哈希在 `verification/`，未经状态修改或人工拼造游戏画面。

未完成的验收：未手动清除全部 225 枚螺丝到达自然胜利；片头切段、部分配置组合和无效操作由自动检查覆盖，未逐项进行真实浏览器测试；未执行官方平台事件最终验收或 iOS/Android 广告 WebView 真机验收。本地单测和截图不能代替这些验收。

CTA 补全回归（同日）：Screwdom 编辑器集成 46 项、配置合并 10 项检查通过；宿主单测覆盖卡片时序、去重、首跳/循环/仅一次、通关兜底、关闭、后台与重玩重置。Safari 重新检查 390×844 灵动岛、320×568 与 844×390 的卡片布局，真实点击下载卡显示一次 `cta_click` 预览记录。详细结果见 `verification/cta-report.json`；这不等于官方事件验收通过。
