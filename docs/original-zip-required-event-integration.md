# 原 ZIP 必须明确提供的事件接入规范

对象：原 ZIP 的开发者、游戏引擎开发者和素材制作方。

目的：说明打包程序无法可靠推断的信息，以及原 ZIP 必须补充的接入代码。打包程序负责注入 SDK 和发送事件，原 ZIP 负责告诉 SDK“现在是哪一段、发生了什么”。不要求制作方自行发送 HTTP 请求。

适用本次改造后的打包代码；历史包需重新打包。打包接口已增加原 ZIP 静态预检及提醒确认，具体边界见文末；它不能代替运行验收。

## 1. 必须提供的信息

| 信息 | 为什么不能自动识别 | 原 ZIP 必须做什么 |
|---|---|---|
| 完整阶段顺序 | ZIP 内的视频数量不等于实际播放段数，可能有预加载、背景视频或未使用资源 | 在首次播放前调用 `setStageList([...])` |
| 当前实际展示的阶段 | 元素显示、隐藏或资源加载不能准确代表切段 | 每次切入阶段先调用 `setStage(index, type)`，成功后再启动该段 |
| 有效玩法首次操作 | 普通页面触摸不一定是有效玩法操作；引擎或 iframe 可能拦截输入 | 确保首触可被 SDK 捕获；不能捕获时，在真实首次操作时调用 `onStart()` |
| 有效玩法步骤与进度 | SDK 不理解放置成功、消除成功等游戏规则 | 在有效步骤完成时调用 `onStep(step, {progress})` |
| 成功或失败 | 出现某个画面、按钮或 CSS 类不能证明通关或失败 | 明确调用 `onComplete({result:'win'})` 或 `onComplete({result:'fail'})` |
| 试玩段真正结束 | 结束一轮不一定结束整段，最后一段也不一定发生跳转 | 最终完成调用 `onComplete()`；未完成但离开调用 `endStage()` |
| 同段重玩 | 重置画面不一定代表重新开始游戏 | 本轮完成但允许继续时传 `continue_playing:true`；重玩时调用 `onReplay()` |
| CTA 来源 | 无法可靠地靠屏幕坐标判断“底部卡片” | 标记卡片 DOM，或在点击时显式传入 `click_source` |
| 自定义播放器、嵌套页面的事件 | 无法自动穿透游戏引擎、任意 iframe 或自定义渲染逻辑 | 标准视频注册媒体监听；其他播放器和子页面由作者适配事件 |

## 2. 声明完整链路与切段

本节适用于**原 ZIP 自己管理多段视频和试玩**的素材，使用直接注入模式 `video_link_mode=direct`。

```javascript
// 在注入桥加载后、首段播放前运行。
const accepted = NovvyPlayable.setStageList([
  'video', 'playable', 'video', 'playable'
]);
if (!accepted) throw new Error('stage_list 声明失败');

function enterStage(index, type) {
  if (!NovvyPlayable.setStage(index, type)) {
    throw new Error('阶段序号或类型不符合 stage_list');
  }
}

enterStage(1, 'video');
// 再启动视频 1。
```

要求：

- `stage_list` 是整条素材的固定顺序，不是已播放列表；声明后不能换成另一条链路。
- `stage_index` 从 1 开始；第 2 项是 playable，则只能用 `setStage(2, 'playable')`。
- 当前支持固定向前的链路，不支持返回旧段。重玩仍属于当前段，不增加段号。
- 单试玩 ZIP 也应声明 `['playable']`。4 段、6 段使用同一套接法。
- 列表只允许 `video`、`playable`，非空，紧凑 JSON 长度不超过 160 字符。
- 系统生成的“视频＋试玩”外壳已自动管理两段顺序，**内部试玩不要再设置外壳的段号或列表**，沿用外壳消息接入方式。

## 3. 视频接入

优先使用标准 HTML `<video>`。对于动态创建的视频，在播放前注册一次：

```javascript
enterStage(1, 'video');
NovvyAnalytics.registerMedia(video1, { name: 'video_1' });

// 媒体注册在切段监听之前。
video1.addEventListener('ended', () => {
  enterStage(2, 'playable');
  showGame1(); // 原 ZIP 自己实现展示和启动逻辑。
});
video1.play();
```

要求：

- 视频自然播完后进入试玩，不用定时器提前跳过。
- SDK 已监听的视频，不要手动重复发送 `media_play`、`media_progress`、`media_complete`。
- Canvas 绘制视频、引擎播放器不属于标准 `<video>` 自动监听范围。制作方应改用标准视频，或为播放器明确适配事件并专项验收；不能仅放一个视频文件就认为已接入。

