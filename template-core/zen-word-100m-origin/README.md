# Zen Word · 1 亿展示版

模板 ID：`zen-word-100m-origin`。独立模板，固定使用 1 亿展示版的 Luna / Unity 原版素材，没有版本切换。展示量为 Insightrackr 估算。

| 版本 | 原始来源 | 保留的规则 |
|---|---|---|
| 1 亿 · 7 字母 | [fe76dcc7…](https://data.insightrackr.com/creative/preplay/detail/fe76dcc7d4fd5a1f8068be03541da845) | 填完全部单词胜利，答错 3 次失败 |

`source/` 保留下载原字节、哈希、稳定来源和用户的 CTA 分类决定。构建时校验哈希、脚本/资源数量与替换锚点；广告网络包装不进入成品。保留原版素材、单词、字母、动画和音效；按用户后续要求调整内部布局、移除 Play Free，并把胜利条件改为填完整盘。

本包的玩法类型、单关声明、所需验证分支及 CTA 映射保存在 `source/100m-requirements.json`；原始用户决定独立保存在 `source/cta-decision.md`。这些文件声明待验收范围，不代表官方平台已验证。

```sh
npm run build -w template-core/zen-word-100m-origin
npm test -w template-core/zen-word-100m-origin
node editor/test/run-all.mjs zen-word-templates template-showcase task-creation
npm run validate
```

生成到 `editor/templates/zen-word-100m-origin/`，插件位于 `editor/plugins/zen-word-100m-origin/`。构建产物不手改。模板库入口为 `/templates.html#zen-word-100m-origin`。

工作台支持片头视频/海报、HUD 两行标题、允许重玩。已移除「倒计时结束后显示 GO 按钮」和「GO 按钮文字」；视频结束后自动进入试玩，已有任务的旧 GO 设置也不再生效。默认视频与额外标题关闭，重玩与步数跳转开启。无需视频即可打包。片头复用 `core:intro`，导出使用转码视频。配置变动使旧包失效。新建任务列表同时保留 Tasty Travels。

## 两种导出

- **项目组装 ZIP**：当前 playable-creator 的 `index.html + game.js`，可带视频与海报。项目壳负责标题、视频、重玩及现有 `NovvyPlayable` SDK 转接；须经过项目既有 SDK 注入流程才能向广告宿主报告事件。
- **独立 game.js ZIP**：仅本模板的原版游戏，顶层注册 `NovvyGame(entry)`，不含 HTML、项目壳、SDK 或测试工具。供 [2026-11-05 版 Novvy 协议](https://developer.novvy.ai/eventLogs)的游戏上传使用。视频、标题、结束卡及重玩由平台组装页配置。

两种包用途不同，不能把项目组装 ZIP 当作新版平台的游戏 ZIP 上传。本模板的独立包约 3.15 MB。pack 校验独立包 5 MB、组装包 10 MB、展开 30 MB 上限。

## 事件与生命周期

每个实例创建自己的作用域、DOM、引擎和资源；`start` 才开启运行，暂停/恢复由壳控制，销毁释放帧、计时器、事件、音频与 WebGL。作用域代码从本地 creative_platform 的 engine-scope 实现移植，补充了 Luna 的 Function 身份判断兼容、独立输入与生命周期处理；运行时不依赖该仓库。

- 1 亿版：`GameMgr.OnCorrectInput` → `step`（已填新词数 / 全部单词数 × 100%），`OnVictory / OnLose` → `win / fail`。
- 原版 `TZ_Script.ButtonOnClick` 停用，Play Free 隐藏。项目组装壳的共享下载卡沿用 `cta_click`，独立 game.js 没有下载入口。用户决定原文见 `source/cta-decision.md`，组装壳映射见 `source/assembly-requirements.json`。原版定时/结束自动跳转停用。
- 游戏载荷不接触宿主 SDK，不自行发送消息或访问 Tracking。单关，不发送 `level`。原版无独立声音按钮，静音由 `options.env.muted` 控制。

## 验证状态（2026-11-06）

构建、注册表、文件哈希、语法、离线资源打包、生命周期与语义适配器单元测试通过。工作台回归覆盖新建、配置保存、其他版本拒绝、旧包失效、两种 ZIP 导出、片头上传/转码/组装、HUD 更新失效。真实浏览器已检查两版横竖屏、1 亿版失败与重玩、9200 万版第五次提交结束与重玩；原版字体有 underline 缺字警告，未观察到本次最终预览的脚本错误。

**官方事件验收未完成**：没有在官方「试玩日志调试」页完成全程过关、两处 CTA、真实消息/Tracking 对应关系与真机广告 WebView 验证。本地预览及单元测试不等于生产事件验收。已安装事件 skill 的固定事件校验器仍针对旧 postMessage / HTML 形式，未把它当成新 game.js 协议的有效认证；固定 package-only 检查已用于最终组装 ZIP。

本次本地预览任务：`zen-word-100m`（为方便体验，开启了壳层重玩；模板默认现已开启）。最终导出在各自 `result/` 目录。详细包哈希及验证范围记录在 `project/zen-word-source-review/template-validation.json`。

## 独立模板拆分

原双版本模板已拆为 `zen-word-100m-origin` 和 `zen-word-92m-origin`。本模板只保留 1 亿展示版原始文件及构建产物，工作台没有素材版本选择。旧任务按原 `levelId` 迁入对应模板，任务 ID、上传和其他配置保留，旧 pack 失效后重新打包。迁移工具为 `editor/tools/migrate-zen-word-templates.mjs`。本次拆分保持游戏代码及 CTA 分类不变。

拆分后重新验证：两套源项目构建及测试、注册表零警告、独立模板/迁移/导出 48 项、模板库 65 项、任务创建 18 项、既有 Origin 编辑 243 项和配置 10 项通过。两个独立 game.js 与拆分前对应版本逐字节一致。官方事件验收状态仍为未完成。

## 1.1.0 全屏与安全区

画布和背景始终铺满容器；`src/layout.js` 只调整原生棋盘、字母盘、输入条、进度与生命值的位置及缩放。触摸碰撞体随原节点变换，规则保持不变。HUD 采用 64px 竖屏保底安全区与系统 safe-area 的较大值；宿主把实际标题和共享下载卡高度传为 `env.insets`，游戏不读取宿主 DOM。开启 HUD 时隐藏原版重复标题。

底部卡片默认开启，使用原 HTML 中的 Zen Word 图标；工作台可关闭卡片、修改按钮与引导文案。预览和成品共用注入逻辑。当前 `zen-word-100m` 示例开启标题及重玩。

本次检查：源码构建/哈希/语法/生命周期和布局边界测试、模板回归 51 项、注册表零警告；真实浏览器检查 390×844、320×568、844×390、HUD 开关、错误选字、三次错误失败和重玩后再次选字。最终组装包约 3.28 MB，独立游戏包约 3.15 MB。未完成实际完整成功通关、官方日志/Tracking 与真机 WebView 验证，不能据此称为事件验收通过。


## 1.2.0 全盘通关、重玩与步数跳转

`CreatWordBox` 创建真实棋盘后，胜利目标取 `wordBoxList.Count`，同时重建完整进度数组。沿用原生正确提交回调；当前英文棋盘 33 词，第 3 和第 32 词均不胜利，最后一词才显示原版 Great 面板。重复和错误提交不记步，原版三次错误失败保留。

项目组装壳默认允许重玩；新实例启动就绪才报告重玩，连点只重建一次，失败保留重试入口。每轮重置棋盘、生命、操作计数及跳转阈值，不重播片头、不重复声明阶段，不在重玩按钮上新增 CTA。

工作台支持步数跳转开关、首跳步数和后续间隔。默认第 20 步，之后 10、8、6、4，耗尽后重复 4（20/30/38/44/48/52…）。本局只有 33 个新单词，所以可到达 20/30；下一局重新计数。步数策略使用用户确认的 `forced_click_to_appstore`，底卡为 `cta_click`，两者共享 1 秒冷却。策略只在项目组装壳中；独立 game.js 只报告成功步骤，上传新版平台后需在组装页设置对应自动跳转。

自动回归覆盖原生正确提交函数的完整 33 词进度、提前胜利拦截、动态棋盘目标、一次胜败、步数序列、CTA 分类/去重、重玩就绪/失败恢复/阈值重置、配置保存与打包。模拟回调测试不等于真实手动全盘通关；官方事件、真实商店与真机 WebView 验收仍未完成。
