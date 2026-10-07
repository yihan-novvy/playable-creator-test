# Colorever · Three.js playable

Run `npm install` and `npm run dev -- --port 5173`. The default page is a playable kitten bead puzzle. `npm run build` builds index.html and calibration.html. The legacy beads.html study remains available in development.

The main puzzle has 829 active cells with 42 misplaced beads and a 48-slot cache (4 rows × 12 columns). Tap connected same-color wrong beads, then tap a matching empty board cell or an empty cache slot. Correct beads are locked. Hint, undo and restart are available. Earlier scene code is saved in docs/previous-gameplay.

## Current rendering

当前游戏界面保留较短且较厚的进度条与已归位/总珠子数，不显示图案标题、步骤/缓存计数、说明文字、完成颜色提示或右上角工具按钮；工具节点保留供内部重开逻辑调用。广告 HUD 支持配置主标题、副标题，显示真实珠子数量，不显示百分比文字。四个图案的缓存默认统一为 4 行 × 12 列；画室以行数和列数设置篮子，容量由两者相乘计算。缓存使用紧贴珠子尺寸的方形凹槽，整体尺寸适度放大，外壳随行列数变化。广告 `game_start` 的模版标识为 `colorever_square_beads_v1`。

- `src/bead-reference.js`: solid square mosaic cells with flat tops and rolled beveled edges. The top face carries the bead color; no clear window or painted highlight arc is used.
- `src/square-pattern.js`: reference-inspired circular silhouette, pointed ears, rounded face, cheeks and smaller body sampled on a uniform square grid.
- `src/main.js`: instanced colored cells form the entire kitten mosaic. The continuous kitten underpainting and glass caps are no longer used by the main preview. Eyes, nose, whiskers and bow remain independent 3D accessories.
- Cells use a uniform square grid and a narrow gap between adjoining tiles.
- `src/studio-reference.js`: compact upper-left studio reflection, restrained fill and soft ground shadows. Small radial contact shadows sit underneath the pellets.
- Tray supplies use the same square cell geometry and materials as the artwork; the cache is a separate five-row, thirteen-column box.
- Existing glass/underpainting modules and bead study remain available for comparison; the study has its own legacy rendering parts.

## Visual limitations

The supplied reference is the visual target, not a physically measured material. This preview uses opaque colored resin with a clearcoat as an approximation. Bead coordinates and color boundaries are a procedural approximation of the reference; photographic reflection details and pixel-perfect reproduction are not claimed.

Ad-channel packaging is deferred.

Cells use physical material reflections from broad studio softboxes. Fixed per-cell shader highlights and crowned tops have been removed; black, white and colored cells have separately tuned roughness and clearcoat. The reference composition is approximated procedurally, rather than extracted pixel for pixel.

The artwork floats above the background; there is no large rectangular backing frame. Cell gaps are approximately 6% of grid pitch.

## Original cache reference and current lighting

The large rectangular frame behind the mosaic was removed. The bottom cache now follows the original Colorever prefab: an independent warm rounded shell, recessed slots, five rows and thirteen columns. Source configuration: `editor/templates/colorever-gemsort/game/assets/assets/bundle_gemsort/import/69/69d06444-8382-41d3-a2b2-a8f157683a8f.json`; cache prefab: `import/05/05c83a383.json`. This is a 3D interpretation, not a direct sprite copy.

Cells retain their square spacing and smooth bevel normals. The top camber and frontal reflection panel have been removed; reduced neutral softbox reflections preserve clear dark tops and white faces. Shadows use PCF soft filtering instead of VSM blur.

## Silhouette-shaped puzzle socket board

`src/mosaic-sockets.js` builds a shallow continuous grid base following the occupied mosaic cells. Every bead has one recessed square pocket at the same row, column and center; no rectangular background frame or extra cells are added outside the artwork. Each pocket wall uses its corresponding bead color. The recessed floor and bottom slab use darker shades of that same color to show depth; reference-image brown is not applied to the puzzle base. Tap a bead to lift it and expose its pocket. The separate 5 × 13 cache box remains below the artwork.

## Material calibration

`calibration.html` and `src/tile-calibration.js` render enlarged black, white and colored samples with the same geometry, materials and lights as the main mosaic. The current tile is 0.736 units wide, 0.23 units thick and has a 0.070 rounded bevel, without top camber. Lighting has one main reflective softbox and subdued fill. Dark charcoal and off-white retain surface shading; socket walls are matte and lower than the tile shoulder.

## Original template gameplay feedback

新手指导在未完成的开局自动出现，复用旧版 gemsort 的手指 PNG。它依据当前棋盘提示依次指向可选错珠、缓存空格和归位位置，首次成功归位后结束；重开会重新出现，提示按钮仍可随时调用。手势素材通过 Vite 内嵌到引擎，离线 HTML 和广告包不依赖额外图片文件。

