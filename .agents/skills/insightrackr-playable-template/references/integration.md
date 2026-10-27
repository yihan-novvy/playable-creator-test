# 项目适配与事件

## 先读当前实现

这些路径相对目标仓库。按需要读取，仓库规范是权威来源：

| 目的 | 路径 |
| --- | --- |
| 模板/插件契约 | `docs/template-plugin-spec.md` |
| 事件、段链、SDK 职责 | `docs/original-zip-required-event-integration.md` |
| manifest 与 plugin 合并视图 | `editor/core/registry.mjs` |
| 配置、前置条件、任务路径 | `editor/core/runner.mjs`、`editor/lib/store.mjs`、`editor/lib/paths.mjs` |
| 视频和覆盖层 | `editor/core/steps/intro.mjs`、`editor/core/lib/ws-overlays.mjs` |
| 共享事件桥的真实语义 | `editor/core/overlays/playable-bridge/`、`editor/core/overlays/cta-bridge/` |
| 已接入原版 playable 的案例 | `editor/plugins/colorever-origin/`、`editor/plugins/block-out-origin/` |

注意文档中的示例接口可能比运行实现旧。例如 workbench 当前可能使用 `render/saveAll`，不能直接复制文档的 `panels/preview` 示例；manifest `constants` 在注册表合并时可能展开到根，按真实合并视图取值。

## 冻结源与确定性构建

- `template-core/<id>/` 存原始来源、资源/数据、构建和测试；`editor/templates/<id>/` 由构建生成；`editor/plugins/<id>/` 存编辑器步骤、组装、工作台与广告适配。
- 原始源与派生产物分开，记录源 SHA-256。需要修改压缩核心时，用已核实的唯一结构锚点施加最小补丁，锚点数量不符就失败，不能猜混淆符号。
- 源字节保持完整；其中原有的空白或格式不为通过格式检查而全量改写。自写文件照常校验，生成文件从构建修复，不手改。
- 基础 `game/index.html` 在没有插件时也应可运行；适配器是独立边界，不能让基础入口引用一个永远没有提供的对象。引擎、资源可以拆为本地文件；模板需要的路径、常量和关卡信息由 manifest 声明。
- 按当前广告基线解决外部 CDN、模块、远程加载、音频格式、首次触摸解锁、静音和 DPR 上限。资产内嵌不等于运行时一定不联网，必须实测。保留需要的来源/许可信息。
- 新 workspace 接入根构建/测试及锁文件；生成模板版本与源版本一致。不要为新增模板引入无关依赖升级。

## 插件与工作台

- 纯试玩及视频组合共用一个组装函数； preview 与 pack 的差异主要是资源 URL/内联方式，事件和配置语义一致。
- 复用 `core:intro` 的转码和海报流程；启用视频时 `prerequisites` 必须要求对应生成物，pack 只使用转码后的媒体。纯试玩不强制上传视频。
- `plugin.json` 的步骤有且仅有一个最后的 `pack`；上传槽位、overlays、defaults 和 workbench 使用当前 schema。
- 私有步骤只通过 runner 的 `ctx` 写本任务目录；普通步骤写 generated，pack 写 result，模板目录只读。pack 重跑幂等并清掉该任务旧输出。
- 插件可以使用 core 工具，不 import 其他插件或 template-core 源码。读取参考代码可以，形成运行时跨插件依赖不可以。
- 实际测试工作台 PATCH 保存。仅在 UI 显示控件不够；当前 store 白名单可能静默丢弃新字段。必要时作最小注册调整并覆盖保存/读取验证。
- 片头负责输入、声音和可见性时，明确交接给游戏的时机。不要让后台棋盘在视频期间先玩完教程或启动倒计时。标题、原生 logo、关卡提示、CTA 和视频的层级须按手机与横屏检查。

## 事件先写语义映射，再接代码

| 语义 | 接入规则 |
| --- | --- |
| 段链 | 自带组合 ZIP 在播放前 `NovvyPlayable.setStageList`，1 起始 `setStage`；系统已提供外层视频试玩壳时沿用其内层协议，不重复管理外层段号 |
| 视频 | 标准 video 在播放/切段监听前注册一次 `NovvyAnalytics.registerMedia`；不重复发送 SDK 已监听的 media 事件 |
| 首次互动 | 宿主可捕获时不再手动 `onStart`；Canvas/iframe 不能被捕获时按真实首触补一次 |
| 有效操作 | 游戏确认的提交、放置、移动或消除 → `NovvyPlayable.onStep(step,{progress})`；不能按 pointermove、帧数或任意点击记步 |
| 进度 | 从游戏目标和当前状态推导 0–100；移动可记一步而进度不变。无法获得进度时按 SDK 契约省略，不用时间或操作数伪造 |
| 真实胜负 | 最终目标完成/真实失败 → `NovvyPlayable.onComplete({result})`；无 CTA 也要结算，动画结束与结果页回调共享一次结算闩锁 |
| 未完成离开 | 真实段结束调用 `endStage()`；后台、失焦、跳商店不能冒充结束。可恢复页面/重玩需保留阶段语义 |
| 重玩 | 支持时按文档使用 `continue_playing` 与 `onReplay`；原生换关不自动等于 SDK 新段 |
| 主动 CTA | 实际下载区域或明确点击入口 → `click_source:'cta_click'` |
| 策略 CTA | 用户要求的步数/完成/回访等策略 → `click_source:'forced_click_to_appstore'`；普通操作只在明确策略命中时触发 |
| 广告关闭 | 由真实宿主关闭信号提供 `close()`；不拿 blur、visibilitychange 或打开商店冒充 |

调用点保留 `NovvyPlayable.onStep/onComplete/click` 等公开签名的可识别形式，符合项目静态检查，但不能用不执行的空调用骗过检查。不要覆盖 SDK 对象；本地测试桩只能进入测试产物。

## 容易重复计数的地方

- 操作开始记状态与 interaction ID，结束后比较已确认状态；异步吸附、移除和 pointerup 可能同指一个动作。避免旧手势的异步回调把新手势状态再计一次。
- 原版教学关 + 正式关是否合成一个 playable stage，由实际素材流程决定。合成时 step 连续、进度分母覆盖整段；第一关结束不提前结算最终段。独立段则按各自目标重新定义。
- 共享 `playable-bridge` 可能只在 `hud-progress` 上涨时计步。若目标是有效移动计步，应选择独立明确步骤通道或合适的可选适配，不能同时直接 onStep 又让旧桥再推导一次。
- 排查原生 logo、按钮、结算全屏点击、自动定时器、mraid/window.open 等每条下载链路，只保留一个 SDK click 路径。自动触发已关闭，不代表原生“跳店后不可玩”状态也已解除。
- SDK 自动绑定的标准 CTA 与自定义 click 监听不要叠加。重新点击 CTA 可独立转化，但同一次动作不应同时经父页/子页、pointerdown/click 上报两次。