## 4. 玩法开始、步骤与进度

```javascript
// 引擎/子页面的输入不能被自动捕获时，首次有效操作调用一次。
NovvyPlayable.onStart();

// 完成一次有意义的操作，例如成功放置一块宝石。
NovvyPlayable.onStep(1, { progress: 25 });
NovvyPlayable.onStep(2, { progress: 50 });
```

要求：

- 自动捕获已经覆盖的首触，不再额外调用 `onStart()`，避免重复计数。
- `step` 表示本段有意义的步骤顺序；`progress` 是玩法真实进度，范围 0–100。
- 不按帧、pointermove 或每个原始触摸持续上报。
- 不知道真实进度就不编造进度，不能按经过时间推算百分比。
- `interaction_count` 沿用当前 SDK 计数逻辑，不能宣称等于严格去重的手势次数。

## 5. 结果与最终结束：不依赖 CTA

### 最终成功或失败

```javascript
// 二选一，仅在真实结果确定时调用。
NovvyPlayable.onComplete({ result: 'win' });
// NovvyPlayable.onComplete({ result: 'fail' });
```

这会报告结果并发送本段最终 `interactive_summary`，其 `trigger=stage_end`。**用户没有点击下载，也必须调用。最后一段同样必须调用。**

若同时进入结果页，应在真实结束和界面切换处调用；不要仅因为某个 CTA 按钮已显示，就判断玩法结束。

### 未完成就离开本段

```javascript
NovvyPlayable.endStage();
```

只结算已有指标，不伪造成功或失败。进入下一段前，也可以由 `setStage(...)` 补结算旧试玩段，但最后一段没有后续切换，必须明确通知结束。

### 一轮完成后仍允许重玩

```javascript
NovvyPlayable.onComplete({ result: 'win', continue_playing: true });
// 用户选择同段重玩：
NovvyPlayable.onReplay();
// 本段最终离开：
NovvyPlayable.endStage();
```

`continue_playing` 是 API 控制选项。重玩不清空阶段累计时间与计数；已经最终结算的阶段不能再继续玩。当前不提供每轮独立结算。

## 6. CTA 来源与跳转

来源只允许：

| 值 | 含义 |
|---|---|
| `bottom_cta_card` | 真实底部卡片区域，包括背景、图标、文案和按钮 |
| `other_area` | 明确来自底部卡片以外的下载入口 |
| `unknown` | 无法识别来源；不能当成 other_area |

DOM 方式：标记实际卡片容器，不能标整屏遮罩。

```html
<div data-novvy-click-source="bottom_cta_card">
  <button class="cta">立即下载</button>
</div>
```

标准 `.cta` 按钮由注入桥绑定时，不再叠加第二套下载逻辑。自定义按钮、Canvas、异步操作或子页面显式调用：

```javascript
NovvyPlayable.click({
  click_source: 'bottom_cta_card',
  scene: 'end_card'
});
// 其他入口将 click_source 改为 other_area。
```

要求：所有下载入口走统一 click API，不直接绕过它调用 `location.href` 等跳转；普通游戏操作不能调用 click API。一次真实下载动作只走一条路径，不能同时发送父页和子页点击。无法确定来源时传 unknown，不靠坐标猜测。

## 7. iframe 与游戏引擎

- 原 ZIP 自建的子页面应将玩法语义通知入口，由入口统一管理段号、汇总和下载；不要由多层页面分别统计同一个动作。
- 不保证自动监听跨域 iframe、Shadow DOM 或引擎内部。制作方必须提供事件桥。
- 系统生成的两段外壳沿用 `NOVVY_PLAYABLE_EVENT`：首触 `first_interaction`、步骤 `interaction_step`、成功 `game_complete` / `playable_complete`、失败 `game_over`、下载 `cta_click`。同一个结果不要发送多个兼容别名。
- 该系统外壳协议不是任意多段 ZIP 的通用自动识别能力；自带多段素材按本文件第 2 节管理。

## 8. 需要宿主配合的关闭通知

宿主确认广告真正关闭、且页面尚未销毁时调用：

```javascript
NovvyPlayable.close();
```

该方法只报告，不执行关闭动作。切后台、失焦、打开商店或返回商店都不能冒充关闭。没有宿主回调时，ZIP 无法补齐所有关闭事件；进程强杀或断网时也不能保证事件送达。

