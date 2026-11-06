# Travel Town 原版 playable 模板

模板 ID：`travel-town-origin`。保留 Insightrackr 原始 PixiJS 6.5.10 创意的寒冷房间剧情、角色动画、4×5 棋盘、拖拽合并、引导与修复动画。玩家选择粉刷或清洁，完成所选修复后本段结束；另一分支可通过重玩体验，不虚构额外关卡。

来源：[Insightrackr 创意 cc291b7a79f971ff107d1df63a064c1e](https://data.insightrackr.com/creative/preplay/detail/cc291b7a79f971ff107d1df63a064c1e)。原始载荷中的商店 ID 为 `1521236603`，与用户给出的 [Travel Town App Store 页面](https://apps.apple.com/us/app/travel-town-merge-adventure/id1521236603) 一致。平台展示量是估算筛选信号，不代表转化效果。来源、获取日期和逐文件 SHA-256 见 `source/provenance.json`。

## 使用

在编辑器创建 Travel Town 任务，可选择片头视频、两行标题、重玩、底部下载卡与自动跳转策略。片头使用 `core:intro` 转码；自然结束或倒计时结束后直接进入试玩，旧任务的 GO 配置不生效。

默认关闭片头、标题与重玩；下载卡和自动策略默认开启。首跳在第 20 次有效操作，后续间隔为 10、8、6、4，最后的 4 重复。未达到首跳即胜利时兜底一次，已发生自动跳转则不重复胜利转化。完成模式仅在真实胜利时触发。卡片关闭会释放底部空间；自动策略与卡片分别开关。

`travel-town` 示例任务为便于预览，开启了标题与重玩；其余保持默认。工作台地址随本地编辑器端口变化。本次服务为 `http://127.0.0.1:8096/task.html?id=travel-town`。

## 交付边界

- `source/`：冻结的原始 loader、完整 JS 载荷、官方图标及来源哈希。
- `src/game.js`：当前 `NovvyGame(factory)` 协议适配器，返回 start/pause/resume/setEnv/destroy。
- `src/engine-scope.js`：每实例独立全局、Shadow DOM、音频、计时器和渲染生命周期。该命名空间隔离并非安全沙箱。
- `src/host.js`、`src/index.html`：项目组装壳，负责视频阶段、SDK、下载卡、自动策略及同段重玩。
- `scripts/build.mjs`：验证源哈希、抽取载荷、唯一锚点补丁、保留构造函数名（原引擎 DI 依赖名称）、生成 manifest 和文件哈希。
- `editor/plugins/travel-town-origin/`：工作台、配置组装及打包插件。
- `editor/templates/travel-town-origin/`：生成模板。不要手工修改此目录。

独立游戏 ZIP 根目录只有 `game.js`，图片、音频与配置均内嵌；它不含广告 SDK、iframe/postMessage、下载卡或自动跳转。项目组装 ZIP 包含根 `index.html` 与 `game.js`，启用视频时增加本地视频和海报。

原广告平台适配器、日志器、13 秒无操作跳店、原生下载按钮及通关全屏点击跳店均已移除。通关后遗留的假选择入口也隐藏。真实背景铺满画布，棋盘按安全区、标题和下载卡剩余区域布局；选项入场缩放结束后再次校正边界。拖拽使用 Pixi 统一 pointermove，避免按设备触控能力决定是否接收鼠标事件。

## 事件语义

依据本次重新读取的 2026-11-05 版 [Novvy 事件协议](https://developer.novvy.ai/eventLogs)，使用 `NovvyGame`，不使用 skill 内旧版 postMessage 桥。

| 原生操作 | 独立游戏调用 |
| --- | --- |
| 成功移入空格 | `shell.step(progress)`，进度不变 |
| 成功合并、目标物品等级增加 | `shell.step(progress)` |
| 无效拖动、空点、选择分支、自动动画 | 不记 step |
| 所选修复动画完成、进入原版转化终点 | `shell.win()`，每局一次 |
| 原生 FinalPopup 失败回调 | `shell.fail()`；本创意常规路线未观察到可达失败 |

粉刷进度为本局最高目标等级 / 3，清洁为最高目标等级 / 2，取 0–100；有效操作数与进度分离。暂停冻结原生时钟、帧和音频，销毁释放实例资源。重玩创建新实例，清空本局步数与自动策略，不重复片头或 playable stage。素材没有自有 CTA，`cta_placements=[]`。按当前协议 §2.1 的固定壳配置，卡片为 `cta_click`，壳自动策略为 `forced_click_to_appstore`；重玩不触发 CTA。

## 构建与检查

```sh
npm run build -w template-core/travel-town-origin
npm test -w template-core/travel-town-origin
node editor/test/run-all.mjs travel-town-origin
npm run validate
```

详细验证范围、已知限制及最终 ZIP 哈希见 `VERIFICATION.md` 和 `dist/travel-town-origin/verification.json`。本地测试不能代替官方「试玩日志调试」与 iOS/Android 广告 WebView 验收。
