# Origin 模板：重玩与 HUD 标题

用于本项目原版 playable 的 editor 集成。先读目标模板的 `plugin.json`、`workbench.js`、组装函数和引擎适配器，再选相似案例。下面是 2026-10-30 核对过的实现基线；后续代码或用户要求优先，不把游戏特有的数字、节点名和默认值复制到新模板。

## 现有模板对照

| 模板 ID | `gameplay.allowReplay` 默认值 | 结算与重开方式 |
| --- | --- | --- |
| `tasty-travels-origin`（Tasty Travels） | `false`，旧任务缺字段也关闭 | 最高合成等级成功、越界失败；从缓存重建 `GameScene`，恢复初始食物、订单、金币与引导 |
| `grill-sort-origin` | `true` | 完成打包成功、倒计时耗尽失败；重建缓存中的原生场景，恢复物件、引导和配置倒计时 |
| `freecell-origin` | `false`，旧任务缺字段也关闭 | 收齐纸牌成功、无可用移动失败；重建原生牌局并重新发牌 |
| `block-out-origin` | `false`，旧任务缺字段也关闭 | 原生最终成功或失败；复用应用和场景，重建第一关并重置整段进度 |

四者在工作台「游戏设置 → 允许重玩」控制。成功按钮为 `Play again`，失败为 `Try again`。原素材同名按钮可能只是商店入口，要沿实际回调确认重开能力。新模板的默认值应明确写入配置和缺字段回退逻辑，调整已有模板时保留兼容语义。

参考实现：`editor/plugins/<id>/workbench.js`、`plugin.json`、`overlays/engine/engine.js` 与 `events.js`；Grill 的当前重玩说明也见 `template-core/grill-sort-origin/README.md`。

## 同段重玩契约

1. 区分可操作、已结算、正在重建、阶段已结束。只在游戏已结算、重玩已启用且没有重建中的请求时接受重玩；不要让按钮连点、原生结算动画与异步回调启动多次重建。
2. 真实胜负每局只报一次 `NovvyPlayable.onComplete({ result, continue_playing: true })`，让当前阶段仍可继续；关闭重玩时按最终结果结束阶段，隐藏或拦截原生重玩入口。成功/失败来自游戏状态，不能把原版触摸统计、CTA 或第一关完成当成最终成功。
3. 重玩按钮标记 `data-novvy-replay`；模板用 `window.__novvyReplayable` 声明开关，相关结果和 CTA 事件携带适配桥需要的 `replayable` 信息。点击先派发一次 `novvy:replay-cta`，通过共享 CTA bridge/下载卡链路请求跳转，再重置本局。不要另调 `window.open`、原版商店函数或第二次 SDK click。
4. 重建期间禁用按钮并阻止旧局输入。恢复原生棋盘/场景及引导，等新场景可用（必要时等首次绘制）后才清除结算状态、隐藏结果面板并调用一次 `NovvyPlayable.onReplay()`。同时派发 `novvy:playable-replay`，重置共享桥的本轮状态。
5. 场景加载或重建失败时保留可见结果和重试入口、恢复按钮，不发送成功的 `onReplay`，不让用户卡在 Preparing 状态。

重玩留在当前 playable stage：不刷新整页、不重新启动应用、不重播片头、不重复 `setStageList`/`setStage`。SDK 的阶段累计时间和计数保留；要归零的是游戏本局的有效操作数、目标进度、结算闩锁、CTA 首跳阈值和循环间隔索引。多关组成一个 playable 时，按整段重新开始，不能只恢复画面而沿用上一局计数。

### 原生资源和状态清理

- 重开前清掉旧局的定时器、补间、粒子、选中态和事件订阅，释放旧实例/单例引用；复用已加载的资源，避免重新解压、加载引擎或堆积监听器。
- 按真实引擎恢复棋盘、计时、订单、金币、暂存格、教程等状态。Tasty 的订单订阅与金币补间、FreeCell 的牌局动画、Block Out 的关卡切换锁、Grill 的完成计数均有各自的清理入口，不宜套用通用的“清空 DOM”。
- 背景音乐不随重玩叠加启动。按音轨复用存活实例，暂停的轨道按可见性恢复；原版有多条不同音轨时分别保留，不能为了去重只剩一条。Tasty 参考两条原生 BGM 的复用，Grill 参考暂停音轨与缓存资源的处理。
- 场景替换后再次应用布局、触摸映射和声音/可见性约束。跳商店回来必须仍能继续操作，隐藏或不可见时不得因原生 resume 回调提前播放声音。

### CTA 去重与预览

沿用 `originCtaBridge()` 和 `editor/core/overlays/cta-bridge/cta-bridge.js` 的语义：重玩转换为 `click_source:'forced_click_to_appstore'`、`scene:'playable-replay'`；下载按钮维持 `cta_click`。同一个重玩手势只能转化一次，`pointerdown`、`pointerup`、`click` 与原生 Canvas 命中不可各报一次。

当前共享桥中，步数策略已触发转化后，通关不会重复自动跳转；允许重玩的回合不武装回访后的逐次触压跳转，明确点击重玩仍可触发新的 CTA。关闭重玩时保留项目既有的完成后交互策略。Canvas 下载按钮需要延后判定命中时，复用现有桥的延迟与去重机制，避免把手动下载先算成普通触压转化。

