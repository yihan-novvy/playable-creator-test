# Escape Arrow playable

原生 JavaScript + Canvas 2D 的箭头逃脱模版。复用 Unity2022_EscapeArrow 前 100 关的网格、箭头路径与配色，使用轻量二维渲染；不需要 Unity WebGL 或 Three.js。

## 构建与检查

在仓库根目录运行：

```sh
npm run build -w template-core/escape-arrow
npm test -w template-core/escape-arrow
node editor/test/run-all.mjs escape-arrow playable-bridge
npm run test:browser -w template-core/escape-arrow
npm run test:gallery -w template-core/escape-arrow
npm run test:replay -w template-core/escape-arrow
```

构建确定性输出 `editor/templates/escape-arrow/`，无需运行时模块加载、关卡 fetch 或 CDN。直接打开其中 `game/index.html` 可离线试玩第一关。浏览器验收需要本机 Playwright Chromium，逐关使用真实指针点击通关，并验证缩放、拖动、通关重玩、片头片尾、双关、SDK 结算和 editor 工作台。截图保存在命令输出的系统临时目录。

## 原始数据与素材

来源：`Unity2022_EscapeArrow/Assets/TheVayuputra/ArrowGame/`。

- `Resources/Levels/Level_1.json` 至 `Level_100.json` 原样保存到 `src/levels/`，原项目第 48 关的文件名 `LeveL_48.json` 也能识别。
- 构建产物添加 `Index` 编号；原始 `GridXSize`、`GridYSize`、`Arrows` 保持不变。
- `Indices[0]` 是箭头头部，朝向为头部减第二个格子，格子编号为 `y * width + x`。
- `GUI/HandIcon.png` 作为教程手势，`GUI/HintIcon.png` 作为灯泡提示按钮；应用图标采用原项目 `StoreAssets/google-play/app-icon-512.png`。
- `Sound/` 中的六段音频转换为单声道 AAC/m4a。游戏内不提供音乐开关；首次用户操作解锁音频后，背景音乐在游戏和通关/失败结算中持续循环。隐藏、不可见或播放覆盖视频时暂停游戏声音，回到试玩后恢复。

从相邻 Unity 工程重新同步：

```sh
npm run sync:unity -w template-core/escape-arrow
# 仅同步关卡，保留现有音频与图片：
npm run sync:unity -w template-core/escape-arrow -- --levels-only
# 指定另一份 Unity 工程：
npm run sync:unity -w template-core/escape-arrow -- /absolute/path/to/Unity2022_EscapeArrow
```

同步只读取 Unity 工程，不修改原项目；仅导入前 100 关，并清理本模版中超出范围的关卡。转换音频需要 ffmpeg。同步后重新构建；构建会清理旧的生成产物，确保 editor 和试玩页也只包含 1–100 关。

## 规则与操作

playable 内部使用英文；editor 编辑控件、配置说明及试玩总览外层界面使用中文。点击箭头身体的占用格子，沿头部朝向检查到棋盘外的射线。无占用格便成功逃出，并立即释放逻辑占用；可见身体沿自身路径抽离，每格在尾部移开时同步出现该箭头颜色的圆点。受阻时沿路径前进后退回，同一根箭头仅首次受阻扣一条命并标为虚线。所有箭头逃出即胜利。

受阻虚线参考原版 LineDashed 材质：箭身以清楚留白的短线段呈现，保持原颜色与亮度，箭头头部为实线。首次回弹结束当帧显示虚线，已标记箭头再次移动时继续保持虚线。

支持单指拖动、双指缩放、滚轮缩放、缩放按钮、回到中心和提示，统一使用深色主题。密集棋盘可进一步放大，提示会放大并定位可逃出箭头。点击和拖动分别判定；棋盘适配可用空间，像素比上限为 2。

成功逃出按可见路径距离匀速推进，最短 380ms；较长箭头按每秒 64 个网格单位计算。尾部离开 Canvas 后即结束，不额外消耗视口外的移动距离。

`gameplay` 配置每局的生命、提示和重玩：`lives` / `hints` 可设为 `"unlimited"` 或 1–99 的整数，`allowReplay` 为布尔值。默认三条命、无限提示、允许最后一段试玩通关或失败后重玩。最后一条命耗尽或使用最后一次有效提示时，立即派发 CTA，不等待动画结束；提示会正常高亮目标。未找到有效提示不扣次数。生命无限时受阻仍标记箭头，但不会失败。

