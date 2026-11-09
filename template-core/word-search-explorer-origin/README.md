# Word Search Explorer 原版模板

模板 ID：`word-search-explorer-origin`。来源是 Insightrackr 的 Mintegral iOS 素材，指纹 `a8e27465202d6b2e256e5e416385f713`，观察到的估算展示量约 1606 万。内嵌商店 ID 与用户指定的 [App Store](https://apps.apple.com/us/app/word-search-explorer/id1602508478) 一致；这不能单独证明素材作者身份。

原始 HTML 保存在 `source/original.html`，来源、筛选条件、下载方式和 SHA-256 见 [provenance.json](source/provenance.json)。网站下载控件不可用后，下载了页面已经展示的同一公开素材地址，没有复制登录凭据或签名参数。源文件保持冻结；构建脚本验证源哈希及每个补丁锚点。

## 保留的玩法

保留原版 Phaser 引擎、7×11 网格、17 项目标、随机填充字母、彩色连线、勾选反馈、动画与音效。清单里的两项 KIND 使用相同坐标，须选择两次，沿用原始数据。没有倒计时或失败分支。

成功找出一个尚未完成的目标才计一步，进度为 `已完成项 / 17 × 100`；第 17 项后结算成功。无效拖选不计步。没有改成另一套找词游戏，也没有生成替代关卡。

## 设置与产物

- 新任务默认关闭片头、HUD 标题和重玩。支持可选片头视频/海报、主副标题、结算重玩。
- 片头或倒计时结束后自动开始试玩；旧任务的 GO 配置也会被忽略。
- HUD 开启时隐藏重复的原版顶部文案；完整画布保持铺满，内部棋盘为标题及安全区留位。
- 默认显示共享底部 CTA-CARD，使用 App Store 应用图标、名称、4.9 评分及 Play Now 按钮；工作台可关闭卡片或修改按钮和引导文案。棋盘与结算弹窗为卡片和安全区留位，视频阶段隐藏卡片。
- 通关后展示参考 FreeCell Origin 的居中结算弹窗：暗色遮罩、绿色卡片、金色按钮。开启重玩时仅显示 Play again，点击后立即关闭弹窗并加载新棋盘；按用户要求不显示 Continue。弹窗显示期间阻止底层棋盘操作。
- 卡片属于组装壳标准 CTA Banner，按当前协议第 2.1 节固定为 `cta_click`，无需再次确认分类。原版 TRY NOW、全屏下载和完成四个词后的自动跳店仍禁用；独立游戏包不包含下载卡。
- 步数自动跳转默认开启：第 4 个有效目标首跳，后续间隔 4、3、2，最后每 2 步重复；工作台可设 1–99 的首跳/间隔，间隔留空仅限制步数首跳。只有找到尚未完成的目标才计步，重复选已完成的词不计步。开启自动策略后，每局通关在弹窗绘制并完成入场动画后独立跳转一次，最后一步不再额外触发步数跳转；重玩重置本局步数、首跳和间隔索引。重玩按钮请求 `forced_click_to_appstore`（`scene=playable-replay`），并取消上一局尚未触发的通关跳转。关闭自动策略会同时关闭步数和通关自动跳转。
- 自动策略属于组装壳，固定 `forced_click_to_appstore`，附带 `auto_jump`、`auto_jump_mode`；步数请求另附本局 `step`。与下载卡开关独立，所有跳转共享 1 秒防抖。步数阈值冷却时在下一次有效找词重试；真实通关若遇冷却则等待剩余时间发出一次请求，等待期间仍可重玩。重玩遇冷却时正常开始新局，不追加延迟跳转。隐藏时暂停待发请求、恢复可见并重新显示弹窗后处理，页面销毁时取消。无 SDK 的本地预览只记录请求，不打开商店。独立 game.js 包的自动跳转由平台组装页配置。
- 示例任务 `word-search-explorer` 开启标题、重玩与下载卡，关闭片头，便于复查。示例设置不改变新任务默认值。

工作台提供两类导出：项目组装 ZIP（根 `index.html` 和 `game.js`，启用片头时附带视频/海报），以及独立试玩 ZIP（仅根 `game.js`）。独立包通过 `NovvyGame(root, shell, options)` 接口交给平台壳运行，不包含项目 SDK 壳或 HTML。

```sh
npm run build -w template-core/word-search-explorer-origin
npm test -w template-core/word-search-explorer-origin
node editor/test/run-all.mjs word-search-explorer-origin
npm run validate
```

源代码在本目录，生成模板在 `editor/templates/word-search-explorer-origin`，编辑器插件在 `editor/plugins/word-search-explorer-origin`。不要手改生成的 `game.js`。编辑器注册、配置校验和打包失效列表仅增加本模板 ID。

## 生命周期与事件边界

独立游戏返回 `start/pause/resume/setEnv/destroy`。原始引擎在实例作用域和 Shadow DOM 内运行；暂停计时、动画、输入与声音，销毁引擎及监听器。资源全部内嵌，资源读取适配器只接受 `data:` URI，不读取包内相对文件。浏览器环境信息及 `insets` 通过环境适配层传递，单词语言保留原版英文。

`WSE_CONTEXT.step` 接在原版成功处理器 `He++, ai++` 后，向壳调用 `shell.step(percent)`；最终调用一次 `shell.win()`。独立游戏不发送 ready、原生消息、SDK 统计或商店跳转。项目组装壳负责视频/试玩阶段、首次输入、重玩及关闭统计。重玩销毁旧实例并清空旧棋盘后创建新实例，保持当前 playable 阶段，不重播片头。原生引擎清理异常会记录警告，计时器、监听器和挂载节点仍会释放；旧实例清理不会阻断新棋盘加载。关闭统计依赖宿主页面离开；真实广告宿主的关闭回调仍需平台验收。

当前协议已于 2026-11-07 重新读取；本地适配器测试和浏览器试玩通过，但**官方事件验收未完成**。不要将候选包标注为可投放或事件验证通过，详见 [VERIFICATION.md](VERIFICATION.md)。
