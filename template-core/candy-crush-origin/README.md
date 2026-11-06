# Candy Crush Saga · 原版糖果球

模板 ID：`candy-crush-origin`。保留 Insightrackr 素材中 THREE + PIXI 的 3D 糖果球、糖果碎屑、音效、手指引导及爆炸结算。玩法为 **Poke the Candy**，不是三消棋盘。

## 来源

- 应用：Candy Crush Saga，King.com Limited，App Store `553834731`。
- 搜索：[Insightrackr Candy Crush](https://data.insightrackr.com/search/preplay?keyWord=Candy+Crush&gpt=0)。2026-11-06 观察，iOS / Mintegral，指纹 `418b2b3d53aa81978ffdb132d94e6892`。
- 原始文件、哈希、公开资源 URL、筛选范围及归属确认程度见 `source/provenance.json`。展示估算仅用于选材，不代表投放效果。聚合页另一份三消候选实际指向 Candy Crush Soda，已排除。
- 原始 `source/original.html` 保持字节不变。构建验证 SHA-256，并对唯一结构锚点施加补丁；生成目录禁止手改。

## 功能与默认值

- 固定一份原版 playable：成功点中可见糖果计 1 步；工作台可设置每局 1–71 次，默认 5 次。最大值由冻结 GLB 模型的 71 个糖果网格计算，排除隐藏背景；每点只计一次，空白/已隐藏糖果不计步。较长一局中，原版转动结束后若全部剩余糖果都无法命中，会将一颗剩余糖果转到前面，确保上限可完成。
- 片头默认关，使用 `core:intro` 转码和海报；视频结束自动进入试玩。旧任务的 GO 设置被强制关闭。
- 顶部标题默认关，主副标题可编辑。游戏画布铺满根容器，原生 2D 布局和 3D 投影适配 HUD、下载卡及安全区，射线命中同步适配。
- 重玩默认关；开启后结算显示 Play again，重建实例并恢复糖果，不重复片头或 playable stage。
- 底部下载卡默认开，官方 App Store 图标、评分 4.7，文案可编辑。
- 自动跳转默认开：第 3 次有效命中首跳，之后每 2 步；未发生自动跳转时通关补跳。支持仅通关模式、独立开关、首跳/间隔设置、1 秒防重复。手动卡片与自动策略互不依赖。

## 交付边界与事件

`game-only.zip` 根目录仅 `game.js`，供新版平台上传；建议玩法类型 `level`，关卡数 `1`，需要 WebGL。独立游戏不含片头、标题、下载卡、自动策略和重玩按钮；这些由平台或项目组装壳管理。

工作台设置写入两种 ZIP 内的 `game.js`，平台传入空 `options.config` 时也使用已设置的次数；修改次数会使旧导出失效，需重新打包。

`game.js` 同步注册一次 `NovvyGame`，加载完成后 Promise 返回 `start/pause/resume/setEnv/destroy`。开场等待和暂停时禁止输入、冻结帧/定时器/时间、静音；销毁释放 THREE/PIXI、音频、字体、监听器、资源 URL 与节点。资源内嵌；引擎 fetch 形状的调用只由实例内存解码器读取 data URI，没有 HTTP/file 请求。删除原 Mintegral 包装、店铺链接、消息调度/图片 Worker 和原生下载热区。

| 原版行为 | 独立接口 | 项目组装壳 |
| --- | --- | --- |
| 可见糖果的射线命中，原计数递增 | `shell.step(count / tapsToBreak * 100)` | `onStep(step,{progress})` |
| 达到所设次数后的爆炸回调 | `shell.win()`，每局一次 | `onComplete({result:'win',continue_playing})` |
| 防御性原版失败回调（本素材正常流程不可达） | `shell.fail()` | `onComplete({result:'fail'})` |
| 组装壳重玩就绪 | 新实例 | `onReplay()`，沿用同一 stage |
| 共享下载卡 | 独立游戏无此入口 | `click_source:'cta_click'` |
| 配置的步数/通关策略 | 独立游戏无此入口 | `forced_click_to_appstore` + `auto_jump` / `auto_jump_mode` |

事件基线：2026-11-06 新读取的 [在线协议](https://developer.novvy.ai/eventLogs)，文档哈希记录在 provenance。§2.1 规定标准壳 banner 与自动策略的固定分类；独立游戏没有需单独分类的跳店位置。先结算，再请求通关跳转。按技能要求区分独立游戏与项目 SDK 组装壳；旧技能附带的 postMessage 验证器不适用于当前协议。

## 构建与检查

```sh
npm run build -w template-core/candy-crush-origin
npm test -w template-core/candy-crush-origin
node editor/test/run-all.mjs candy-crush-origin task-creation
npm run validate
```

源码位于本目录；插件为 `editor/plugins/candy-crush-origin/`；生成物为 `editor/templates/candy-crush-origin/`。

v1.0 本地已实测完整 5 次命中、原版结算、重玩、下载卡、手机与横屏、视频结束进入试玩、HUD。API 回归覆盖配置保存/回读、非法值拒绝、pack 失效、视频必需生成物、两种 ZIP 及重打包。单元测试是适配器/宿主模拟，不是平台真实事件证据。

v1.1 新增次数配置。适配器覆盖 1、10、71 次的目标和进度；冻结模型的几何测试逐一点完全部 71 颗，包含背面剩余糖果恢复。配置/导出 HTTP 回归通过 60 项，任务创建通过 15 项。几何测试不等于浏览器完整 71 次实玩。v1.1 浏览器已通过工作台保存 10 次、重新打包，并实际点完 10 颗：第 5 次仍继续，第 10 次爆炸结算，未捕获游戏错误日志。当前任务示例保留 10 次。

**平台事件验收未完成**：尚未取得官方「试玩日志调试」的实际消息与 Tracking 对应报告；缺少登录页面地址。开发文档页被内置浏览器拦截。浏览器不允许 file 协议，因此真机广告 WebView / file 离线运行也未实测；已做本地依赖与包结构检查。详细最终包哈希与检查记录见 `verification/report.json`。
