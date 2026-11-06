# Project Makeover 原版化妆模板

模板 ID：`project-makeover-origin`。固定一份 Insightrackr 素材，保留 Adobe Animate / CreateJS 人物、三色粉底、刷子、上妆动画、背景和音效。

## 素材与范围

- 应用：[Project Makeover](https://apps.apple.com/us/app/project-makeover/id1483058899)，Magic Tavern, Inc.
- 素材指纹：`3df7449c58284d3620850de23804d055`。2026-11-06 在 Insightrackr 搜索页下载，约 4 亿估算展示、785 天投放记录；这些数值不是转化效果证据。
- 原始载荷及 SHA-256 见 `source/provenance.json`；`source/original.js` 和 `source/loader.html` 字节冻结。构建验证哈希及补丁唯一锚点，派生到 `editor/templates/project-makeover-origin/`。
- 只包含“选择粉底 → 点击脸部上妆”的原版短演示。上妆结束后的口红画面是原版商店推荐入口，没有可玩的下一关，也没有真实胜负分支。
- 发布方归属以列表发行商与内嵌商店 ID 匹配为依据，未独立验证素材作者身份。CreateJS 原始许可证声明保留在载荷中。

## 设置与交付

编辑器插件在 `editor/plugins/project-makeover-origin/`。可设置片头视频、两行 HUD 标题及演示重玩，默认全部关闭。片头通过 `core:intro` 转码，结束后自动进入游戏，旧任务的 GO 设置也会被忽略。

- 项目组装 ZIP：根 `index.html` + `game.js`；启用片头时包含转码 MP4 和海报。
- 独立游戏 ZIP：仅根 `game.js`，通过 `NovvyGame` 接入平台壳；无 HTML、片头或 SDK。游戏资源内嵌。
- 尚未收到 CTA 位置分类选择，所有原生跳店和下载卡暂时关闭。工作台不提供不可用的下载开关；启用卡片的外部配置会明确报错。
- 重玩只重新创建本局，不重复片头和阶段号，不附带跳店；原版结束推荐画面仍保留。
- 背景与 canvas 始终铺满根容器；前景整体让出宿主的标题/底部占位，保留原版内部坐标和命中关系。

## 事件语义

按 2026-11-06 重新读取的官方 `https://developer.novvy.ai/eventLogs`（页面更新 2026-11-05）接入当前独立入口协议。

| 原生动作 | 独立游戏 | 项目组装壳 |
| --- | --- | --- |
| 选择不同粉底颜色 | `shell.step(0)` | `onStep(n,{progress:0})` |
| 脸部成功开始上妆 | `shell.step(100)`，重复点击去重 | `onStep(n,{progress:100})` |
| 原生动画 `nextLevel → setSQ` | `shell.end()`，只结束一次 | 关闭重玩时 `endStage()`；开启时等待用户选择继续或重玩 |
| 重玩 | 由外层平台重新建实例 | 新场景就绪后 `onReplay()`，同段继续 |
| 胜负、CTA | 本素材无真实胜负；CTA 待确认，均不伪造 | 同左 |

首次互动由平台宿主捕获；项目组装壳补一次真实 pointerdown。暂停/恢复停用输入、计时器和音频，销毁清理 CreateJS、Touch、Howler、定时器及实例 DOM。广告关闭依赖真实宿主，本模板不拿后台或失焦伪造关闭。

## 本地验证

```sh
npm run build -w template-core/project-makeover-origin
npm test -w template-core/project-makeover-origin
node editor/test/run-all.mjs project-makeover-origin task-creation template-showcase origin-editor
npm run validate
```

冻结原版输入函数参与单元测试，绘图和计时用内存 fixture；这只能证明适配器行为，不代表官方事件验收。实际浏览器和交付验证记录见 `VERIFICATION.md`。