`src/game-haptics.js` 沿用旧版 `novvy.haptic(style)` 接口：取珠为 light，缓存移动和逐珠落位为 selection，棋盘整组归位为 medium，完成为 success。连续反馈限制为至少间隔 45 ms，完成反馈不受限；关闭音乐仍保留震动。没有 SDK 桥接时尝试浏览器震动接口，设备不支持时正常继续游戏。

Behavior was checked against `editor/templates/colorever-gemsort/game/assets/assets/bundle_gemsort/index.js`, especially BoardController, BoardModel and AudioService.

- `src/game-audio.js`: original BGM starts on first input; Web Audio handles overlapping original one-shot clips. BGM, store and single-placement exports contained data-URL text, so the local assets have been decoded into binary MP3 files. Music pauses when the page is hidden. The sound button mutes music and effects.
- Pickup lifts the group over 150 ms. Cache insertion staggers each bead by 40 ms; board placement staggers by 50 ms. Each bead plays its landing sound when it lands, rather than replaying one sound at group launch.
- Classic cache behavior appends new beads after the last bead of the same color. Other groups slide to make space. Removing cached beads compacts the remaining groups and preserves any partial selection.
- `src/game-effects.js`: landing gives a small face-clipped sweep. Newly completed colors receive a larger sweep after 400 ms, plus sparkles and the original success sound. The full board completes with a diagonal sweep in 60 ms layers; the result panel waits until this finishes. These effects are recreated for the 3D scene, not direct Cocos prefab playback.
- Undo and reset cancel the transient feedback state; an undone color can celebrate again when completed.

Run `npm test` for color conservation, solveability, classic cache grouping and shifts, partial placement, undo, full-cache behavior and binary audio asset checks.

## Static reflection preview

`src/ambient-sheen.js` adds two fixed softbox glints at the upper-right and upper-left shoulders of every occupied tile. The left glint is slightly softer (80% strength). A broad world-space light band modulates its strength gently, while all tiles keep a visible sharp local reflection. There is no clock, repeat cycle or moving sweep in this normal-play effect. The overlay follows lifted/cached tiles, excludes empty slots and stays visible during play. The ✦ button toggles the fixed reflection for comparison. Completion sweeps remain separate temporary feedback.

Cache transfers are now eased slightly slower for readability: 360 ms flight duration, 55 ms staggering into the basket and 65 ms staggering back to the artwork. Cache group shifts take 210 ms. Board-to-board timing remains 260 ms / 50 ms. Landing sounds and completion sweeps still wait for actual landing.

## Direct-open offline HTML

Run `npm run build:offline` to generate `dist-offline/Colorever.html`. The export bundles JavaScript into one classic IIFE script, inlines CSS and embeds all seven audio clips. One-shot audio is decoded directly from embedded bytes; no fetch or server is needed for the export. Double-click this HTML to run locally using file://. Music starts with the first user gesture. The regular Vite preview still uses separate assets.

The finished-reference card has been removed from the game. Production builds emit only the required audio files from public/; the full-resolution reference PNG is retained for the development-only legacy bead study and is excluded from both dist and the offline HTML.

## colorever 图案制作与导出

colorever 是图案与装饰的唯一来源。开局模式与随机参数属于广告任务：广告编辑器按任务配置（模式、打散对数、种子）用随产物导出的开局引擎即时生成并验证开局，源项目不烘焙具体开局。模板里保存的 openingMode/difficulty/seed 仅作为开发页与离线样例的演示默认。广告项目只消费构建结果，不能反向修改源项目。

### 可视编辑

`yellow-code`（黄色编号 032363FF18478327）采用 35 × 25 网格：`032363FF` 与 `18478327` 分两行居中显示，字符使用金黄色拼珠，搭配深蓝底色和蓝色边框。编号中的两个大写 F 原样保留；字符、背景和边框均为可玩的拼珠格子。

`rafflesia`（粉瓣霸王花）参考拼豆花朵制作，使用 37 × 33 网格：五瓣粉红与蜜桃色花瓣、橙黄花心、黄色花纹和周围的嫩绿叶片，搭配墨绿色拼珠底色、青绿边缘与金黄底边。花瓣和叶片之间的空白由底色珠子填满，形成完整矩形拼豆板；全部元素复用现有拼珠材质，可在画室修改并供广告项目选择。

`backpack`（橙黄书包）参考拼豆书包制作，使用 29 × 24 网格：橙黄包身和侧袋、深灰轮廓、粉色翻盖、奶白提手与扣带，以及正面搭扣和小口袋。参考中轮廓底槽上的错色珠子还原为深灰包边；整个图案复用现有拼珠材质，可在画室修改并供广告项目选择。

`portrait`（短发人像）采用正面构图，使用 40 × 40 网格和 10 色配色：深色短发、对称眉眼、居中的鼻子与嘴，以及深蓝圆领上衣。脸部仅使用三种肤色，保留少量轮廓阴影与高光，减少零碎明暗色块。人脸五官与头发均由拼珠组成，复用现有材质和凹槽；可在画室修改，广告项目可选择该图案并生成简易、适中或零散开局。

