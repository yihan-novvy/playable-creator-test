# DragonCube Playable

Unity DragonCube 第 1–10 关的轻量 H5 可玩广告基础包。保留原版关卡 JSON、彩色小猫素材和基础收集规则；第 7–10 关含定向猫块。拖动色块让它覆盖同色小猫，收齐后获胜。计时从首次拖动开始。

视觉与音效对齐 Unity 原版：色块使用原版 sprite 贴图（按形状自动识别盒型）、猫被收进盒子时有缩小吞入 + 星星特效、配原版音效（收集、金币、胜利、失败、按钮）。音频在首次触摸时解锁（符合广告平台静音启动规范），`window.DragonCube.setMuted(true)` 可整体静音。

```sh
npm run build:game
npm test
```

## 构建完整编辑器模板

参考 water-sort-puzzle 的基础包和配置注入方式，游戏代码与关卡配置分开输出：

```sh
npm run build
# 或 npm run build:template（二者等价）
```

`npm run build`（默认经根 `npm run build` 串联）把模板写到 `../../editor/templates/dragon-cube/`：`game/`（不含 levelN.html 独立预览页）+ `levels/` + `game-manifest.json`。覆盖层与编辑契约属于 `editor/plugins/dragon-cube/`，不再随模板打包，也没有 ZIP——monorepo 内产物目录即被编辑器直接消费。编辑器选择关卡后通过 `window.__DRAGON_CUBE_LEVEL__` 注入配置，共用一份游戏代码，无需每关独立 HTML。`game/index.html` 仅作为基础预览入口，默认第 1 关。

`npm run build:template -- --out <目录>` 可指定独立输出目录；`npm run build:game` 生成含 levelN.html 的本地试玩基础包（默认 `build/template/`）。

基础包位于 `build/template/`，可直接打开 `index.html`。文件全部本地引用，没有运行时网络请求或模块脚本。`window.__DRAGON_CUBE_LEVEL__` 可在 `game.js` 执行前设置为第 1–10 关任一原版 JSON；未设置时默认第 1 关。

`npm run build:game` 同时生成 `build/template/level1.html` 至 `level10.html`，每个 HTML 内联对应关卡配置，共用目录中的 `game.js`、`style.css` 和 `assets/`。打开对应文件即可试玩该关；复制到其他位置时需一并复制这些共用资源。

更新游戏或关卡后运行 `npm run build`，产物直接落到 `editor/templates/dragon-cube/`；`npm run validate` 的版本护栏会提示编辑器侧产物是否需要重建。覆盖层和编辑逻辑在 `editor/plugins/dragon-cube/` 维护。

## 从 Unity 工程同步素材

盒子 sprite、地板贴图和音效来自相邻的 `KittyHoleJam_Unity2022_Source` 工程，运行 `npm run sync:unity` 重新提取（需要 ffmpeg 转音效）：

- 盒子贴图：解析 `Resources/Configs/BoxConfig.asset` 的 GUID 映射，只拷贝前 10 关用到的形状×颜色组合到 `src/assets/boxes/<颜色>/<盒型>.png`。盒型由 `BoxShapeDetector.cs` 的逻辑在运行时从格子形状推断。
- 音效：`Assets/Sounds/*.ogg` 转 96k 单声道 m4a（iOS WebView 不支持 Ogg），输出到 `src/assets/sfx/`。背景音乐使用 Unity Game 场景配置的 `Cat In A Box (Tinker Bells Free).wav`，导出为 `bgm.m4a`；首次点击后循环播放，整体静音同时控制音乐和音效。Unity 没有单独的滑块移动音效，收集时播放原版 drop 音效。
- 地板：`Images/Sprites/Cells/Floor_Sit.png` → `src/assets/floor.png`。

关卡源自 `KittyHoleJam_Unity2022_Source/Assets/Resources/JsonLevels/1.json` 至 `10.json`。当前仅支持这十关使用到的基本机制；更高关卡不会出现在编辑器中。
