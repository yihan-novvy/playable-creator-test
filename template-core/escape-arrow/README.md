# Escape Arrow playable

原生 JavaScript + Canvas 2D 的箭头逃脱模版。复用 Unity2022_EscapeArrow 前 20 关的网格、箭头路径与配色，使用轻量二维渲染；不需要 Unity WebGL 或 Three.js。

## 构建与检查

在仓库根目录运行：

```sh
npm run build -w template-core/escape-arrow
npm test -w template-core/escape-arrow
node editor/test/run-all.mjs escape-arrow playable-bridge
npm run test:browser -w template-core/escape-arrow
```

构建确定性输出 `editor/templates/escape-arrow/`，无需运行时模块加载、关卡 fetch 或 CDN。直接打开其中 `game/index.html` 可离线试玩第一关。浏览器验收需要本机 Playwright Chromium，逐关使用真实指针点击通关，并验证缩放、拖动、失败重玩、片头片尾、双关、SDK 结算和 editor 工作台。截图保存在命令输出的系统临时目录。

## 原始数据与素材

来源：`Unity2022_EscapeArrow/Assets/TheVayuputra/ArrowGame/`。

- `Resources/Levels/Level_1.json` 至 `Level_20.json` 原样保存到 `src/levels/`。
- 构建产物添加 `Index` 编号；原始 `GridXSize`、`GridYSize`、`Arrows` 保持不变。
- `Indices[0]` 是箭头头部，朝向为头部减第二个格子，格子编号为 `y * width + x`。
- `GUI/HandIcon.png` 作为教程手势；应用图标采用原项目 `StoreAssets/google-play/app-icon-512.png`。
- `Sound/` 中的六段音频转换为单声道 AAC/m4a。首次用户操作解锁音频，隐藏、不可见或播放覆盖视频时暂停游戏声音。

从相邻 Unity 工程重新同步：

```sh
npm run sync:unity -w template-core/escape-arrow
# 指定另一份 Unity 工程：
npm run sync:unity -w template-core/escape-arrow -- /absolute/path/to/Unity2022_EscapeArrow
```

同步只读取 Unity 工程，不修改原项目；转换音频需要 ffmpeg。同步后重新构建。

## 规则与操作

点击箭头身体的占用格子，沿头部朝向检查到棋盘外的射线。无占用格便成功逃出，并立即释放逻辑占用；可见身体沿自身路径抽离。受阻时沿路径前进后退回，同一根箭头仅首次受阻扣一条命并标为虚线。三条命耗尽可重试，所有箭头逃出即胜利。

支持单指拖动、双指缩放、滚轮缩放、缩放按钮、回到中心、提示和明暗主题。点击和拖动分别判定；棋盘适配可用空间，像素比上限为 2。

## 游戏契约

`game.js` 执行前可以注入 `window.__ESCAPE_ARROW_LEVEL__`。不注入时使用第一关。公共接口：

- `window.EscapeArrow.getState()`：关卡、进度、生命、可操作箭头、缩放和动画状态。
- `window.EscapeArrow.getArrowScreenPoint(id)`：箭头头部在 Canvas 内的坐标，便于自动验收。
- `window.EscapeArrow.setMuted(true)`：静音。
- `window.EscapeArrow.reset()`：重置当前关卡；广告形态的最终胜利不允许重新开启已结算段。

成功逃出一根箭头产生一次真实进度；最后一根逃出时发 `novvy:playable-complete`，动画结束发 `novvy:victory`。失败发 `novvy:playable-failed`，用户重试发 `novvy:playable-replay`。editor 插件通过共享段桥接入 SDK，不将缩放、拖动或空白点击记为玩法进度。

## Editor

插件位于 `editor/plugins/escape-arrow/`，自动注册“Escape Arrow（箭头逃脱）”。任务选择关卡编号，显示对应缩略图、尺寸、箭头数及开局可逃出数量。单关导出 `level.json`；启用片尾且启用第二个 playable 时另导出 `level2.json`。

支持片头、片尾、HUD 标题及头像、两段独立背景、下载卡、CTA 时机与遮罩。第二段仍按现有模版的片尾衔接方式进入。打包只带选定关卡，不携带完整关卡库。图标从 manifest 声明的资产读取，关闭下载卡时不打包图标。

游戏源码是玩法与资产的唯一来源，禁止手改 `editor/templates/escape-arrow/` 构建产物。
