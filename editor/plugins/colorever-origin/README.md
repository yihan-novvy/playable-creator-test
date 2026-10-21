# colorever-origin 插件

片头视频 + 外部冻结 playable（aplv Cocos 单文件）的广告模板。与三个原生模板
（colorever-new / dragon-cube / escape-arrow）共用同一套事件基建，自身只有两步
流水线：`core:intro`（片头转码 + 海报）与 `pack`（注入组装）。

## 包结构

- `index.html`：aplv playable 原文件 + 注入（除锚点拼接外 playable 一字节不改）
  - `data-novvy-playable-bridge`（段桥，最先）：声明段链 `['video'?,'playable']`、
    媒体注册、`onStep`/`onComplete` 结算
  - `data-novvy-origin-engine`（引擎适配）：见 `overlays/engine/engine.js` 头注释
  - `data-novvy-cta-bridge`（转化桥，最后）：`__CTA_URL_KEY__` → `__ORIGIN_CTA_URL__`
  - 片头组回落 core 三件套（本插件不自带 overlays/intro）
- `tail-ad-video.mp4` / `poster.webp`：intro 步骤的 720p 转码产物（启用片头时）

## 事件与跳转语义（= colorever-new）

- **有效步**：引擎适配在 document 捕获段数"一次完成的单指点按"（多指/超长按
  不计），片头结束后开算，完成后停计；步数经 `NovvyPlayable.onStep` 上报
  （游戏真实进度不可知，不编造 percent）。
- **CTA 循环节奏**（默认）：第 **10** 步首跳；之后按 **+5 → +4 → +3 → +2**
  逐个间隔再跳，表耗尽后全部按最后一个间隔（2）循环。触发点表由
  `lib.mjs` 的 `originCtaSchedule`（纯函数）预计算注入；转化桥按
  `detail.everySteps` 循环语义绕自动闩锁逐次转化、不武装回访每击。
- **完成兜底**：游戏 `super_html.game_end` → `novvy:playable-complete` →
  转化桥主动跳转一次（步骤数不是上限）。
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
- 若游戏存在绕过 `super_html.download` 的自有跳转路径，SDK 包内该路径为裸
  `window.open`/`mraid.open`，不经过统一 click 上报（打包侧静态预检可能提示）。
- 步数触发点表上限 999 步（防御性；广告会话内不可达）。
