# Grill Sort · Her First Warm Meal

《The Dragon’s Silly Captive》第 8 集的剧情融合版本。顶部人物、对白和送餐进度延续已确认视频中的“女主只求一顿饭，国王承诺不让她挨饿”。

## 文件与构建

- `game.base.js`：原 `editor/templates/grill-sort-origin/standalone/game.js` 的逐字节副本，SHA-256 为 `519eae54d8c0e222bb424a5fe5ab82394e115497c28b87ae77149d147212fa72`。
- `src/story.js` / `src/story.css`：剧情外层、状态切换、送餐动效、环境与生命周期适配。
- `assets/story-states.png`：内置 imagegen 生成的原始三状态图；`story-states.jpg` 是保持画面不变的交付压缩版本。
- `scripts/build.mjs`：解开原包，仅在适配层增加真实送餐观察回调，再生成一个公开 `NovvyGame(entry)` 的单文件。
- 最终上传文件：`../../result/grill-sort-first-meal/game.js`。不需要同时上传 `game.base.js` 或图片。

```sh
node template-core/grill-sort-first-meal/scripts/build.mjs
node --test template-core/grill-sort-first-meal/scripts/test.mjs template-core/shared/standalone/runtime.test.mjs
```

构建强制核对原始文件哈希、原生资源完全相同、单次同步注册，以及 5 MB 上限；接缝变化会直接报错，不会静默改写引擎。

## 剧情与玩法的结合

初始人物按住饥饿的腹部，桌上只有一粒面包屑。玩家把同类食物放到同一烤架，三串完成原生打包后，外层接收 `releaseDone` 的真实完成数，让当前阶段色条短暂提亮。低于 10% 保留第一张饥饿图；达到 10%（12 串 / 4 组）进入第二张期待图；达到 30%（36 串 / 12 组）进入第三张温暖、满足图。对白同步过渡，最终赢局显示她不再挨饿的回应。空点、无效拖动和等待不会推进剧情。这两个剧情阈值不改变平台原有的 25/50/75% 事件口径。

剧情栏只保留一句 24–32px 的大号 Georgia 衬线对白，依次为 “Please… I’m so hungry.” / “Is this really for me?” / “I feel warm again.”。删除章节标题、人物名、状态小字、阶段标签、上菜浮字和底部提示。三个等宽色条仍表示三个剧情阶段，不显示文字或百分比；当前阶段高亮，经过的阶段保留暖色，后续阶段淡化。阶段名称通过 aria-label 提供，aria-current 标明当前阶段。真实完成数仍保留在内部状态和原生事件中，第三阶段不会提前结束原生游戏。

保留 12 个烤架、120 串目标、180 秒上限、原有补盘、教程、音效和拖拽判定。原生 Cocos 代码与素材不变，`game.base.js` 不变。派生包只增加适配层观察出口，不增加或伪造 `shell.step`；原来的步骤上报仍在真实成功移动时触发，完成百分比在下一次成功移动时随原适配器上报，最终胜利由原生结果决定。顶部剧情阶段在打包完成时立即更新。

每次进入新阶段播放一次 1.3 秒淡入与轻推近、暖光，并让唯一的大字对白在 450 毫秒内淡入。后续上菜只提亮当前阶段色条，不会取消阶段转场。短促上扬提示音由实例内 Web Audio 合成，无额外网络资源；只在实际手势解锁后播放，受环境静音与音频能力控制。暂停/结算立即停止音效，恢复不补播，销毁释放节点、音频上下文和监听器。减少动态效果模式关闭转场运动。不是生成式逐帧角色视频，不包含口型配音；对白保留英文文本。

## 接到视频后面

平台组装时选“关卡制 / 1 关”。已确认的视频作为宿主的视频段，新 `game.js` 作为随后的 playable 段。开头直接延续女主饥饿画面，不增加启动按钮或独立营销结束页。宿主继续管理视频切换、CTA、商店跳转和结束卡。本次 CTA 设定：视频节点关闭；试玩节点开始后 4 秒显示；“和游戏的关系”选择“游戏让出位置”，由 env.insets 让出底部空间，游戏代码不控制 CTA 定时。

已确认的视频路径：`/Users/code/.codex/visualizations/2026/11/11/01a1ca62-3c7f-7451-b1ef-f185a8b95159/grill-sort-first-meal/first-meal-english-repaired-final.mp4`。

返回标准 `start/pause/resume/setEnv/destroy`，兼容项目 `init/setMuted/setInsets/resize/getState/on/off/end`。此创意没有游戏内重试按钮，`replay()` 返回 false；宿主重新开始应销毁旧实例再创建新实例。安全区由外层消耗一次，再向原生层传入扣除剧情栏后的实际区域。环境静音不产生用户 sound 事件。

## 验证范围

当前大字版本的验证记录放在 `../../result/grill-sort-first-meal/validation-v4/`，`validation/`、`validation-v2/`、`validation-v3/` 保留旧版记录。单元测试不能替代平台验收。最终状态以当前目录的 `final-event-report.json` 和 `source-review.md` 为准。官方调试页只展示拟上报的 Tracking 请求，不证明生产入库、商店跳转或原生真机兼容性。