生命和提示在两段 playable 中分别重新计数。重玩仅开放给最后一个 playable 的“All clear!”或“Out of lives”结算，进行中的游戏不能重玩，第一段有后续 playable 时也不能重玩。点击 Play again/Try again 先通过 CTA 桥请求跳转，再同步重置当前关卡的箭头、生命、提示、圆点和进度；切回来即处于新一局。已播视频、前面关卡、当前 HUD/背景及 SDK 段号均保留。仅单 playable 且尾部仍有片尾视频时禁用重玩，避免返回已结束的旧段；可关闭片尾或启用第二个 playable。

## 游戏契约

`game.js` 执行前可以注入 `window.__ESCAPE_ARROW_LEVEL__` 与 `window.__ESCAPE_ARROW_GAMEPLAY__`。不注入时使用第一关及默认玩法配置。公共接口：

- `window.EscapeArrow.getState()`：关卡、进度、生命（无限时为 null）、剩余提示、重玩开关、圆点数量、可操作箭头、缩放和动画状态。
- `window.EscapeArrow.getArrowScreenPoint(id)`：箭头头部在 Canvas 内的坐标，便于自动验收。
- `window.EscapeArrow.setMuted(true)`：供宿主控制静音，游戏界面不提供音乐开关。
- `window.EscapeArrow.reset()`：与 Play again/Try again 相同，仅最后一个可重玩 playable 的通关或失败结算可调用；先 CTA 再重置当前关卡。

成功逃出一根箭头产生一次真实进度；最后一根逃出时发 `novvy:playable-complete`，动画结束发 `novvy:victory`。只有最后一个可重玩的 playable 携带 `replayable:true`，段桥按 `onComplete({result:'win',continue_playing:true})` 保留当前段；其余正常最终结算。生命耗尽时先发 `novvy:playable-failed`（retryable 为当前段是否允许重玩），再发 `novvy:cta-moment`；允许重玩时失败报告为 `onComplete({result:'fail',continue_playing:true})`，保留当前段等待重玩。次数限制触发的 CTA 带 `reason: "lives-exhausted"` 或 `"hints-exhausted"`。重玩依次派发 `novvy:replay-cta` 和 `novvy:playable-replay`，前者独立触发一次 CTA，后者调用 SDK onReplay 并重置本轮 CTA 状态。不将提示、缩放、拖动或空白点击记为玩法进度。

## Editor

插件位于 `editor/plugins/escape-arrow/`，自动注册“Escape Arrow（箭头逃脱）”。任务选择关卡编号，显示对应缩略图、尺寸、箭头数及开局可逃出数量。“玩法限制”区域配置生命、提示和重玩，仅使打包步骤过期。单关导出 `level.json`；启用片尾且启用第二个 playable 时另导出 `level2.json`。

支持片头、片尾、HUD 标题及头像、两段独立背景、下载卡、CTA 时机与遮罩。第二段仍按现有模版的片尾衔接方式进入。打包只带选定关卡，不携带完整关卡库。图标从 manifest 声明的资产读取，关闭下载卡时不打包图标。

交付包将固定 PNG 图片与六段 m4a 音频内嵌到 `game.js`，包含教程手势、灯泡和已启用下载卡的图标。`index.html` 保持结构、配置和叠层，引用 `game.js`、`style.css`；没有自定义媒体时仅交付这三个文件，可直接离线打开。按任务生成的海报、背景、HUD 图片及视频继续作为单独文件。模板源码及 editor 总览使用共享资源，打包时再合并，避免复制 100 份媒体。

游戏源码是玩法与资产的唯一来源，禁止手改 `editor/templates/escape-arrow/` 构建产物。

## 前 100 关试玩总览

打开 `editor/templates/escape-arrow/gallery.html`，或在运行中的 editor 访问 `/templates/escape-arrow/gallery.html`。页面展示前 100 关的缩略图、尺寸和箭头数，点击即可在旁边的手机窗口试玩，支持上一关、下一关、重新开始和独立窗口。手机端点击卡片后打开全屏试玩，关闭后返回列表。

`?level=100` 可直接打开指定关卡。每关另有 `play/1.html` 至 `play/100.html` 独立入口，可通过 `file://` 离线试玩。总览页及这些试玩入口不进入广告交付包。
