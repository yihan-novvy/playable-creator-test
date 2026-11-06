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

新任务默认关闭片头、HUD 标题、重玩及下载入口；可配置片头 MP4/海报、两行 HUD 标题和重玩。示例任务开启标题与重玩。片头自然结束后自动进入游戏，旧任务残留的 GO 配置被忽略。

两种导出分别为：

- 项目组装 ZIP：根 `index.html` 和 `game.js`，片头开启时另含视频和海报。包含项目宿主，适用于本项目后续 SDK 注入流程。
- 独立游戏 ZIP：仅根 `game.js`，使用 `NovvyGame` 生命周期协议，不含项目宿主、视频、HUD 或重玩按钮。上传新版平台时选择单关、关卡制 `level`，由平台管理展示与结束。

游戏实例使用独立作用域和 Shadow DOM。`start` 前不运行关卡；`pause/resume` 控制引擎、动画、定时器及音频；`destroy` 释放监听、定时器、音频、字体、Object URL 和画面。`setEnv` 接收声音、屏幕与安全区变化；调整游戏相机区域，背景和 canvas 仍覆盖整个容器。

## 事件与下载入口

按 2026-11-06 重新读取的 [官方事件协议](https://developer.novvy.ai/eventLogs) 接入；读取的 Markdown SHA-256 为 `d8e11c14e3fc42db79a652c83e318f32f2342eb0e3b03db458ba93e1ef7e4b39`。

- `Screw.onPickHandle` 成功改变螺丝状态才调用 `shell.step`。无效/被遮挡点击、槽位满、自动转移不记额外步骤。进度为 `(totalScrewCount - CurrentScrewRemain) / totalScrewCount * 100`，不同于原版显示的已装盒计数。
- 原生 `GameSystem.win/lose` 调用 `shell.win/fail`，每局只上报一次，不用计时器或零剩余数提前伪造胜利。
- 项目宿主映射到 `NovvyPlayable` 的阶段、步骤、结果、离开和重玩 API；重玩创建全新实例，场景就绪后才调用 `onReplay`。独立包无内部重玩，因此结果不传 `continuePlaying`。
- 原生 Play Now、失败页假重玩跳店、按操作数/剩余螺丝触发的强制跳店均禁用；普通操作不跳店，不依赖商店关闭回调。下载入口及 `click_source` 尚未获得用户确认，未添加或启用新 CTA。
- 项目组装包是待官方 SDK 注入的原包；本地直接预览不代表事件已上报服务端。独立包只调用平台传入的 shell，不含旧 SDK、postMessage 桥或裸商店导航。

## 验证范围

2026-11-06：构建、源完整性、补丁锚点、确定性、脚本语法、346 资源检查通过；提取原生 Screw 方法的语义单测通过；编辑器四个相关套件共 127 项检查通过；registry 校验 0 警告。

Safari 实际试玩确认：首步与后续螺丝拾取、填满五槽后的自然失败、点击 Try again 重建关卡、重玩后再次拾取；390×844、320×568、844×390 画面与标题布局；工作台灵动岛遮挡下标题可读；成品 `file://` 打开并成功拾取。实际截图及产物哈希在 `verification/`，未经状态修改或人工拼造游戏画面。

未完成的验收：未手动清除全部 225 枚螺丝到达自然胜利；片头切段、部分配置组合和无效操作由自动检查覆盖，未逐项进行真实浏览器测试；未执行官方平台事件最终验收或 iOS/Android 广告 WebView 真机验收。本地单测和截图不能代替这些验收。
