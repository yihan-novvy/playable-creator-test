# Color Block Jam 原版模板

模板 ID：`color-block-jam-origin`。保留 Insightrackr 原版 Cocos Creator 3.8.2 三关滑块玩法及素材：2、15、15 个可消除方块，第二关的固定障碍和第三关的异形块、方向限制保留。

- 工作台：<http://127.0.0.1:8094/task.html?id=color-block-jam>
- 项目预览：<http://127.0.0.1:8094/result/color-block-jam/index.html>
- 项目组装 ZIP：`result/color-block-jam/assembly.zip`，约 3.59 MB。
- 独立游戏 ZIP：`result/color-block-jam/game-only.zip`，约 3.57 MB，根目录只有普通脚本 `game.js`。
- 插件：`editor/plugins/color-block-jam-origin/`；生成目录：`editor/templates/color-block-jam-origin/`。

## 来源与构建

[App Store](https://apps.apple.com/us/app/color-block-jam/id6504332779) 对应 Rollic Games。[Insightrackr 素材详情](https://data.insightrackr.com/creative/preplay/detail/c8247db37c9c2be442420a9698da0344) 的预览与商店 ID 一致；不额外声称素材由发行商亲自制作。筛选时观察到 Mintegral、约 19 亿展示估算和 461 天生命周期，只作为选材信号。

原始完整 ZIP、下载入口 HTML 和 SHA-256 保存在 `source/`。构建校验原始字节和补丁唯一锚点，保留游戏与资源，将资源脚本置于每个实例的私有作用域，移除原广告渠道、原版每两次按压跳店与引擎导航/Worker 分支。所有资源内嵌，无包内 fetch/XHR 文件读取。适配层调整原生相机、背景和提示位置以避开宿主 HUD 与 CTA，画布保持全屏。

```sh
npm run build -w template-core/color-block-jam-origin
npm test -w template-core/color-block-jam-origin
node editor/test/run-all.mjs color-block-jam-origin
npm run validate
```

不要编辑生成文件。插件在必要的任务创建、Origin 配置验证/失效白名单和根构建入口注册，未改动其他模板玩法。

## 默认配置与事件边界

片头、顶部 HUD、同段重玩默认关闭；开启片头后视频结束自动进入试玩，旧 GO 设置也被停用。共享下载卡默认显示；工作台「CTA 卡片」与 Tasty Travels 对齐，可配置按钮文案、引导文案和按钮颜色（默认绿色 `#10b981`），文案留空时使用默认值。颜色只用于底部卡片及其阴影，结算弹窗重玩按钮保持金色。卡片显示时停用原生下载条及其命中，关闭共享卡时原版下载条恢复。独立游戏保留原生下载入口，平台可用 banner 占位替换。

自动跳转默认开启：第 12 次有效操作首跳，随后间隔 8、6、4，末项每 4 步重复；空列表只首跳。步数策略尚未触发时，最终通关兜底一次；已触发则不因通关再跳。也可改为仅最终通关模式。卡片和自动策略独立开关；设置修改后必须重新打包。

有效操作是一次手势提交到不同格点或消除方块；挪动但没有消除仍计一步，进度只按本关已消除数量计算。中间关 `shell.win({continuePlaying:true})`，下一关 `shell.level(n)`，第三关 `shell.win()`。原版没有失败、原生重试或跳过控件。项目开启重玩时显示居中遮罩结算弹窗：成功按钮为 `Retry`，失败分支为 `Try Again`。点击仅请求一次 `forced_click_to_appstore`，暂停旧局并禁用按钮；必须观察到页面或宿主不可见，再恢复可见，才重建第一关。保持同一 playable stage，不重播片头；弹窗内 Continue 可结束当前段。加载失败单独显示 Reload，不算玩法失败，也不重复跳店。当前示例任务已开启重玩，模板默认值仍关闭。

`game.js` 同步注册 `NovvyGame(entry)`，仅使用 shell API；宿主 SDK、第一触摸、视频、HUD、卡片与自动策略在项目组装层。用户确认的两个主动下载位置为 `cta_click`，自动策略和新增成功/失败重玩入口为 `forced_click_to_appstore`，原始答复见 `verification/cta-decision.md`。

## 验证状态

**模板实现与本地试玩通过；官方事件验收未完成。**

- 自有构建、源哈希、确定性构建和适配器/生产宿主内存测试通过。
- 模板编辑器 46 项、共享 Origin 配置 243 项、配置合并 10 项通过；注册表 0 警告。
- 最终游戏在真实浏览器通过拖拽自然完成全部三关，显示原生结算页；结算下载、底部卡片及原生下载条均实点，自动策略出现本地预览调用。最终会话无控制台错误或警告。
- 临时 6 秒视频自动结束并进入试玩，遗留 GO 不阻塞，切入后实际消除蓝块；测试视频和任务不进入交付。
- 390×844、320×568、844×390 布局检查；横屏 DOM 实测根容器与 canvas 均为 844×390。小屏/横屏截图为 HUD 开启、共享卡关闭的测试配置；默认首屏为共享卡开启。
- 独立 ZIP ≤5 MB，组装 ZIP ≤10 MB、解压 ≤30 MB，最终 ZIP 已执行包预算与静态检查。

本次读取并最终重新核对的 [事件文档](https://developer.novvy.ai/eventLogs) 是 2026-11-05 更新的 `NovvyGame` 协议；文档哈希未变。已安装事件 skill 的旧 `postMessage` 检查器不适用于该协议，没有使用它制造通过结果。项目中的 `scripts/verify-artifacts.mjs` 检查当前注册契约、脚本、依赖和最终包；它不是官方事件验收器。

[novvy-playable-events SKILL.md](/Users/code/.codex/plugins/cache/workspace-directory/novvy-playable-events/3.0.0/skills/novvy-playable-events/SKILL.md) 明确要求 “Upload the final creative to the official platform's **试玩日志调试** page”。该平台仍在登录页，缺少实际接收/丢弃消息、Tracking 上报、关联时间戳和最终汇总证据，因此 `event_verified=false`。浏览器工具禁止 `file://` 导航，未绕过；iOS/Android 广告 WebView 尚未测试。同段重玩、仅通关自动策略、声音和暂停恢复有代码/内存回归，尚未完整重复真实浏览器验证。

完整限制、产物 SHA-256 与证据索引见 `verification/report.json`。`final-local-session.json` 是本地产品预览控制台原始记录，不是官方平台事件日志。没有提交、推送或发布。

## 2026-11-06 结算弹窗调整

本轮重新读取完整最新事件文档，未修改独立游戏载荷。生成模板与示例组装包已更新，当前示例启用允许重玩。

- 使用最终组装预览真实拖拽通过全部三关，显示成功弹窗；390×844、320×568、844×390 下按钮和文案可见。实际点击 Retry 后保持 Waiting，不在后台提前重开。
- 宿主内存回归覆盖成功/失败、单次 CTA、冷却/SDK 拒绝、两个可见性信号、回访才重建、缓存页面返回、失败重建恢复、旧实例回调屏蔽、阶段连续和自动策略重新计数。失败分支来自内存回归，原版没有自然失败条件。
- 本地预览无真实广告 SDK，不会实际打开商店；IAB 切换标签未产生页面隐藏信号，没有将它冒充回店。生产 SDK 跳店/回店及对应 Tracking 上报仍未实测，官方调试页仍需登录。
- 本轮截图、原始本地控制台、文档、包哈希和检查结果见 `verification/replay-modal/`；`verification/report.json` 等原报告保留为上一版历史证据。