`portrait-frown`（皱眉人像）是独立的第二个人脸模版：正面深色短发、皱眉与微张嘴表情、深色翻领外套；保持 40 × 40 网格、10 色总配色和三种肤色。沿用现有拼珠材质，可在画室修改并供广告项目选择。

`tree`（彩饰圣诞树）参考拼豆树图案制作，使用 16 × 20 的原始网格轮廓：绿色阶梯树冠、金黄星顶与装饰带、红色彩带、蓝色方块和红色树底。树顶和树底根据参考中的底槽颜色还原为完成状态，复用现有拼珠材质；可在画室修改，广告项目可选择该图案并生成简易、适中或零散开局。

金黄小鸡（`chick`）按参考图描绘斜额头、奶油黄前胸、圆腹、金橙色错位羽纹和阶梯状翘翼，使用 30 × 40 网格。嘴部恢复圆润的上下两瓣，脚部恢复短腿和三趾脚爪；白色眼缘、深棕亮眼、嘴与脚均可单独调整。图案复用现有拼珠与凹槽材质，默认简易开局可在 6 次搬运内完成。

图案清单包含蝴蝶结猫咪（`cat`）、彩色小屋（`house`）、双刃斧子（`axe`）和火把（`torch`）。斧子使用银灰双刃与棕色长柄；火把使用红橙黄火焰、银灰托环与棕色握柄。两个新增图案复用现有拼珠、凹槽、光照和篮子材质，均提供已验证的简易开局，分别可在 5 次和 6 次搬运内完成。

协议合同（`contract`）采用日常文书造型：暖白纸页、浅蓝折角、英文拼珠「PACT」标题、蓝色分隔线、勾选条款和带横线的英文「SIGN」签字栏。图案中不使用中文或签字笔。图案为 32 × 40 格，共 908 颗拼珠，使用 7 色；固定简易开局可在 6 次搬运内完成。全部细节使用可编辑的拼珠数据。

银行账户余额（`bank`）采用圆角手机轮廓、深蓝屏幕、英文「BANK」标题和蓝色余额卡片，绿色「$15.5B」为示例金额；下方包含脱敏账户信息与收支明细横线。图案为 32 × 40 格，共 920 颗拼珠，使用 8 色；固定简易开局可在 5 次搬运内完成。所有画面元素均为可编辑拼珠，不使用中文。

金羽凤凰（`phoenix`）保留分层拼珠羽翼、羽冠、鸟首和三束垂落长尾，在金白珠面上加入朱红羽根、绛红羽影和珊瑚橙红尾羽，共 8 色。40 × 40 格，共 593 颗拼珠，仅圆润亮眼与尖喙为独立立体配件，可在编辑器调整位置和比例；眼睛沿用猫咪的黑色亮面树脂与单个奶白高光，配件对应的 3 个珠位已预留空位。简易开局已通过 30 个随机种子的可解性验证。`docs/phoenix-design.png` 仅作美术参考，不进入广告包。

在本项目运行 `npm run editor`，打开 `http://127.0.0.1:5174/editor/`。支持画笔、擦除、填色、吸色、撤销重做、配色以及猫咪已有装饰的拖动与缩放。简易模式生成四块连续区域并验证 6 次内完成；零散模式保留分散交换。预览草稿不会保存；「保存图案模板」仅写入本项目 `src/patterns/*.json`。高级 JSON 入口也属于本项目。

`editor/index.html`、`editor/app.js` 是画室；`scripts/authoring.mjs` 通过 Vite 开发服务器提供读取、预览和保存接口。没有跨项目写入，没有 Wholehouse API 依赖。新增图案或专属造型由作者/AI 修改 `src/patterns/` 数据与 JS 模块，登记 catalog 和开发 registry。

### 单向构建

修改数据或装饰后运行：

```sh
npm run build:template
```

该命令单向导出到 `../../editor/templates/colorever/game`，并在模板目录写入 game-manifest.json（图案清单与引擎校验值）。构建时校验各图案模板（不携带具体开局），把开局引擎打包为 `game/level-engine.mjs`（prepareLevel/validateLevel/solveLevel，供广告编辑器按任务配置生成开局），装饰与游戏逻辑编入 game.js（game.js 本身不含开局生成器）。导出 index.html、game.js、level-engine.mjs、patterns/catalog.json 和各图案 JSON；目录附带引擎与数据校验值。编辑器与装饰 JS 源码不会复制到广告项目。

`npm run build:game -- --out <dir>` 导出相同格式到指定目录；`npm run build:offline` 导出独立 HTML。构建不会修改源图案数据。

广告项目只选择 build 发布的 patternId，并配置片头/HUD/背景/CTA。预览和打包读取固定 opening，不再随机或求解。修改源文件后未重新 build 时，编辑器仍使用入库的旧产物；`npm run validate` 比对 template-core 与 game-manifest 的版本号，不一致即提示重新构建。

验证：`npm test`。广告集成在 monorepo 根运行 `npm test`。
