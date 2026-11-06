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
- 原版 TRY NOW、全屏下载和完成四个词后的自动跳店已禁用。下载位置的 `click_source` 尚待用户确认，当前候选没有可跳店控件，配置也不能直接启用 CTA。
- 示例任务 `word-search-explorer` 开启标题与重玩、关闭片头，便于复查。示例设置不改变新任务默认值。

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

`WSE_CONTEXT.step` 接在原版成功处理器 `He++, ai++` 后，向壳调用 `shell.step(percent)`；最终调用一次 `shell.win()`。独立游戏不发送 ready、原生消息、SDK 统计或商店跳转。项目组装壳负责视频/试玩阶段、首次输入、重玩及关闭统计。重玩销毁旧实例后创建新实例，保持当前 playable 阶段，不重播片头。关闭统计依赖宿主页面离开；真实广告宿主的关闭回调仍需平台验收。

当前协议已于 2026-11-06 重新读取；本地适配器测试和浏览器试玩通过，但**官方事件验收未完成**。不要将候选包标注为可投放或事件验证通过，详见 [VERIFICATION.md](VERIFICATION.md)。
