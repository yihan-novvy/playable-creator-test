# 水色 · Water Sort Studio

基于 Three.js + Vite 的可交互倒水 demo，包含透明玻璃杯、分层颜色、倒水动画、撤销、重开、胜利提示和 JSON 实时编辑器。试管与液体通过 Three.js 几何体生成；深色石纹使用本地程序化 SVG，无远程资源。液体倾倒为演示动画，尚非流体物理模拟。

## 运行

```sh
npm install
npm run dev
```

打开终端显示的地址。`npm run build` 生成 `dist/`；`npm run preview` 预览产物；`npm test` 检查规则与默认关卡可解性；`npm run build:game` 打包 playable 广告基础包（见下节）。

## 打包 playable 基础包

`npm run build:game` 产出可直接提供给 Playable-Wholehouse 编辑器的基础包（默认输出 `build/template/`），`file://` 双击直开即可运行（无 module 脚本、无运行时 fetch）：

| 文件 | 角色 | 替换语义 |
| --- | --- | --- |
| `index.html` | 纯广告壳（全屏石纹背景 + 透明 canvas，无开发工作台） | 不替换 |
| `game.js` | 全部游戏代码，BGM 与默认关卡均已内联，静态不变 | 不替换 |
| `stone.svg` | 背景纹理（对标 Wholehouse 的 background.webp 角色） | 整文件替换 = 换背景 |

关卡不再走独立文件（`file://` 下 fetch 不可用）：默认关卡构建时打进 game.js，换关卡 = 在 `index.html` 的 `<script src="game.js">` 之前注入 `window.__WATER_SORT_LEVEL__ = {...};`。

落位到编辑器模板目录：

```sh
npm run build:game -- --out ../Playable-Wholehouse/src/templates/water-sort/game
```

## 独立关卡数据

修改 `src/level.json`（广告包的内置默认关卡），或在右侧编辑器内应用与导出 JSON。

- `id` / `name`：关卡标识与显示名称。
- `capacity`：每杯格数，支持 2–6。
- `colors`：颜色 ID 到 `#RRGGBB` 的映射；颜色总数从此对象推导。
- `bottles`：每项为一个杯子；瓶子数量由数组长度推导，支持 2–12。
- 每个杯子数组**从杯底到杯口**排列。`[]` 为空杯；同色连续顶部液体自动一起倒出，以目标剩余容量为上限。
- 例：`["blue", "gold"]` 表示杯底 blue，上层 gold。视觉颜色在 `colors` 内统一调整。

校验会检查容量、颜色引用、颜色格式及每种颜色总格数。默认关卡已经通过求解检查；任意自定义数据并不保证可解。

## 文件

- `src/level.json`：默认关卡数据（dev 页与广告包共用，构建时内联）。
- `src/game.js`：纯游戏规则与数据校验。
- `src/create-game.js`：可挂载的游戏核心（场景、交互、动画），dev 页与广告壳共用。
- `src/main.js`：开发工作台壳（关卡编辑器、统计、色板）。
- `ad.html` + `src/ad-main.js` + `src/ad.css`：纯广告壳入口（全屏、无工作台）。
- `src/audio.js`：Web Audio 合成音效；BGM 经 `?inline` 以 data URI 打进 bundle。
- `src/appearance.js`：摄影棚灯光、一体卷边瓶口、圆底玻璃与液体材质。
- `src/vessel-shape.js`：瓶口、瓶底及内腔共用尺寸，调整造型时保持液体匹配。
- `src/liquid-volume.js`：体积守恒、重力液面几何和倾倒角计算。
- `src/style.css`：响应式 UI。
- `vite.config.js` + `scripts/build-template.mjs`：基础包构建（`--mode game`）。

## 后续 playable ad 接入

广告基础包已就绪（`npm run build:game`：纯广告壳 + 自包含 game.js，约 746KB）。还没有接入广告平台 SDK 与商店跳转 CTA——这两项计划由 Wholehouse 编辑器的 pack 阶段以覆盖层注入（对标 colorever 的 cta/intro overlay），正式投放前仍需按渠道验证 MRAID / SDK 生命周期、音频策略与设备性能。Three.js 本地打包，不从 CDN 加载。设备像素比上限为 2。

## 参考图风格

深色石纹、复古金属边框、细长圆底透明试管和蓝／金黄／白配色。倒水包含曲线水流与液体体积渐变；倾斜试管内的各层液面保持世界坐标水平，并根据体积守恒重新构造；倾倒角随剩余液量增大，使液体接触杯口。支持弧形连续水流、接收液面上涨和落点涟漪。采用准静态液体模型，未模拟真实黏性、液体混合和复杂流体飞溅。