无 SDK 的 editor 预览沿用 `__novvyCtaSdkOnly`，不调用原版跳转兜底；尤其不要让原版 `super_html.download` 回到适配器后产生递归。下载卡负责展示和交互，SDK 上报与跳转由共享桥处理。

## HUD TITLE 配置与注入

- 工作台暴露「显示顶部 HUD 标题」、主标题和副标题，分别对应 `hud.titleEnabled`、`hud.titleLine1`、`hud.titleLine2`。当前四个模板默认关闭标题；`hud.enabled` 是另一项完整 HUD/立绘配置，不能拿它代替标题开关或要求用户先上传立绘。
- 复用 `buildWsOverlayInjection({ optionalHudPortraits: true, ... })`。它允许只有标题，省去缺失的立绘和无关进度 DOM。共用注入器对缺少 `titleEnabled` 的输入按已有非空文案回退；任务的最终行为还取决于默认值与有效配置合并。显式 `false` 必须生效，不能用 `||` 把关闭值覆盖成开启。
- 文案通过安全内联的 `window.__NOVVY_UI__.hud` 注入，由 `hud.js` 用 `textContent` 填入两行并单独设置 aria label；空行隐藏。不要把任务文案写死在基础模板，或用未转义的 HTML 拼接文本。预览与导出使用同一套组装逻辑。

### 完整画布与布局

标题覆盖在完整游戏画布上，背景延伸到屏幕边缘。使用 Origin 通用组装器时，按现有实现声明 `game.hudInsideCanvas: true`，避免旧的 `data-novvy-origin-shell` 通过下移 `#origin-game` 留出顶部色带。此标记只是跳过外壳裁切；仍需原生布局适配，不能认为加一个字段便完成视觉工作。Block Out 使用自身组装和 viewport 参数，参考其实际路径。

- HUD 层通常 `pointer-events: none`，避免阻断拖拽/投放。标题位于安全区和刘海/灵动岛下方，居中；字体、最大宽度、长文案省略和横屏样式按画面调整。保留现有主副标题的层次，不能只在桌面宽屏看着合适。
- 根据标题占位 CSS 变量和可见 CTA 卡的实际高度计算玩法区域，在原生相机、棋盘容器或 viewport 中缩放和居中；标题开/关、横竖屏、resize 和重玩后都要重新计算，避免累计缩放或漂移。沿用原生 resize 的基准或先恢复基准再适配。
- 原生 logo、教程文字、关卡标题、金币/计时和下一物件提示不能与自定义标题叠字。只替换或移动发生冲突的展示，保留必要的游戏状态。Block Out 开启标题时关闭重复 logo/关卡文字；Grill 把计时器避开中央安全区；Tasty 把计数与下一物件提示安排在两侧。
- 坐标变换要覆盖输入和教程。Tasty 保留物理节点坐标，用相机调整取景，并把屏幕触摸转到世界坐标；FreeCell 缩放牌局后重算教程位置。用真实拖拽/投放确认视觉位置和命中一致。
- 为完整画布补背景时沿用原有素材并检查接缝；不因缩小游戏区域露出不相关底色。Tasty 的镜像边缘延展是该素材的实现选择，不是所有模板必须采用的方式。

布局参考：`template-core/{tasty-travels,freecell,grill-sort}-origin/src/layout.js`、各插件 `overlays/hud/`，以及 `editor/plugins/block-out-origin/overlays/engine/engine.js` 中的布局适配。修改源文件后构建生成模板，不能只修 `editor/templates/`。

### 下载卡、品牌与声音

配套使用共享 CTA card，为其预留底部空间并关闭重复的原生下载控件；游戏名和图标来自核实过的目标商店信息与本地资产，记录来源。沿用 manifest 的 `game.ctaCard` 和 `addOriginCtaCard()`，按真实图片类型内嵌，避免重绘图标、近似名称或导出时继续远程取图。

这四个 Origin 模板当前没有独立声音开关；声音由宿主可见性、页面状态和首次用户手势管理。HUD 对齐不应顺带引入新的声音按钮。保留题目/订单等必要原生文字，并检查其语言与当前广告文案一致。

## 保存、预览与重新打包

- 配置贯通 `plugin.json` 默认值 → 工作台 PATCH → `editor/lib/store.mjs` 白名单与校验 → 有效配置合并 → preview/pack 注入。`allowReplay` 必须是布尔值，部分更新不能覆盖同级标题、倒计时等设置；非法值应拒绝且不改原任务。
- 调整重玩、标题或 CTA 后使 `pack` 失效，阻止下载旧 ZIP，重新打包后使用新配置。仅改这些设置应保留已转码视频；上传/删除视频或海报则走媒体自己的失效流程。
- 工作台提示明确「默认是否开启、什么时候出现重玩、点击先 CTA 再重开、片头不重复、修改后重新打包」。查看当前任务是否启用时读任务配置，不能把模板默认值当成所有现有任务的实际值。

按 [验收与交付](verification.md) 的重玩/HUD 检查项验证；现有针对性案例在 `editor/test/{tasty-travels,grill-sort,freecell,block-out}-origin.test.mjs`、`origin-editor.test.mjs`、`origin-consistency.test.mjs` 和 `cta-continuation.test.mjs`。
