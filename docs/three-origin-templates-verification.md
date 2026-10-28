# 三套原版 playable 模板验收（2026-10-27）

按 FreeCell → Grill Sort → Tasty Travels 顺序完成。每套均冻结 Insightrackr 原始载荷，校验目标 iOS 商店 ID，确定性构建至 editor/templates，并通过独立插件接入现有工作台。

| 模板 | 原版玩法与结果 | 浏览器实测 |
| --- | --- | --- |
| freecell-origin | 52 张牌；有效移动记步，实际收牌 / 52；原生无解失败可重玩，收齐成功 | 移牌、暂存格、收牌进度、CTA 后继续移动 |
| grill-sort-origin | 12 个烤盘、120 串；有效放置记步，实际打包 / 120；180 秒失败、打包完成成功 | 拖拽三消、2.5% 进度、180 秒自然失败且只结算一次、原生 CTA |
| tasty-travels-origin | 原版投放饮品和碰撞合成；有效投放记步，最高已合成等级 / 9；最高级成功、越界失败 | 投放、碰撞合成、11.11% / 22.22% 进度、CTA 不误投放且之后可继续 |

三套都支持片头 MP4、GO、两行 HUD 标题、CTA 节奏。默认纯试玩、HUD 关闭；示例任务打开标题。默认第 20 次有效操作首跳，后续间隔 10/8/6/4，末间隔循环。视频包只取 core:intro 的转码视频及海报，GO 前不启动玩法。

## 验证结果

- 注册表校验通过，0 个警告。
- 新增接入测试 69 项通过：FreeCell 33、Grill Sort 17、Tasty Travels 19。
- 相关回归测试 40 项通过：Block Out 30、config-patch 10。
- 三套 template-core 测试通过，包含原生收牌规则、原生三串匹配及 120 串守恒、原生合成规则和碰撞去重、确定性构建与源哈希。
- 三套纯试玩与视频 + GO 链路均经浏览器启动验证；视频段注册与切入 playable 事件由独立 QA SDK 观察。
- 三套 390×844 嵌套视口均进行真实操作：移牌、拖拽消除、投放。另测 1280×720 横屏；Grill Sort 修正引擎窗口尺寸，确保 HUD 预留区不会裁切底部。
- 三套工作台保存成功并预览打包结果；本地 API 与工作台下载入口验证 ZIP 导出。
- ZIP 全部通过 CRC 校验，根目录 index.html 及其本地脚本完整，解包字节与最终 result 一致，无测试 SDK。

## 交付

测试服务端口为 8092，原有 8091 服务未修改。示例任务：

- http://127.0.0.1:8092/task.html?id=freecell-origin-demo
- http://127.0.0.1:8092/task.html?id=grill-sort-origin-demo
- http://127.0.0.1:8092/task.html?id=tasty-travels-origin-demo

成品 ZIP 大小分别为 1,303,757 / 1,610,582 / 2,947,348 字节。登录资料、临时签名 URL、测试 SDK、测试任务、合成测试视频均未进入源码与成品；临时 QA 项目及结果目录已清理。

## 未验证范围

生产广告 SDK、真实手机广告 WebView、三套最高目标完整通关尚未实测；成功分支以真实原生规则测试及适配器测试验证。浏览器安全策略禁止 file: 协议，因此双击本地 HTML 启动未验证；已验证本地 HTTP 启动及包内资源完整性。此次运行的是上述目标测试，并非全仓测试套件。

## 2026-10-28 一致性修复复验

- Block Out、FreeCell、Grill Sort、Tasty Travels 复用 Colorever 的 core CTA bridge；统一 `cta-card`、`cta-moment`、`playable-complete` 和 `post-complete-interact` 场景。已发生步数转化时，最终通关不重复自动转化；Canvas 原生下载点击优先于普通回访触压，避免同击双报。
- Grill Sort 在原生 `releaseDone` 打包完成时补报进度，Tasty Travels 在真实合成时补报；100% 必须先于成功结算。异步读数使用当前 step，不推进 CTA 计数；SDK 的 interaction_count 不等于严格去重的手势次数。
- 三套新模板在线预览使用当前上传视频，视频 URL 带文件版本。五套 Origin 模板修改标题、片头、GO、CTA 或图案后使旧包失效，文本保存后立即更新工作台。更换/删除视频或海报会使片头处理和打包失效；API 拒绝导出旧包或使用未更新的转码文件打包。
- 628 项目标检查通过：新增 origin-consistency 64、origin-editor 148；既有四模板 99、Colorever Origin 215、playable-bridge 65、cta-continuation 27、config-patch 10。注册表 0 个警告。
- 浏览器实测：标题修改后旧 ZIP 入口隐藏；Tasty 第二次投放后的合成自动补报 11.11%，不需要第三次投放；Grill 第三次拖拽后的打包自动补报 2.5%，不需要第四次拖拽；原生手动 CTA 使用 cta_click / cta-card。
- FreeCell 原生按钮保留动画，将延迟 300ms 的下载上报改为手势内即时上报，避免通关后的双报；真实浏览器确认点击后仅一次手动 CTA，且可继续移牌。Block Out 的有效拖动和手动 CTA 也通过实测。
- 四个示例任务已重新打包，修复验证服务位于 8093；旧 8091/8092 进程未重启。临时 QA 任务与测试 SDK 已清理，正式示例不含测试 SDK。
- 原冻结 HTML、游戏构建产物与默认 CTA 节奏未改。最高目标的 100% 时序用原生回调/适配器测试验证，尚未新增真机 WebView 或生产 SDK 投放验收。
