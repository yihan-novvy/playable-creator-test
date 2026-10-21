# colorever-origin 插件

片头视频 + 外部冻结 playable（aplv Cocos 单文件）的广告模板。与三个原生模板
（colorever-new / dragon-cube / escape-arrow）共用同一套事件基建，自身只有两步
流水线：`core:intro`（片头转码 + 海报）与 `pack`（注入组装）。

## 包结构

- `game.js`：aplv 可玩载荷整体抽出（`__zip` 引擎 + `__res` 资产 + 启动链，
  ~2MB 的那个大内联脚本原样外置，pack 时从冻结源确定性切片）。与 gemsort/
  escape-arrow 的 game.js 同纪律：**冻结 playable 载荷跨任务逐字节稳定**，
  广告逻辑迭代只动 index.html，不碰 game.js
- `index.html`：壳（head 元信息/bootcover/画布 DOM/importmap/aplv 头部集成
  脚本保持原位）+ 注入层
  - `<script src="game.js">`：回插在原内联脚本的位置，执行顺序不变
  - `data-novvy-origin-config`（最先）：运行时改写 `window.__res` 里的 GlobalConfig
    ——原版烘焙 `"游戏获胜目标进度百分比": 15`（进度 15% 游戏自己跳，会抢在转化
    时机之前）；钉到 99.99（棋盘解完才触发，任意 n-1 中间态 < 99.99 < 100），
    levelStart/levelEnd 收敛到胜利关。语义与 colorever-gemsort 的
    `patchGlobalConfig` 同源，但不动冻结字节
  - `data-novvy-playable-bridge`（段桥）：声明段链 `['video'?,'playable']`、
    媒体注册、`onStep`/`onComplete` 结算
  - `data-novvy-origin-engine`（引擎适配）：见 `overlays/engine/engine.js` 头注释
  - `data-novvy-cta-bridge`（转化桥，最后）：`__CTA_URL_KEY__` → `__ORIGIN_CTA_URL__`
  - `data-novvy-origin-splash`：隐藏 aplv 自带开机 splash（z-index 2147483646
    会压在片头视频上）
  - 片头组回落 core 三件套（本插件不自带 overlays/intro）
- `tail-ad-video.mp4` / `poster.webp`：intro 步骤的 720p 转码产物（启用片头时）

预览形态（编辑器在线试玩）不拆分：playable 载荷保持内联单文件（预览无静态
路由可挂 game.js），由 `originHtml` 的 `preview` 开关区分。

## 事件与跳转语义（= colorever-new）

- **有效步**：引擎适配在 document 捕获段数"一次完成的单指点按"（多指/超长按
  不计），片头结束后开算，完成后停计。
- **真实进度 percent**：场景扫描 `BS_GameDirector → _model.getCorrectFillRatio()`
  （正确/已占 0..1，游戏获胜检查 `winTargetProgressPercent` 用的同一指标；寻路
  与 aplv 自带集成脚本同款，`window.cc` 运行时可用）。读数上涨即派
  `novvy:hud-progress {percent}`，由共享段桥统一 `onStep(step, {progress})` ——
  SDK 的进度曲线拿到真值；100% 只在结算读数（棋盘解完 ratio=1）给。扫描未
  命中前有效步退回直接 `onStep(step, {})`（无 percent，不编造），两条路互斥。
- **CTA 循环节奏**（默认）：第 **10** 步首跳；之后按 **+5 → +4 → +3 → +2**
  逐个间隔再跳，表耗尽后全部按最后一个间隔（2）循环。触发点表由
  `lib.mjs` 的 `originCtaSchedule`（纯函数）预计算注入；转化桥按
  `detail.everySteps` 循环语义绕自动闩锁逐次转化、不武装回访每击。
- **完成兜底**：原生胜利跳转（阈值补丁后只在棋盘解完时发生）与
  `super_html.game_end` 都归入同一个 once 闩锁 → `novvy:playable-complete` →
  转化桥主动跳转一次（步骤数不是上限）。SDK 在场时 `window.open` 被拦截为
  完成信号（裸跳在 SDK WebView 本是无声 no-op），预览保留裸跳。
- **CTA UI**：playable 自带下载横幅（`super_html.download`）。SDK 在场时改走
  `novvy:cta-interact` → `NovvyPlayable.click(cta_click)`；预览（无 SDK）保留
  原始 mraid/window.open 裸跳转。不注入 cta-card、无全屏接管；
  `cta.endMask=false` 保持"完成后回访每击再转化"与 colorever-new 一致。

## 配置（白名单见 editor/lib/store.mjs）

- `intro`：enabled / goEnabled / goText / ariaLabel（core 片头，GO 闸门可选）
- `playableCta`：mode(steps|complete) / afterSteps(1–99) / intervals(1–99 数组，
  逐项校验，剔空 = 只保留首跳)
- `cta.endMask`：恒建议 false（true 无接管 UI，仅改变回访武装）

## 已知边界

- "一步"是输入层口径：无法区分游戏内有效/无效操作（游戏逻辑混淆）。
- 进度扫描依赖 aplv 自带集成脚本同款的结构假设（`BS_GameDirector` 节点 +
  `_model.getCorrectFillRatio`）；若未来换包破坏该结构，自动退化为无 percent
  的步数上报（不会报假进度），CTA 节奏不受影响。
- 胜利阈值补丁假设配置资产在 `window.__res` 且字段名不变（`游戏获胜关卡条件` /
  `游戏获胜目标进度百分比`）；缺失/结构不符时 pack 直接报错拒绝打包（宁可不交
  付也不交付一个会按原版步数抢跳的包）。
- 载荷拆分假设可玩脚本是含 `window.__zip` 的唯一 `<script type="text/javascript">`
  大块；换包形态变化时 pack 报错拒绝（结构标记：`window.__res` /
  `super_boot_engine` / `bundle_gemsort`）。
- 若游戏存在绕过 `super_html.download` 的自有跳转路径，SDK 包内该路径为裸
  `window.open`/`mraid.open`，不经过统一 click 上报（打包侧静态预检可能提示）。
- 步数触发点表上限 999 步（防御性；广告会话内不可达）。
