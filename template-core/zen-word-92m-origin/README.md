# Zen Word · 9200 万展示版

模板 ID：`zen-word-92m-origin`。独立模板，固定使用 9200 万展示版的 Luna / Unity 原版素材，没有版本切换。展示量为 Insightrackr 估算。

| 版本 | 原始来源 | 保留的规则 |
|---|---|---|
| 9200 万 · 6 字母 | [4bb0fa1d…](https://data.insightrackr.com/creative/preplay/detail/4bb0fa1d85e861942c6b2be730fd14c8) | 填完所有单词才结束；仅正确拼词记有效步骤；保留原版填词动画与提示 |

`source/` 保留下载原字节、哈希、稳定来源和用户的 CTA 分类决定。构建时校验哈希、脚本/资源数量与替换锚点；广告网络包装不进入成品。保留原版素材、单词、字母、动画、音效和数值；1.1.0 按用户授权在适配层调整原生节点位置与比例。

本包的玩法类型、单关声明、所需验证分支及 CTA 映射保存在 `source/92m-requirements.json`；原始用户决定独立保存在 `source/cta-decision.md`。这些文件声明待验收范围，不代表官方平台已验证。

```sh
npm run build -w template-core/zen-word-92m-origin
npm test -w template-core/zen-word-92m-origin
node editor/test/run-all.mjs zen-word-templates template-showcase task-creation
npm run validate
```

生成到 `editor/templates/zen-word-92m-origin/`，插件位于 `editor/plugins/zen-word-92m-origin/`。构建产物不手改。模板库入口为 `/templates.html#zen-word-92m-origin`。

工作台支持片头视频/海报、GO、HUD 两行标题、允许重玩、底部下载卡开关及文案。默认视频、额外标题关闭，重玩和下载卡开启；支持首跳步数与后续间隔配置。无需视频即可打包。片头复用 `core:intro`，导出使用转码视频。配置变动使旧包失效。

## 1.2.0 全部单词完成与重玩

原版实际上在第 5 次提交（包括错误提交）结束，适配层现将 `StepCount` 设为 0，只移除这个试玩截断。当前英文盘面 21 词；全部填完、最后一词动画结束才触发胜利。其他语言按真实初始词数计算，不硬编码 21。原版无失败条件，错误可继续尝试。

项目组装壳显示完成弹窗 **All words found!** 和 **Play again**。失败结果分支显示 **Try again**。两按钮按用户明确要求先请求 `forced_click_to_appstore`，然后销毁并重建本关；不等待宿主关闭回调。加载失败单独显示 **Retry loading**，重试加载无 CTA。新实例 start 就绪才报 onReplay；片头和 stage 不重复。

壳层默认正确拼词第 20 步首跳，之后间隔 10、8、6、4，最后 4 重复；重玩重置本局步数和首跳阈值。当前英文盘面只有 21 个词，单局自然可达首跳，后续阈值由内存回归验证。下载卡保留 cta_click；所有入口共享一秒防重复。刚触发跳转时重玩按钮会短暂禁用，计时器只恢复可点击状态。

这些策略和弹窗属于项目组装包；独立 game.js 仍只通过 shell 报告步骤和胜利，官方平台的跳转、结束卡和重玩须由组装页配置。

## 1.1.0 全屏与安全区

根容器、shadow mount、引擎根和 canvas 始终铺满可用屏幕；海面背景保留。宿主量取可见标题和卡片边界，通过 `env.insets` 传给游戏。竖屏 HUD 顶部至少 64px，避免宿主内联样式覆盖安全区。

构建从七种原语言场景的 RectTransform/图片节点抽取棋盘边界，不用声明容器尺寸猜测。`src/layout.js` 在原 `UIPos.Update` 之后对棋盘、字母盘、输入条和提示做整组变换；保留碰撞体、连线、提示手势及填词动画的坐标关系。横屏左右排列；HUD 关闭时恢复原生题目。小屏使用更紧凑的共享下载卡。位置每次从冻结尺寸重算，重玩或 resize 不累计缩放。

下载卡使用原载荷加载图标，文件纳入 manifest 哈希，预览和 pack 通过二进制读取内嵌。它归组装壳所有，按当前协议 §2.1 的固定 banner 分类使用 `cta_click`；不加入独立游戏。游戏内结束后点击沿用已确认的 `forced_click_to_appstore`，两入口在组装壳共用一秒节流。1.2.0 按用户新要求增加壳层步数策略与重玩 CTA，见下节。详见 `source/assembly-requirements.json`。

## 两种导出

- **项目组装 ZIP**：当前 playable-creator 的 `index.html + game.js`，可带视频与海报。项目壳负责标题、视频、重玩及现有 `NovvyPlayable` SDK 转接；须经过项目既有 SDK 注入流程才能向广告宿主报告事件。
- **独立 game.js ZIP**：仅本模板的原版游戏，顶层注册 `NovvyGame(entry)`，不含 HTML、项目壳、SDK 或测试工具。供 [2026-11-05 版 Novvy 协议](https://developer.novvy.ai/eventLogs)的游戏上传使用。视频、标题、结束卡及重玩由平台组装页配置。

两种包用途不同，不能把项目组装 ZIP 当作新版平台的游戏 ZIP 上传。本模板的独立包约 2.85 MB。pack 校验独立包 5 MB、组装包 10 MB、展开 30 MB 上限。

## 事件与生命周期

每个实例创建自己的作用域、DOM、引擎和资源；`start` 才开启运行，暂停/恢复由壳控制，销毁释放帧、计时器、事件、音频与 WebGL。作用域代码从本地 creative_platform 的 engine-scope 实现移植，补充了 Luna 的 Function 身份判断兼容、独立输入与生命周期处理；运行时不依赖该仓库。

- 9200 万版：`LetterManager.Start` 停用原生第五次提交截断；`SetColor(true, block)` 在实际移除新词后 → `step`（已完成词数 / 初始词数 × 100），原版最终填词协程调用 `GameOver` 且剩余词数为 0 才 `win`。错误、空提交、重复词不记步。
- 结束后的真实按下 → `cta('forced_click_to_appstore')`。用户决定原文见 `source/cta-decision.md`。原版定时/结束自动跳转停用。
- 游戏载荷不接触宿主 SDK，不自行发送消息或访问 Tracking。单关，不发送 `level`。原版无独立声音按钮，静音由 `options.env.muted` 控制。

## 验证状态（2026-11-06）

1.2.0：真实原版 Start/NextStep/SetColor 协程的内存测试覆盖 8 次错误提交、5/20/21 词完成边界、最终动画后一次 win、重复回调和不同盘面词数；启动 Promise 等待原生就绪。组装壳测试覆盖策略间隔、完成/失败弹窗、CTA 先于重置、冷却与加载重试。编辑器/视频/导出 78 项、模板库 65 项、配置补丁 10 项、注册表零警告通过。最终组装包约 2.90 MB，独立包约 2.86 MB，最终哈希和包体检查见 `project/zen-word-source-review/92m-full-board-validation.json`。

最终成品在 390×844 浏览器正常启动并接受连续错误拖动，未提前显示结果，canvas 边界与 viewport 相同，未观察到脚本错误。浏览器工具只有两点直线拖动，未手动拼完 21 词；完成弹窗与重玩的完整视觉路径、官方 SDK / Tracking 和真机验收仍未完成。上述协程和宿主内存测试不冒充自然通关或平台证据。

以下为历史 1.1.0 记录：

1.1.0 新增验证：390×844、320×568、844×390 的最终组装包实际拖拽、输入条和连线；第五次提交结束与重玩后的第一步；HUD 开关恢复原生标题；下载卡点击不进入游戏提交。模板导出/配置/视频组装回归 68 项通过，注册表零警告，最终两种 ZIP 哈希与构建一致，组装包 package-only 通过。未手动拼成正确单词，正确填词动画仍需真机试玩确认。

构建、注册表、文件哈希、语法、离线资源打包、生命周期与语义适配器单元测试通过。工作台回归覆盖新建、配置保存、其他版本拒绝、旧包失效、两种 ZIP 导出、片头上传/转码/组装、HUD 更新失效。真实浏览器已检查两版横竖屏、1 亿版失败与重玩、9200 万版第五次提交结束与重玩；原版字体有 underline 缺字警告，未观察到本次最终预览的脚本错误。

**官方事件验收未完成**：没有在官方「试玩日志调试」页完成全程过关、两处 CTA、真实消息/Tracking 对应关系与真机广告 WebView 验证。本地预览及单元测试不等于生产事件验收。已安装事件 skill 的固定事件校验器仍针对旧 postMessage / HTML 形式，未把它当成新 game.js 协议的有效认证；固定 package-only 检查已用于最终组装 ZIP。

本次本地预览任务：`zen-word-92m`（为方便体验，开启壳层 HUD 和重玩；模板默认标题关闭、重玩开启）。最终导出在 `result/zen-word-92m/`。1.1.0 的包哈希及验证范围记录在 `project/zen-word-source-review/92m-layout-validation.json`；历史共同记录在 `template-validation.json`。

## 独立模板拆分

原双版本模板已拆为 `zen-word-100m-origin` 和 `zen-word-92m-origin`。本模板只保留 9200 万展示版原始文件及构建产物，工作台没有素材版本选择。旧任务按原 `levelId` 迁入对应模板，任务 ID、上传和其他配置保留，旧 pack 失效后重新打包。迁移工具为 `editor/tools/migrate-zen-word-templates.mjs`。本次拆分保持游戏代码及 CTA 分类不变。

拆分后重新验证：两套源项目构建及测试、注册表零警告、独立模板/迁移/导出 48 项、模板库 65 项、任务创建 18 项、既有 Origin 编辑 243 项和配置 10 项通过。两个独立 game.js 与拆分前对应版本逐字节一致。官方事件验收状态仍为未完成。
