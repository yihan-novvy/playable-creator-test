# water-sort 模板(水色排序)

Three.js 倒水排序 playable 的基础包。基础包**不是手工维护**的,由源仓库构建生成:

```bash
# 源仓库: ../water-sort-puzzle(与本仓库同级)
cd ../water-sort-puzzle
npm run build:game -- --out "$PWD/../Playable-Wholehouse/src/templates/water-sort/game"
```

## 基础包(game/)

| 文件 | 角色 | 替换语义 |
|---|---|---|
| `index.html` | 纯广告壳(全屏石纹背景 + 透明 canvas + undo/reset + win 覆盖层) | 不替换 |
| `game.js` | 全部游戏代码(Three.js + 规则 + WebAudio 音效),**bgm 与默认关卡均已内联**,静态不变 | 不替换 |
| `stone.svg` | 壳内 `url(./stone.svg)` 的兜底背景 | 不再直接替换;正式背景走 background 步的 `background.webp` DOM 背景层 |

基础包无任何运行时 fetch,`file://` 双击直开即可运行:换关卡 = 在 game.js 标签之前注入 `window.__WATER_SORT_LEVEL__ = {...};`(pack 步自动完成)。模板根的 `level.json` 是构建时内联进 game.js 的默认关卡,仅供 level 步回落与人工参考。

## 状态:已接入 editor 流水线(intro/hud/background/level/pack)

`template.json.steps` 声明的五步均已实现,创建任务时在弹窗里选择「水色排序」即进入专用工作台:

- **开场视频 / HUD 立绘 / 背景图**:与 colorever 共用同一 step 实现(海报首帧、立绘选源+裁剪 `hudCrop`、`blur-background.mjs` 高斯模糊出 `background.webp`),配置键同款(`hud`/`intro`/`background`/`hudImageSource`/`hudCrop`)。
- **关卡编辑**:工作台 config 区可视化编辑瓶/颜色(存 `config.level`,自动保存),客户端与服务端(`src/runner.mjs` 的 `validateWaterSortLevel` + BFS 可解性)同一套规则;未编辑过关卡时 level 步回落到模板根的默认关卡 `level.json`。
- **level 步**:校验 + 可解性验证后把归一化关卡写进 `project/<id>/generated/level.json`;穷尽搜索无解会拦下该步,状态空间超上限则降级为告警。
- **pack 步**:模板基础包 + 内联关卡(`window.__WATER_SORT_LEVEL__`,game.js 标签之前)+ 三组 overlay 注入 + 媒体兄弟文件(`tail-ad-video.mp4`/`poster.webp`/`hud-left.webp`/`hud-right.webp`/`background.webp`),平铺输出 `dist/<id>/`,`file://` 双击直开。HUD/片头可用 `config.hud.enabled`/`config.intro.enabled` 关闭;文案经 `window.__NOVVY_UI__` 内联注入。
- **在线预览**:`GET /api/tasks/<id>/preview` 与 pack 共用 `src/lib/ws-overlays.mjs` 组装(产物存在的组按 `/project/` 绝对 URL 注入),工作台手机框直接试玩当前配置,所见即所得。

### overlay 与进度契约

- `overlays/{hud,intro,background}` 从 colorever-gemsort 移植:hud 的 DOM/CSS 原样,hud.js 去掉 Cocos 场景轮询,改为监听游戏派发的事件;intro 原样(自带 `window.NovvyAnalytics` 守卫);background 用 DOM 背景层(`#novvy-dom-bg` z-index 0 + `#stage` 提升)。
- 进度条数据源:源仓库 `ad-main.js` 把「已归位颜色比例」派发成 `novvy:hud-progress`(detail.percent),胜利上升沿派发 `novvy:victory` → HUD 打满 100%。起步垫 `progressStart`(默认 10%),只涨不跌、封顶 99。
- 片头覆盖屏幕期间,游戏首次点按只解锁 WebAudio 不起 BGM;`novvy:intro-finished` 后 BGM 才开始,避免与视频声重叠。

### CTA 组(转化叠层)

`overlays/cta` 与 colorever-gemsort 同款:html/css/icon 逐字节一致(文案图片后续按渠道替换),只有 cta.js 多出 water-sort 的胜利接线。pack 时由 `ws-overlays.mjs` 的 cta 组原子注入,`config.cta.enabled=false` 一键整组退场:

- **底部 CTA 卡**:与 colorever 同一 DOM/桥链(点击 → `window.NovvyAnalytics` 埋点 → `window.novvy.open()` → super_html → mraid → window.open 兜底);图标发布为兄弟文件 `app-icon.png`(与 colorever 交付布局同名)。
- **壳层收缩**(`<style data-novvy-ws-shell>`):藏掉基础包壳的引导 footer(「选择一个杯子…」状态行 + undo/reset)与 `#win` 胜利结算浮层——底部空间让给 CTA 卡,也不再需要「再玩一次」页面。基础包的 `game.js` 因此零改动;pack 对 `<footer id="hud">`/`id="win"`/`id="reset"` 三个锚点做漂移防护,壳变了会拒绝打包。
- **胜利即跳转 + 自动重开**:cta.js 监听 `novvy:victory`(ad-main.js 在每局胜利上升沿派发)→ 立即走与 CTA 点击同一套桥链;1.2s 后程序化点击隐藏的 `#reset`(`game.reset()`)自动开新一局,并把 HUD 进度条归位(`novvyTrainingProgress.reset()`)。重开后的每一局胜利再次派发 `novvy:victory` → 再次跳转,即「每局完成都转一次」。

仍延后(与源仓库 README 的规划一致):analytics 叠层、`defaults.win.placements` 的实际消费——待确认渠道 SDK 方案后由 pack 叠层注入。

注意:`game/` 仍是构建产物,**不要手工修改**;改完源仓库后用上面的命令重新生成。`template.json` 的 `workbench: "water-sort"` 字段是编辑器前后端的分支开关,勿删。
