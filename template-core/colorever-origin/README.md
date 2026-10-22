# colorever-origin（冻结静态模板）

外部交付的 Cocos Creator 单文件 playable（`260827_GMP-真试玩-仿-colorever-5瓣花-v15-加15点_en_gc_aplv.html`），
原样入库为 `src-game/index.html`。模板形态 = **片头视频 + 本 playable**，无片尾、无第二关。

- `build`（`scripts/build.mjs`）：纯复制 `src-game/` → `editor/templates/colorever-origin/game/`，
  并写 `game-manifest.json`（`constants.sourceSha256` 构建时现算，供插件侧做新鲜度校验）。
- `test`（`scripts/test.mjs`）：产物与源逐字节一致、manifest 一致性、注入锚点唯一、
  无 CSP、Cocos/super_html 结构标记在场。
- playable 本体一字节不改：CTA 用包内自带下载横幅（`super_html.download`），
  结算回调 `super_html.game_end`、跳转函数 `super_html.download` 由
  `editor/plugins/colorever-origin` 注入的引擎适配脚本在运行时接线
  （novvy 事件规范见 `docs/original-zip-required-event-integration.md`）。

图案库默认使用 `d.html` 的原始五瓣花；蓝色四瓣花、变色五瓣花分别保留
`b.html`、`c.html` 的关卡数据。`preview/` 是从原版冻结包抽出的珠子图集和
SpriteFrame 坐标，图案页叠加 Board 与 Gems，显示真实开局；变色图案沿用
自己的图集覆盖。

苹果按 `a.html` 的 13×14 切面轮廓排珠，沿用原版关卡格式与珠子。
运行 `node template-core/colorever-origin/scripts/apple-pattern.mjs` 可重新生成
`levels/apple-red.json`，再执行模板 build 同步到编辑器。只保留苹果本体，
轮廓之外没有底板、珠子或外框。一格一珠，共 131 颗；目标为红皮、浅黄色果瓤、
中间橙色圈、棕色果核和绿叶。`references/a-apple.json` 原样冻结 a.html 的
ScriptableObject 与暂存区组件；直接读取原版指定的 98 颗开局珠子（含原空位），
剩余 33 颗红珠预置在原版 12×4 暂存区，不生成或轮转布局。
