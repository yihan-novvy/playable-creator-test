# Travel Town playable 模板

模板 ID：`travel-town-origin`，版本 `1.2.2`。保留 Insightrackr 原始 PixiJS 6.5.10 创意的寒冷房间、角色动画、4×5 棋盘、拖拽合并与修复动画。按用户要求，将一次修复即结束改为连续完成粉刷、清理；任选顺序，第一项完成后保留房间变化，再选择另一项，全部完成才结算。

来源：[Insightrackr 创意 cc291b7a79f971ff107d1df63a064c1e](https://data.insightrackr.com/creative/preplay/detail/cc291b7a79f971ff107d1df63a064c1e)。载荷商店 ID `1521236603` 与用户的 [Travel Town App Store 页面](https://apps.apple.com/us/app/travel-town-merge-adventure/id1521236603) 一致。源哈希见 `source/provenance.json`，冻结文件没有修改。

## 内容范围

这份广告只有粉刷、清理两套完整合并棋盘和修复动画。窗户、床有场景与选项图片，但没有相应合并链、完整关卡或修复成品素材。当前版本不包含新增窗户、床任务，也不是完整游戏的无限关卡模式。扩展这类任务需要另行制作。

## 使用

工作台可设置片头视频、两行标题、重玩、底部下载卡与转化时机。片头沿用 `core:intro`，自然结束后直接进入试玩。

- 默认关闭片头和标题；重玩、底部下载卡与转化默认开启。转化时机默认“通关时”，工作台沿用 Tasty Travels 的“转化时机”“第 N 次有效操作跳转”“首跳步数 N”“循环间隔”文案，仅在步数模式显示步数输入。保留启用开关以支持关闭转化的既有任务。
- 底部下载卡支持 CTA 按钮颜色，沿用 Tasty Travels 的颜色选择器，默认绿色 `#10b981`。修改会保存到 `cta.buttonColor`，底部按钮及其阴影同步更新，预览与组装 ZIP 共用同一配置；导出前需重新打包。
- 成功与失败均使用 Tasty Travels 风格的居中结算弹窗：成功只保留 Retry，失败只保留 Try again，已移除 Continue。点击先触发一次重玩 CTA，等待实际离开后返回试玩，再恢复完整房间、两个棋盘、引导和计步，不重复片头。
- 开启按步数跳转时，第 20 次有效操作首跳，后续间隔 10、8、6、4，最后一项重复。单项修复不会结算，按步数模式不再因提前通关补跳。
- 默认“通关时”仅在全部修复完成时触发一次。失败不自动跳转。
- 下载卡和自动策略独立开关。主动点击重玩始终走重玩 CTA，不受自动跳转开关影响。普通手动下载不会锁住棋盘。切后台暂停，返回后恢复；浏览器保留页面（BFCache）的 pagehide 只暂停，pageshow 恢复原实例。

无 SDK 的本地预览没有真实商店可返回，点击重玩会记录预览调用并直接重开；不会冒充已完成跳店。

本次 `travel-town` 示例保留标题和重玩，转化已开启并设为“通关时”。最新验证服务：[打开工作台](http://127.0.0.1:18123/task.html?id=travel-town)。其他已运行编辑器需重启以重新加载模板 manifest，旧进程会缓存旧文件哈希。

## 代码与产物

- `source/`：冻结的原始 loader、JS、图标及来源哈希。
- `src/game.js`：`NovvyGame(factory)` 适配器，返回 start/pause/resume/setEnv/destroy。
- `src/engine-scope.js`：每实例独立作用域、Shadow DOM、音频、计时器和渲染生命周期。
- `src/host.js`、`src/index.html`：项目组装壳，负责视频、SDK、下载卡、自动策略与同段重玩。
- `scripts/build.mjs`：源哈希校验、唯一锚点补丁、构造函数名称保留、生成 manifest 和产物哈希。
- `editor/plugins/travel-town-origin/`：工作台、配置与打包插件。
- `editor/templates/travel-town-origin/`：生成模板，请从源码重新构建。

独立 ZIP 只有根 `game.js`，资源内嵌，不含 SDK、iframe/postMessage、下载卡或自动跳转。结算弹窗与等待 CTA 返回的重玩流程属于项目组装壳。独立包在 Novvy 平台中的重玩和自动跳转由平台组装配置控制，本地工作台设置不会传入独立包。项目组装 ZIP 包含 `index.html`、`game.js`，可选加入本地视频与海报。

原广告网络适配器、日志器、无操作跳店、原生下载按钮及全屏点击跳店已移除。背景铺满画布，棋盘避让安全区、标题与下载卡，修复选项在入场后重新校正边界。

## 事件语义

依据本次重新获取并全文阅读的 2026-11-05 版 [Novvy 事件协议](https://developer.novvy.ai/eventLogs)。当前连续修复改动来自用户明确反馈，不是纯格式迁移。

| 操作 | 独立游戏调用 |
| --- | --- |
| 成功移入空格 | `shell.step(progress)`，进度不变 |
| 成功合并 | `shell.step(progress)` |
| 无效拖动、选择修复、自动动画 | 不记 step |
| 第一项修复动画完成 | 记完成状态，回到选择，不发 result |
| 两项修复动画均完成 | `shell.win()`，一局一次 |
| 原生失败回调 | `shell.fail()` |

总进度为 `(粉刷最高等级/3 + 清理最高等级/2)/2×100`，任意顺序都连续递增。暂停不记操作；结果后停止游戏输入，组装壳按重玩设置保留本段。重玩创建新实例，清空计步与跳转阈值。独立素材没有自有 CTA，`cta_placements=[]`；组装壳的重玩入口另记为 `assemblyCtaPlacements`。标准壳下载卡为 `cta_click`，显式启用的自动策略为 `forced_click_to_appstore`。重玩弹窗的两个按钮按本次用户要求沿用 Tasty Travels：`forced_click_to_appstore` / `playable-replay`。确认依据见 `cta-decisions.md`。

## 构建与检查

```sh
npm run build -w template-core/travel-town-origin
npm test -w template-core/travel-town-origin
node editor/test/run-all.mjs travel-town-origin
npm run validate
```

详细验证和限制见 `VERIFICATION.md`；最终包与哈希见 `dist/travel-town-origin/`。本地检查不等于官方日志或真实广告 WebView 验收。
