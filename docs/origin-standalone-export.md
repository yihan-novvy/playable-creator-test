# 独立 game.js 交付与统一接口

本次范围是 14 个模板，不包含 Colorever 系列、Escape Arrow 和 Dragon Cube 系列。已安装的第三方 Novvy 插件不作任何修改。

## 文件与构建

运行 `npm run build:standalone`，只构建这 14 个模板：

- 模板内的正式单文件产物：`editor/templates/<template-id>/standalone/game.js`
- 集中交付副本：`result/standalone-games/<template-id>/game.js`
- 机器可读清单：`editor/templates/standalone-catalog.json`、`result/standalone-games/catalog.json`

每个游戏只需要自己的 `game.js`。图片、声音、字体、固定关卡、CSS 和引擎均已内嵌，没有配套 assets 目录，也不需要 ZIP。JS 内含 deflate 数据和同步解码器；构建在压缩前检查源码，校验压缩往返一致性，并实际执行最终文件检查同步注册。每个最终 JS 按原始文件字节数限制在 5,000,000 字节以内。

编辑器预览、完整 ZIP 和「下载独立游戏 ZIP」统一读取 `standalone/game.js`。默认配置与集中交付副本逐字节一致。`game/game.js` 只保留为构建中间产物，不再由这 14 个模板的 editor 加载或交付。

任务修改 Grill 倒计时、Tasty 出球档位或 Water Sort 关卡时，由同一 `packageGame` 流程将配置烘焙进成品。相同配置的预览和两种 ZIP 使用完全相同的 JS；不同玩法配置会生成不同的 JS。重玩开关、剧情、片头、标题和 CTA 属于外壳，不改变游戏成品。Water Sort 每份成品只含当前任务的一关，无运行时关卡选择器。Tasty 剧情模式也使用同一独立游戏，剧情音频由外壳管理。

升级前打出的旧包会标为过期，需要重新运行「打包」；这样不会继续下载之前的中间产物。新包的 `game-only.zip` 仅含这个 `game.js`，完整 ZIP 另外包含外壳 HTML、视频等素材。

14 个模板是 Block Out、Candy Crush、Color Block Jam、Freecell、Grill Sort、Pixel Flow、Project Makeover、Screwdom、Tasty Travels、Travel Town、Water Sort、Word Search Explorer、Zen Word 100m、Zen Word 92m。

所有输出固定玩法数据，不提供运行时图案/关卡选择器。Block Out 的教学盘及后续盘是同一次试玩内的固定两关；Color Block Jam 是固定三关。其他为单关。Travel Town 的两项修复目标属于同一房间内的玩法。平台上传时 `level_count` 使用清单值；当前进度均按目标完成度计算，`playable_type` 使用 `level`，包括带失败倒计时的 Grill Sort。

## 入口与方法

文件作为普通脚本加载，同步调用一次官方 `NovvyGame(entry)`。外壳调用 `entry(root, shell, options)`，等待 Promise 返回运行实例。返回前会准备首屏，并暂停输入、游戏循环和音频；外壳调用 `start()` 后开始玩法。

所有模板返回同一组方法：

| 方法 | 行为 |
|---|---|
| `init()` | 幂等初始化；入口已完成初始化，重复调用返回同一个实例 |
| `start()` | 开始一次，返回 Promise；不重复创建游戏 |
| `pause()` / `resume()` | 暂停/恢复输入、动画、计时和音频 |
| `replay()` | 外壳开启重玩时，销毁上一实例并重建当前单关；成功返回 `true` |
| `end()` | 外壳主动结束本段，调用官方 `shell.end()`；重复调用无效 |
| `destroy()` | 幂等释放实例的 DOM、监听、定时器、音频和引擎资源 |
| `setEnv(patch)` | 合并环境，包含 `muted/language/platform/viewport/insets/safeArea`；语言支持受各原版资源限制 |
| `setMuted(boolean)` | 外壳控制静音，不伪报用户点击声音按钮 |
| `setInsets({top,right,bottom,left})` | 更新外壳占用空间，单位为 CSS 像素 |
| `resize({width,height,dpr})` | 更新尺寸；外壳同时负责设置 root 的实际尺寸 |
| `getState()` | 返回状态副本，包括关号、步骤、进度、结果、静音与可重玩状态 |
| `on(type, listener)` / `off(type, listener)` | 监听/移除监听；`on` 返回取消函数，`'*'` 监听全部事件 |

`options.env` 遵守官方环境协议。自定义外壳还可传入 `options.onEvent(event)`，以便收到初始化期间的 `ready`；返回实例后注册监听器不会补发已经发生的事件。

事件格式为 `{type, ...detail, state}`。统一事件包括 `ready/start/pause/resume/step/result/retry/level/end/sound/env/destroy`。`step` 携带步骤与本关目标进度，`result` 携带 `win/fail` 和 `continuePlaying`。广告首触等由官方外壳采集，不由游戏重复上报。监听器是业务观察接口，不替代官方 shell 协议；不要将监听器再次接到相同的统计上报，造成重复计数。

## 结果、重玩和外壳边界

默认最终结果直接调用 `shell.win()` 或 `shell.fail()`，由官方外壳继续下一段。原版仅演示上妆过程的 Project Makeover 使用 `shell.end()`，不伪造整关胜利。

需要外壳控制重玩的自定义单关实例，可传 `{allowReplay: true}`。结果会携带 `{continuePlaying: true}`，之后外壳必须调用 `replay()` 或 `end()`；否则该段按协议继续等待。重玩完成初始化后才发 `shell.retry()`，旧实例的迟到回调被丢弃。已经最终结束、销毁、正在重建或达到 50 次重试时，`replay()` 返回 `false`。多关游戏保留原生逐关流程，不启用整段伪装成本关重试。

项目组装壳需要保留原生结算弹窗的延迟显示和动画时，可传 `{keepResultScene: true}`。结果仍立即上报，后续玩法输入与步骤被锁住，但原生场景继续渲染；后台 `pause()` 和返回后的 `resume()` 仍控制结算画面。`end()` / `destroy()` 停止它。此选项默认关闭，不会添加 CTA；Zen Word 1 亿版的项目组装壳启用它，避免失败后原生弹窗出现前就暂停引擎。

Block Out 各关进度分别按 2 块、37 块计算。首关成功后报继续，下一关真正加载后发 `shell.level(2)`；Color Block Jam 同样逐关报告。重试累计步数/进度，进入下一关才归零。

CTA-card、下载按钮、商店跳转、自动跳转策略、片头视频均属于外壳。独立游戏没有可用的广告跳转入口；原生转换点击已禁用或移除。外壳依据真实 `step/result` 决定自己的动作。

## 验证与限制

- `npm run test:standalone`：统一状态机、事件、实例隔离、异步重建取消、最终文件注册和字节预算。
- 各模板原有回归测试：冻结来源、真实游戏回调、目标进度及资源构建。
- 编辑器相关回归测试：生产打包、预览和旧流程兼容。
- 本机浏览器检查：加载本次最终文件，复用现有生产外壳，禁止外部网络并静音，检查真实画面及开始/暂停/恢复/尺寸/销毁。

按用户要求不登录、不上传。以上是本地检查，不等于 Novvy 官方「试玩日志调试」验收；尚无平台收下/丢弃记录或 Tracking 请求证据。

协议：<https://developer.novvy.ai/eventLogs>，2026-11-09 重新获取；文档 SHA-256 为 `d8e11c14e3fc42db79a652c83e318f32f2342eb0e3b03db458ba93e1ef7e4b39`。