## 9. 原 ZIP 交付与验收

交付包使用唯一根入口 `index.html`，资源使用相对路径；不得覆盖注入的 `NovvyAnalytics` / `NovvyPlayable`，也不能用脚本加载限制阻止注入桥运行。

制作方交付时应附以下信息：

```text
素材模式：自带组合 ZIP / 系统外壳内层试玩
完整顺序：video → playable → video → playable
切段回调：具体函数或位置
玩法结果和最终结束回调：具体函数或位置
CTA 入口：每个入口的位置及 click_source
播放器与 iframe：是否使用非标准播放器、嵌套或跨域页面
关闭回调：宿主是否已接入
```

验收必须覆盖：

1. 段号、类型与完整列表一致；视频没有播完不能切入试玩。
2. 不点击 CTA，试玩最终结束仍有 stage_end 汇总。
3. 中途点击 CTA 后继续玩，快照不妨碍最终结算；最终结算每段一次。
4. 最后一段、未完成离开、允许重玩三种情况分别验证。
5. 底部卡片、其他下载入口、来源未知分别验证；没有重复主点击事件。
6. 原 ZIP 使用的播放器和 iframe 在实际运行环境中都能产生预期事件。
7. 无明确关闭信号时不伪造 close；缺失的数据保留缺失，不猜测补值。

不满足必要接入的素材，只能验收为具有部分基础事件，不能标记为“完整分段统计”。精确前台有效时长、每轮独立统计、原始坐标轨迹和零丢失送达不在当前能力范围内。

完整打包说明见 [ZIP 制作接入文档](zip-creator-event-integration.md)；字段及统计口径见 [数据分析事件文档](event-reporting-analysis-guide.md)。

## 10. 打包前检查与职责分工

上传时展示初检，点击打包时重新检查原始 ZIP，检查发生在注入 SDK 之前。入口为 `index.html`；扫描入口内脚本和直接引用的本地 JS，排除已知的本系统注入桥与 `analytics.js`。不下载外部代码，不执行游戏，不根据文件数量猜完整链路。

| 检查项 | 谁负责 | 页面显示及处理 |
|---|---|---|
| SDK、请求编码、事件发送、汇总计算、防重复 | 打包程序注入 | 不要求原 ZIP 包含 SDK；服务器 SDK 资源缺失则打包失败 |
| 系统生成的视频→试玩两段外壳 | 打包程序 | 自动声明阶段列表、切段；原 ZIP 不必重复提供这两项 |
| 原 ZIP 自己管理的阶段顺序和切换 | 原 ZIP | 检查 `setStageList`、`setStage` 调用线索 |
| 有效步骤和真实进度 | 原 ZIP | 检查 `onStep` 调用线索 |
| 成功/失败 | 原 ZIP | 检查 `onComplete` 调用线索 |
| 试玩最终结束 | 原 ZIP | 检查 `onComplete` 或 `endStage`；只有完成通知时额外提醒未完成离开的结算路径 |
| 下载入口和点击来源 | 原 ZIP | 检查 `click`、DOM 来源标记或 `click_source` 参数线索 |
| Canvas、iframe、外部脚本、模块、超限脚本、多入口 | 原 ZIP 制作方验收 | 明确提示静态检查范围不足，不能认为内部事件已经覆盖 |
| 首次有效操作、重玩、自定义播放器、真实关闭 | 原 ZIP / 宿主配合 | 按前文接入并运行验收；不能仅靠关键词自动证明业务行为正确 |

检测结果只有“程序负责 / 发现调用线索 / 未发现调用”。**发现调用不等于实际执行正确**：还需验证参数、触发时机、分支覆盖，以及是否绕过统一入口。别名、压缩混淆、动态加载和子页面接入可能产生“未发现”提醒；不要为消除提醒添加无实际用途的空调用。

出现缺失或不确定项时，页面列出具体原因和可能缺失的数据，提供：

- **取消**：关闭提醒，保留当前文件和表单，不请求打包，修改原 ZIP 后重试。
- **继续打包**：确认当前文件的提醒后继续。程序仍注入基础能力，但不补造阶段、结果、进度或结束行为；对应数据可能缺失。

确认只对当前 ZIP 字节、打包模式与检查结果有效。更换 ZIP 或模式必须重新检查。无效 ZIP、缺少入口属于文件错误，不能通过“继续打包”绕过。没有提醒也仍需真机运行验收。

当前为本地实现，是否线上可用取决于本次代码是否完成部署；既有投放包不会自动变更。
