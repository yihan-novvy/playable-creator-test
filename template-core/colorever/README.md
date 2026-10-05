# Colorever · Three.js playable

Run `npm install` and `npm run dev -- --port 5173`. The default page is a playable kitten bead puzzle. `npm run build` builds index.html and calibration.html. The legacy beads.html study remains available in development.

The main puzzle has 829 active cells with 42 misplaced beads and a 65-slot cache. Tap connected same-color wrong beads, then tap a matching empty board cell or an empty cache slot. Correct beads are locked. Hint, undo and restart are available. Earlier scene code is saved in docs/previous-gameplay.

## Current rendering

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

colorever 是图案、装饰、玩法参数和开局的唯一来源。广告项目只消费构建结果，不能反向修改源项目。

### 可视编辑

图案清单包含蝴蝶结猫咪（`cat`）、彩色小屋（`house`）、双刃斧子（`axe`）和火把（`torch`）。斧子使用银灰双刃与棕色长柄；火把使用红橙黄火焰、银灰托环与棕色握柄。两个新增图案复用现有拼珠、凹槽、光照和篮子材质，均提供已验证的简易开局，分别可在 5 次和 6 次搬运内完成。

在本项目运行 `npm run editor`，打开 `http://127.0.0.1:5174/editor/`。支持画笔、擦除、填色、吸色、撤销重做、配色以及猫咪已有装饰的拖动与缩放。简易模式生成四块连续区域并验证 6 次内完成；零散模式保留分散交换。预览草稿不会保存；「保存图案模板」仅写入本项目 `src/patterns/*.json`。高级 JSON 入口也属于本项目。

`editor/index.html`、`editor/app.js` 是画室；`scripts/authoring.mjs` 通过 Vite 开发服务器提供读取、预览和保存接口。没有跨项目写入，没有 Wholehouse API 依赖。新增图案或专属造型由作者/AI 修改 `src/patterns/` 数据与 JS 模块，登记 catalog 和开发 registry。

### 单向构建

修改数据或装饰后运行：

```sh
npm run build:template
```

该命令单向导出到 `../../editor/templates/colorever/game`，并在模板目录写入 game-manifest.json（图案清单与引擎校验值）。构建时生成、求解并固定每个开局，装饰与游戏逻辑编入 game.js。导出 index.html、game.js、patterns/catalog.json 和各图案 JSON；目录附带引擎及数据校验值和完成步数。编辑器、装饰 JS 源码、开局生成器不会复制到广告项目。

`npm run build:game -- --out <dir>` 导出相同格式到指定目录；`npm run build:offline` 导出独立 HTML。构建不会修改源图案数据。

广告项目只选择 build 发布的 patternId，并配置片头/HUD/背景/CTA。预览和打包读取固定 opening，不再随机或求解。修改源文件后未重新 build 时，编辑器仍使用入库的旧产物；`npm run validate` 比对 template-core 与 game-manifest 的版本号，不一致即提示重新构建。

验证：`npm test`。广告集成在 monorepo 根运行 `npm test`。
