# Novvy H5 试玩接入规范：game.js 格式与事件协议（给 agent 的实现规范）

- 适用对象：要放进 Novvy 素材组装壳子里运行的 H5 试玩（playable）。
- 读者：编写或改造 playable 的 agent / 开发者，包括在本仓库里改游戏代码的 Codex、Claude Code 等 agent。照本文把游戏做成 game.js 格式，壳子就能启动它、收下它的每次调用并生成正确的上报日志。
- **改任何游戏代码之前先读完第 0 节**（上传的 game.js、格式样例、`backend/games/` 的内置游戏模版都算），改完按第 9 节自检；改内置游戏模版还要满足第 10 节。
- 地址：本服务的 `/eventLogs`（同内容 `/eventLogs.md`），纯文本 Markdown，不需要登录。
- 实现依据：壳子运行时 `backend/app/creative/shell/runtime/`（包里是拼好的 `novvy-shell.js`，运行游戏的是其中的 `core/games.js`），打包检查 `engine/nodes/playable.py`；内置游戏模版的源码和构建 `backend/games/`（`build.mjs`、`shared/`），存成素材 `engine/games.py`；格式样例 `backend/app/creative/shell/samples/game/`。更新于 2026-11-05。
- 维护：壳子、打包检查或内置游戏的构建规则变了，同一次改动里同步改本文；`frontend/tests/event-logs.test.ts` 核对本文和壳子的消息、丢弃原因、限额、入口方法是否一致。
- 相关文档（平台左侧「文档」里分类列出，也可以直接读 Markdown）：上报的完整口径给数据分析和测试看，见「creative 事件」`/docs/creative-events.md`；点击先打开的自定义跳转页面怎么做，见「自定义跳转页面接入」`/docs/landing-page.md`。本文第 8 节只讲游戏的调用会变成哪些上报。

## 0. 必须遵守的规则（先读这一节）

1. **交付格式必须是 game.js**（第 1 节）：玩法和界面都在 `game.js` 里，用 `NovvyGame(function (root, shell, options) { … })` 交出入口函数，由壳子调用。游戏**和壳子跑在同一个页面上**，没有 iframe，也没有自己的 `index.html`。自带 `index.html` 的整页试玩包、单个 HTML 已不再支持，上传和组装都会拒收。
2. **不能修改游戏的玩法逻辑和 UI。** 改成 game.js 只做接入（第 1.5 节）：把原来的启动代码包进入口函数，在原有的事件处加 `shell` 调用，把原来跳商店的代码换成 `shell.cta(…)`，去掉第 7 节禁止的写法。玩法规则、关卡和数值、难度、计时、画面、布局、文案、动画、音效、操作手感都保持原样；拿不准某处改动算不算接入，先问用户。
3. game.js **只调用 `shell`，不上报、不发消息**：壳子负责计时、计数和发 Tracking 请求。加载完成（`ready`）、首次触摸、脚本报错都由壳子自己记（第 1.4 节），game.js 里不要写 `postMessage`。
4. 入口函数交出 `{ start, pause, resume }` 时就算加载完成；要等资源加载，就返回一个 Promise，加载完再给出它们。**`start` 被调用之后**才开始玩法、声音和计时。
5. **只在自己的 `root` 里画，状态都放在入口函数里**：页面是壳子的，`document.body`、页面上别的元素和全局变量都不是游戏的；同一个 game.js 可能在一个广告里跑两次（两段用同一个游戏、结束卡上点重播），每次调用入口函数都是一个新实例。
6. `shell.step(percent)` 只在**成功**的玩法步骤调用，`percent` 是本关进度（0–100）；壳子只在跨过 25 / 50 / 75 那一步记上进度。完成不靠进度到 100，而是调用 `shell.win()`。
7. 每轮结束必须调用 `shell.win()` / `shell.fail()`，或在没有结果时调用 `shell.end()`，否则这一段永远不会结束。
8. 要加点击跳商店，只能调用 `shell.cta(click_source)`，即调用壳子的 click；壳子收下后再调用 SDK 的方法打开商店。**动手前先把游戏里所有会跳商店的点击逐条列给用户**，由用户决定每一条是 `cta_click` 还是 `forced_click_to_appstore`，写进那条 `shell.cta(…)`，壳子收到后原样填进上报（见第 2.1 节）。**禁止**自己打开商店、`window.open`、改 `location`、访问 `window.novvy`（包括直接调 `novvy.click` / `novvy.open`）、请求 `tracking.novvy.ai`。也不要写「玩几秒后自动跳商店」之类的定时跳转：自动跳转商店、CTA banner 都在组装页的「通用设置」里按节点配置，由壳子执行。
9. 包里的资源用 `options.base` 开头的路径引用（第 1.1 节），不访问外部网络。
10. **游戏只管自己的玩法和画面**：标题、CTA banner、视频进试玩的转场、结束卡、自动跳转商店都由壳子按组装页的节点设置来做，游戏里不要新加这些；游戏原有的结算页和下载按钮照原样保留，跳商店改成 `shell.cta`（第 8 条）。平台、语言、屏幕、声音、壳子叠在画面上的标题和 banner 占的高度都从 `options.env` 取，变了壳子调用 `setEnv`（第 1.6 节）；游戏自己的声音开关调用 `shell.sound(muted)`，想让手机震动调用 `shell.haptic(style)`。
11. **改平台的内置游戏模版（`backend/games/`）还要满足第 10 节**：冻结的引擎源码不改；已发布的 `id@version` 不改，玩法、素材或构建产物变了就升版本；`npm --prefix backend/games test` 通过。
12. **拿不准就先问用户，不要自己定**：某处改动算不算接入（第 2 条）、每个跳商店的位置报哪个值（第 8 条）、内置游戏的某个版本发布过没有（第 10.5 节）。改完按第 9 节自检，在「试玩日志调试」页面完整玩一遍。

## 1. 交付格式：game.js

### 1.1 交付物

只有代码时交单个 `game.js`；有图片、音频、字体、关卡数据等资源时，把 `game.js` 和资源打成一个 ZIP：

```text
game.js      必须：游戏的全部代码，引擎库也合并进来；普通脚本
game.css     可选：游戏的样式，有就自动加载
assets/…     可选：图片、音频、字体、关卡数据，目录名随意
```

- `game.js` 放在 ZIP 的根目录，或唯一的顶层文件夹里。不要放 `index.html`：不会被打开，检查时会提示；只有 `index.html` 没有 game.js 入口的包按整页试玩包拒收。
- `game.js` 是**普通脚本**（打包工具输出 IIFE），不能是 ES 模块：不能有 `import` / `export`。
- 壳子把包里的文件原样放在 `segments/<第几段>/` 下，依次把 `game.css`（有的话）和 `game.js` 加到自己的页面上。页面的地址是壳子的 `index.html`，所以**相对路径不再相对 game.js**：
  - 在 JS 里引用自己的文件，前面加上 `options.base`（这个目录，如 `segments/2/`）：`img.src = options.base + 'assets/hero.png'`；
  - `game.css` 里的 `url(…)` 照常相对 game.css 本身，不用改。
- `game.css` 和壳子共用页面：选择器只能作用在游戏自己的元素上。不要写 `html`、`body`、`:root`、`*` 这类改到整个页面的规则；给游戏最外层的元素一个 class，所有选择器都以它开头。

### 1.2 入口函数

```js
NovvyGame(function (root, shell, options) {
  // 在 root 里搭好第一屏、加载资源；还不要开始玩法、声音和计时
  return {
    start: function () {},    // 必须：轮到这一段时调用一次，开始玩法、声音和计时
    pause: function () {},    // 广告不可见时（切后台、被遮挡）暂停玩法、声音和计时
    resume: function () {},   // 重新可见时继续
    setEnv: function (patch) {},  // 可选：运行环境变了（第 1.6 节）
    destroy: function () {}   // 建议：这一段卸载时释放计时器、监听、声音、WebGL
  };
});
```

- game.js 执行时**同步**调用一次 `NovvyGame(entry)`（写在文件顶层，不要等 `load`、定时器或 Promise 之后）。壳子在 game.js 加载完之后才调用 `entry`。
- `root`：壳子给这一段的容器，一个铺满屏幕的 `<div>`。界面只放在它里面；不要往 `document.body` 加东西，不要用 `document.getElementById` 去找壳子的元素。尺寸取 `root.clientWidth` / `clientHeight`（和 `window.innerWidth` / `innerHeight` 一样大）。
- `shell`：游戏告诉壳子发生了什么时调用的方法（第 1.3 节）。每个实例有自己的 `shell`。
- `options`：`{ config, env, base }`，游戏的配置、它运行的环境和它的文件所在的目录（第 1.6 节）。用不到可以不写这个参数。
- **入口函数可能被调用多次**：同一个游戏放在两段，或玩家在结束卡上点重播，壳子都会再调一次入口函数，给一个新的 `root`。game.js 本身每个页面只执行一次，所以计分、关卡、计时这些状态都要放在入口函数里，不要放在 game.js 顶层。
- 返回值 `{ start, pause, resume }`，`start` 必须有。要先加载资源时返回一个 Promise，加载完 resolve 这个对象。交出它的那一刻就是加载完成，壳子轮到这一段时调用 `start`。它通常提前加载，等前面的视频和转场放完。
- `start` 只调用一次；之后 `pause`、`resume` 交替调用，不会连着两次 `pause`。这一段结束后游戏可能只收到 `pause`。
- `destroy`：这一段卸载时调用（离开这一段、重播前）。没有它，壳子只调用 `pause` 再移走 `root`，游戏的计时器、声音可能还在后台跑。
- 入口函数抛错、返回的 Promise 失败、没有交出 `start`，都算加载失败：壳子记下错误，收不到加载完成，按第 3 节跳过这一段。

### 1.3 shell 的方法

| 方法 | 什么时候调用 | 壳子记成的消息（第 2 节） |
|---|---|---|
| `shell.step(percent)` | 每个成功的玩法步骤；`percent` 是本关进度 0–100，可省略 | `step`，跨过 25 / 50 / 75 的那一步带 `progress` |
| `shell.win(options)` | 一轮赢了 | `result`（`result: 'win'`） |
| `shell.fail(options)` | 一轮输了 | `result`（`result: 'fail'`） |
| `shell.retry()` | 用户在本关点「再来一次」 | `retry` |
| `shell.level(n)` | 进入第 n 关（多关） | `level`（`level: n`） |
| `shell.end()` | 没有结果就结束（跳过、放弃等） | `end` |
| `shell.cta(clickSource)` | 用户点了会跳商店的位置 | `cta`（`click_source: clickSource`） |
| `shell.sound(muted)` | 用户点了游戏自己的声音开关 | `sound`（`muted: true / false`） |
| `shell.haptic(style)` | 想让手机震一下（选填）；`style` 见第 2 节，省略为 `light` | `haptic`（`style`），不上报 |

- `options`：后面还有下一关或重试时传 `{ continuePlaying: true }`，最后一轮不传。
- 每个方法的频率、次数和先后规则见第 2、3 节；不符合规则的调用被壳子丢弃，原因见第 6 节。
- 这一段卸载之后（离开、重播），旧实例再调用 `shell` 的方法都不起作用。

### 1.4 壳子替游戏做的事

壳子不改游戏的任何东西：不往 `root` 里加元素、不拦截事件。它只做这些：

- 按顺序加载 `game.css`、`game.js`，每个文件每个页面只加载一次；每段调用一次入口函数，交给它 `root`、`shell` 和 `options`（第 1.6 节）；
- 入口函数交出 `start` 后记下 `ready`；轮到这一段、广告不可见、重新可见时，调用 `start` / `pause` / `resume`；屏幕大小或方向变了、壳子叠在画面上的标题和 banner 变了、玩家用壳子的声音按钮切了声音，调用 `setEnv`（第 1.6 节）；
- `start` 之后，每关第一次按下 `root` 时记下 `first_touch`，游戏自己的触摸处理照常进行；
- 把 `shell.step(percent)` 的进度换算成 25 / 50 / 75 档，`shell.level(n)` 之后从 0 重新算；
- 每次调用记下调用的时间（上报里的 `h5_ts`）；
- 游戏的文件里抛出的未处理错误记成这个游戏的 `error`；这一段卸载时调用 `destroy`。

### 1.5 把现有游戏改成 game.js（不改玩法和 UI）

只改接入代码，游戏本身原样搬过来：

| 原来 | 改成 |
|---|---|
| `index.html` 里 `<style>` 的内容、`<link>` 引用的 CSS | 放进 `game.css`，规则不变；`html, body` 上的规则改到游戏最外层的元素上，其他选择器前面都加上它（第 1.1 节） |
| `<body>` 里的标记 | 原样放进游戏最外层的元素，再把它加进 `root`：`root.appendChild(box); box.innerHTML = '…'` |
| 用 `document.body`、`document.getElementById` 找自己的元素 | 改成从 `root`（或游戏最外层的元素）里找：`box.querySelector('#hud')` |
| `<script>` 引用的库和游戏脚本 | 按原来的加载顺序合并进 `game.js`，库在前，代码原样 |
| 页面加载后自动运行的启动代码、顶层的游戏状态 | 放进入口函数；真正开始玩法、声音、计时的那一步放进 `start` |
| 游戏原有的暂停、继续、销毁函数 | 在返回的 `pause` / `resume` / `destroy` 里调用它们 |
| 原来发的协议消息（`novvy(type, data)`、`postMessage`） | 换成下表的 `shell` 方法，删掉消息监听 |
| 原来跳商店的代码（`window.open`、`location.href`、`mraid.open`、下载链接） | `shell.cta('用户确认的 click_source')` |
| 资源的相对路径（`'assets/hero.png'`） | JS 里加上 `options.base`：`options.base + 'assets/hero.png'`；game.css 里的 `url()` 不用改 |
| 用 `fetch` / `XMLHttpRequest` 读包内文件 | 改用 `<img>` / `<audio>` / `<script>` 标签加载，或内联：真机从 file:// 打开，这些读不到 |

- 原来等 `window` 的 `load` 才运行的启动代码：入口函数被调用时页面早已加载完，直接运行，资源用 `<img>` 等的 `onload` 等，返回一个 Promise，启动代码跑完再交出 `start`。
- 原有的 `visibilitychange` 处理可以留着；页面可见性由壳子统一处理，游戏收到 `pause` / `resume` 就够了。

改造后游戏在壳子里的样子和玩法必须和原来一模一样。

| 原来发的消息 | game.js 里 |
|---|---|
| `ready` | 删掉：交出 `start` 即加载完成 |
| 收到壳子的 `start` / `pause` / `resume` | 返回的 `start` / `pause` / `resume` |
| `first_touch`、`error` | 删掉：壳子自己记 |
| `step`、`step{progress}` | `shell.step(本关进度百分比)` |
| `result{result:'win'}`、`result{result:'fail'}` | `shell.win()`、`shell.fail()` |
| `result{…, continue_playing:true}` | `shell.win({ continuePlaying: true })`、`shell.fail({ continuePlaying: true })` |
| `retry`、`level{level}`、`end` | `shell.retry()`、`shell.level(n)`、`shell.end()` |
| `cta{click_source}` | `shell.cta(click_source)` |
| `sound{muted}` | `shell.sound(muted)` |

例：平台的样例游戏（找钥匙，`samples/game/`）：标记放在 class 为 `find-key` 的 `<main>` 里加进 `root`，样式都以 `.find-key` 开头，元素用 `querySelector` 从它里面找；`novvy('step')`、`novvy('result', { result: 'win' })` 换成 `shell.step()`、`shell.win()`，收到 `start` 时做的事放进返回的 `start`，`destroy` 清掉计时器、移走自己的元素。

### 1.6 配置和运行环境（`options`）

游戏不要自己写死平台、语言、屏幕这些值，从 `options.env` 里取；环境变了，壳子调用返回的 `setEnv(patch)`。

- `options.config`：壳子不给配置，是 `{}`。平台的游戏模版在「Playable 编辑」页按描述文件（`template.json` 的 `fields`）设好关卡和玩法后存成 playable 素材，配置和这一关的素材已经打进它自己的 game.js。
- `options.base`：游戏自己的文件所在的目录（第 1.1 节）。
- `options.env`：运行环境，每个游戏的格式都一样：

| 字段 | 值 | 来源 |
|---|---|---|
| `api` | `1` | 环境格式的版本，只加字段不改含义 |
| `platform` | `ios` / `android` / `web` | 操作系统 |
| `language` | 如 `en`、`ja-JP` | 设备语言 |
| `mode` | `production` / `preview` | 平台预览时是 `preview` |
| `viewport` | `{ width, height, dpr }` | 屏幕的大小和像素比 |
| `safeArea` | `{ top, right, bottom, left }` | 屏幕的安全区（刘海、底部横条） |
| `insets` | `{ top, bottom }` | 壳子叠在画面上的标题、banner 占用的顶部和底部高度（CSS 像素，已留出间距），没有时是 0；游戏把棋盘让开 |
| `orientation` | `portrait` / `landscape` | 横竖屏 |
| `muted` | `true` / `false` | 玩家用壳子的声音按钮选的（在前面的视频段上）；没选过是 `false`，平台拒绝视频有声自动播放不算 |
| `reducedMotion` | `true` / `false` | 系统设置了减少动态效果 |
| `stage` | `{ index, count, round }` | 这是第几段、共几段、第几轮（结束卡上点重播是新的一轮） |
| `capabilities` | `{ webgl, webaudio, vibrate }` | 设备支持什么 |

- 屏幕的大小或方向变了，壳子调用 `setEnv({ viewport, orientation })`；壳子叠在这一段上的标题、banner 出现、收起、移动后，调用 `setEnv({ insets })`；玩家切了声音，调用 `setEnv({ muted })`。都只带变了的字段；游戏还没交出入口函数的返回值时变了的，交出后补一次。游戏没有返回 `setEnv` 就不调用。
- Playable 编辑页做的游戏在描述文件的 `runtime` 里声明必须的能力（`requires`，如 `webgl`）和加载最多要多久（`readyTimeoutMs`），素材库记下它们（第 10.6 节）；设备没有那项能力时壳子不调用入口函数，记下错误（`game_unsupported: …`），跳过这一段。

## 2. 消息参考（壳子收到的全部 type）

game.js 不发消息：壳子把第 1.3 节的每次调用记成一条消息，再按下表的规则处理；在「试玩日志调试」页面看到的就是它们。

| type | game.js 里 | 什么时候发 | data | 规则 |
|---|---|---|---|---|
| `ready` | 壳子记：入口函数交出 `start` 时 | 资源加载完、第一屏可以展示 | 无 | 只有一次；通常在轮到这一段之前（壳子会提前加载） |
| `first_touch` | 壳子记：`start` 之后本关第一次按下 `root` | 本关第一次真实玩法操作 | 无 | 每关一次；没有也行，第一条 `step` 会自动补首触 |
| `step` | `shell.step(percent)` | 每个**成功**的玩法步骤 | `progress?: 25 \| 50 \| 75` | 跨过 25% / 50% / 75% 的那一步带上对应值，其他步骤不带；每秒最多 10 条、每关最多 500 条 |
| `result` | `shell.win()` / `shell.fail()` | 一轮出结果 | `result: 'win' \| 'fail'`（必填）, `continue_playing?: boolean` | 一轮只认一个；`win` 要求本关已有首触或步骤；后面还有下一关或重试时带 `continue_playing: true`（即 `{ continuePlaying: true }`） |
| `retry` | `shell.retry()` | 用户在本关点「再来一次」 | 无 | 允许再报一次 `result`；关号不变，步数、进度、时长继续累计；每关最多 50 次 |
| `level` | `shell.level(n)` | 进入下一关（多关） | `level: number`（必填） | 只能是当前关 + 1，且不超过上传时声明的关卡数（1–20）；单关试玩不能发 |
| `end` | `shell.end()` | 没有结果就结束（跳过、放弃等） | 无 | 立即结算这一段，2 秒后进入下一段 |
| `cta` | `shell.cta(clickSource)` | 用户点了会跳商店的位置（下载按钮、空白处等） | `click_source: 'cta_click' \| 'forced_click_to_appstore'`（每条都带） | 即调用壳子的 click，所有跳商店的点击都只用它；每个位置报哪个值由用户决定（第 2.1 节），不带记为 `unknown`；两次间隔至少 1 秒；壳子调用 SDK 打开商店 |
| `sound` | `shell.sound(muted)` | 用户点了游戏自己的声音开关 | `muted: boolean`（必填） | 和上一条相同的状态丢弃；每次展示最多 100 条 |
| `error` | 壳子记：加载失败、入口函数或它交出的方法抛错、游戏的文件里未处理的错误 | 捕获到脚本错误 | `message: string`（必填） | 只保留前 160 字符；每次展示最多 5 条；轮到这一段之前也算 |
| `haptic` | `shell.haptic(style)` | 想让手机震一下（落子、得分、通关） | `style?: 'light' \| 'selection' \| 'medium' \| 'heavy' \| 'success' \| 'warning' \| 'error'` | 选填；每秒最多 5 次；不上报。Android 要玩家点过广告才会震，iOS 网页震不了 |

progress 的含义由上传时选择的玩法类型（`playable_type`）决定，game.js 按下表算 `percent`：

| playable_type | 一局怎么结束 | progress 表示 | result |
|---|---|---|---|
| `level` 关卡制 | 完成本关目标，或失败 | 本关目标的完成度 | 过关 `win`，失败 `fail` |
| `timed` 限时制 | 倒计时结束 | 已用时间占限时的比例 | 时间到时达标 `win`，否则 `fail` |
| `moves` 限步制 | 步数或次数用完 | 已用步数占总步数的比例 | 用完时达标 `win`，否则 `fail` |
| `endless` 无尽制 | 玩到失败为止 | 没有上限，不带 progress | 只发 `fail`，或用 `end` 结束 |

progress 规则：

- 例：3 对牌的连连看，第 1、2、3 对分别对应 33%、67%、100%：依次调用 `shell.step(33)`、`shell.step(67)`、`shell.step(100)`，再调用 `shell.win()`。壳子收到 `step{progress:25}`、`step{progress:50}`、`step{progress:75}`、`result{result:'win'}`。
- 一步跨过多档（例如从 20% 跳到 80%）只带最高的那一档（75），壳子会补发中间的里程碑。
- progress 只增不减，壳子取最大值；同一关重试后可以再报已报过的档，不会重复计数。
- 进入下一关后进度从 0 重新开始。

### 2.1 点击跳转商店（`cta` 与 `click_source`）

游戏要加点击跳转，只能调用壳子的 click（`shell.cta`），由壳子调用 SDK 打开商店；游戏自己不调 SDK，也不跳转：

```text
游戏：用户点了某个跳商店的位置 → shell.cta(用户给这个位置定的值) → 壳子记成 cta{click_source}
  → 壳子的 click：click_source 不是下面两个值之一的丢弃（bad_field），间隔不到 1 秒的丢弃（cta_throttled）
  → 本段未结算时先报 interactive_summary(trigger=cta_click)
  → 壳子上报 creative_click，click_source 原样填入
  → 壳子调用 SDK 的 novvy.open()：SDK 打开这条广告配置的跳转地址（商店），并在 SDK 侧记一次点击
```

`click_source` 只有两个值：

| 值 | 含义 |
|---|---|
| `cta_click` | 用户点了明确的下载 / 安装按钮 |
| `forced_click_to_appstore` | 用户点的不是下载按钮（画面空白处、背景、角色等），也打开了商店 |

**每个跳商店的位置都由用户决定报哪个值**：

1. 写代码前，把游戏里所有会跳商店的点击逐条列给用户：在哪、什么时候能点、建议值。例如：

   | 位置 | 什么时候能点 | 建议值 |
   |---|---|---|
   | 底部「Download」按钮 | 随时 | `cta_click` |
   | 结算页「Install」按钮 | 出结果后 | `cta_click` |
   | 画面空白处 | 过关后 | `forced_click_to_appstore` |

2. 用户逐条确认（可以改建议值）；用户没确认的位置不要做成跳商店。原来的游戏里没有的跳商店位置不要新加（那会改变玩法和界面）。
3. 把确认的值写死在对应位置的 `shell.cta('…')` 里：一个位置固定一个值，不按运行时状态切换，一次点击只调用一次。

- 不带 `click_source` 的 `cta`（`shell.cta()`）仍会打开商店，但上报记为 `click_source=unknown`，打包检查也会提示。
- SDK 只打开广告配置的地址，不接收游戏指定的 URL，所以 `shell.cta` 不带地址。

壳子自己也有几种跳商店的点击，在组装页按节点配置（各段的「通用设置」和结束卡节点），`click_source` 固定如下；游戏不用管，也不能自己实现：

| 位置 | `click_source` |
|---|---|
| 视频段播放满设定秒数后点画面（banner 以外的地方） | `forced_click_to_appstore` |
| CTA banner 上的按钮 | `cta_click` |
| 结束卡上的按钮 | `cta_click` |
| 结束卡开启「点任意位置跳商店」后，点按钮以外的地方 | `forced_click_to_appstore`，另带 `tap_anywhere: "true"` |
| 试玩节点的「自动跳转商店」按时间：这段试玩开始满设定秒数后自动打开 | `forced_click_to_appstore`，另带 `auto_jump: "true"`、`auto_jump_after`（秒） |
| 试玩节点的「自动跳转商店」按步数：第 N 个有效步骤自动打开，之后每隔几步再打开 | `forced_click_to_appstore`，另带 `auto_jump: "true"`、`auto_jump_mode: "steps"`、`step`（这段里第几步，重玩后从 1 数） |
| 试玩节点的「自动跳转商店」通关时：通关时自动打开（按步数时，还没跳过也会在通关时跳一次） | `forced_click_to_appstore`，另带 `auto_jump: "true"`、`auto_jump_mode: "win"` |
| 结束卡的「自动跳转商店」：结束卡出现满设定秒数后自动打开 | `forced_click_to_appstore`，另带 `auto_jump: "true"`、`auto_jump_after`（秒） |

按时间自动跳转的计时从这段试玩（或结束卡）开始、跨关累计、广告不可见时暂停；每段最多跳一次，玩家在这段里已经跳过商店就不再自动跳。按步数、通关时的跳转按次数来，可以跳多次（两次之间至少 1 秒）。

### 2.2 点击先到自定义跳转页面（模版通用设置）

上面每一种跳商店的点击（游戏的 `shell.cta` 也一样）最后去哪，由组装页的「模版通用设置 · 点击跳转」决定，整个素材一个设置，**游戏不用管，也不用改写法**：

- **SDK 直接跳商店**（默认）：如上，壳子调用 `novvy.open()`。
- **先打开自定义跳转页面**：壳子不调 SDK，而是把自定义跳转页面盖在广告上面，游戏在后面暂停（壳子调用它的 `pause`），关掉页面后壳子调用 `resume`。在页面里点下载，壳子才调用 `novvy.open()`。页面显示期间，游戏的 `shell.cta` 会被丢弃（`landing_open`，第 6 节）。

自定义跳转页面本身怎么做（上传的 HTML 或在线网址、下载按钮怎样走 SDK、沙箱里不能用的写法），见「自定义跳转页面接入」`/docs/landing-page.md`。

## 3. 时序与状态

一段试玩的生命周期（括号里是壳子收到的消息）：

```text
（加载）→ 入口函数交出 start（ready）──等待──> start() → 首次触摸（first_touch）→ shell.step()…（step）→ shell.win() / shell.fail()（result）
          ├─ shell.win({ continuePlaying: true }) → shell.level(n + 1) → 新一关
          ├─ shell.fail({ continuePlaying: true }) → shell.retry() → shell.step()… → 结果
          ├─ 结果不带 continuePlaying → 本段结算，2 秒后下一段
          └─ shell.end() → 本段结算，2 秒后下一段
```

状态规则（违反时消息被丢弃，原因见第 6 节）：

- `start` 被调用之前只接受 `ready` 和 `error`：这之前的 `shell` 调用都被丢弃。
- 卸载之后（离开这一段、重播）的实例：`shell` 调用都不起作用，壳子调用过它的 `destroy`。
- 一轮只接受一个结果；要再出结果，先 `shell.retry()` 或 `shell.level(n)`。
- 本段结算后（最终结果或 `shell.end()`）只接受 `shell.cta`、`shell.sound` 和脚本错误。
- `shell.level` 只能逐关 +1；单关试玩调用会被丢弃。
- 壳子**不会**替按协议上报的游戏结束这一段：不调用最终的 `shell.win` / `shell.fail` / `shell.end` 就一直停在这一段。
- 进入这一段 10 秒内还没收到 `ready`，壳子判定加载失败（上报 `creative_error`，`message=playable_not_ready`、`source=shell`）并跳到下一段；Playable 编辑页做的游戏按它声明的 `runtime.readyTimeoutMs`（1–60 秒）等。
- 组装页可以给视频设一个进入后面试玩的转场（倒计时、点击开始、剧情二选一、任务卡、加载过场、上滑进入、定格冲击）。转场由壳子播放（倒计时叠在视频最后几秒，其他在视频播完后），**转场结束才调用 `start`**：游戏照常加载好、交出 `start`，然后等它，不要自己提前开始。「加载过场」会等它的 `ready`；「上滑进入」时它的 `root` 从下面露出来，被拖着上移。

## 4. 参考实现（可直接复制）

```js
// game.js：普通脚本。引擎库合并在这之前，原样。
NovvyGame(function (root, shell, options) {
  var box = document.createElement('div');                              // 游戏最外层的元素，样式都以 .my-game 开头
  box.className = 'my-game';
  box.innerHTML = '<canvas class="stage"></canvas><div class="hud"></div>';   // 原来 <body> 里的标记，原样
  root.appendChild(box);
  var game = createGame(box.querySelector('.stage'), options.base);   // 原来的初始化，原样；资源路径前加 options.base

  // 在原有的事件处告诉壳子；每个跳商店位置的 click_source 是用户确认过的值（第 2.1 节）
  game.onSuccessfulMove = function (percent) { shell.step(percent); };
  game.onLevelWon = function (hasNextLevel) { shell.win({ continuePlaying: hasNextLevel }); };
  game.onNextLevel = function (levelNumber) { shell.level(levelNumber); };   // 第 2 关传 2
  game.onLevelFailed = function (canRetry) { shell.fail({ continuePlaying: canRetry }); };
  game.onRetry = function () { shell.retry(); };
  game.onSkip = function () { shell.end(); };
  game.onInstallButton = function () { shell.cta('cta_click'); };
  game.onBlankAreaAfterWin = function () { shell.cta('forced_click_to_appstore'); };
  game.onSoundToggle = function (muted) { shell.sound(muted); };

  // 资源加载完、第一屏能展示时交出 start / pause / resume / destroy
  return game.load().then(function () {
    return {
      start: function () { game.play(); },      // 开始玩法、声音、计时
      pause: function () { game.pause(); },
      resume: function () { game.resume(); },
      destroy: function () { game.dispose(); root.removeChild(box); }
    };
  });
});
```

`createGame`、`game.load / play / pause / resume / dispose` 和各个 `on…` 事件都是游戏原有的代码，名字随游戏而定；接入只是在这些地方加上一行 `shell` 调用。

## 5. 常见流程（按顺序发出的消息）

下面是壳子按顺序记下的消息，也就是「试玩日志调试」页面左栏的样子；game.js 里对应第 1.3 节的调用。

单关，过关：

```text
ready → (start) → first_touch → step{25} → step → step{50} → step{75} → result{win}
```

单关，失败后重试再过关：

```text
ready → (start) → first_touch → step{25} → result{fail, continue_playing:true}
      → retry → step → step{50} → step{75} → result{win}
```

失败后放弃（不重试）：

```text
… → result{fail, continue_playing:true} → end
```

两关：

```text
ready → (start) → first_touch → step{25} → step{50} → step{75} → result{win, continue_playing:true}
      → level{2} → first_touch → step{25} → … → result{win}
```

限时制，时间到未达标：

```text
ready → (start) → first_touch → step → step{25} → … → step{75} → result{fail}
```

无尽制：

```text
ready → (start) → first_touch → step → step → … → result{fail}
```

任意时刻点下载：

```text
… → cta{click_source:'cta_click'}    // 壳子的 click：本段未结算时先发一份进度快照，再调用 SDK 打开商店
```

## 6. 被丢弃的原因与修正

壳子对每次调用给出"收下 / 丢弃 + 原因"（在平台的「试玩日志调试」页面可以逐条看到）。页面上壳子按先后给每条消息编号（#1、#2…，丢弃的也占号），它引起的上报带同一个编号；被丢弃的消息在右栏没有对应编号的上报。

| 原因码 | 含义 | 怎么改 |
|---|---|---|
| `rate_limited` | 所有调用每秒超过 50 次，或 `shell.step` 每秒超过 10 次，或 `shell.haptic` 每秒超过 5 次 | 只在真实成功时调用 `shell.step`；震动只给关键时刻 |
| `bad_field` | 参数类型不对：`shell.level` 不是整数，`shell.cta` 的值不是那两个之一 | `shell.level` 传整数，`shell.cta` 传 `'cta_click'` 或 `'forced_click_to_appstore'` |
| `bad_progress` | step 的 progress 不是 25 / 50 / 75 | game.js 不会出现：壳子按 `percent` 换算 |
| `duplicate` | 和上一条状态相同的 `sound` | `shell.sound` 只在状态变化时调用 |
| `not_started` | 还没收到 `start` 就发了玩法消息 | `start` 被调用之后再开始玩法 |
| `stage_closed` | 本段已结算后又发玩法消息 | 最终结果或 `shell.end()` 之后只调用 `shell.cta`、`shell.sound` |
| `result_already_reported` | 本轮已经报过结果 | 先 `shell.retry()` 或 `shell.level(n)`，再报下一个结果 |
| `win_without_input` | 本关没有任何操作就报 `win` | 先有触摸或 `shell.step` |
| `single_has_no_levels` | 单关试玩发了 `level` | 单关不要调用 `shell.level`；多关要在上传时声明关卡数 |
| `level_out_of_order` | `level` 不是当前关 + 1，或超过声明的关卡数 | 逐关 +1 |
| `limit_reached` | 超过次数上限（step 每关 500、retry 每关 50、error 5、sound 100） | 检查是否在循环里重复调用 |
| `cta_throttled` | 两次 `cta` 间隔不到 1 秒 | 防止连点 |
| `landing_open` | 自定义跳转页面正在显示（第 2.2 节），这时只认页面里的点击 | 不用改：玩家关掉页面后，游戏里的点击照常 |
| `bad_haptic` | `shell.haptic` 的 `style` 不是第 2 节列出的那几个 | 换成列出的值，或不传（`light`） |

## 7. 打包要求

- 交付物：单个 `game.js`，或 `game.js` 加资源的 ZIP（第 1.1 节），不超过 5 MB，超过的上传不了。整个组装包不超过 10 MB，解压后不超过 30 MB、条目（文件夹也算）不超过 4000 个，否则 SDK 不展示这条广告。
- 所有资源放在包内，用 `options.base` 开头的路径引用。壳子的页面带 CSP：`default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'`，外部网址的脚本、图片、接口都会被拦截；以 `/` 开头的绝对路径也不会加载。
- 运行环境：和壳子同一个页面、同一个 window。可以用 localStorage；不能弹窗（含 `window.open`、`alert`、`confirm`）、不能跳转页面、不能提交表单，不能动 `root` 以外的元素。
- 以下写法打包时**直接拒收**：
  - 不是 game.js 格式：包里没有 game.js（自带 `index.html` 的整页试玩包、单个 HTML）；
  - game.js 里没有调用 `NovvyGame(…)`；game.js 里有 `import` / `export`（普通脚本不能运行）；
  - 访问宿主 SDK：`window.novvy`（`self`、`parent`、`top`、`globalThis` 上的也算）、`novvy.request / click / open / bid / useCustomClose`、`window['novvy']`（打开商店请调用 `shell.cta`，由壳子调用 SDK）；
  - 调用 App 原生通道：`webkit.messageHandlers`（包括只做检测的写法）；
  - 调用旧接口或壳子的内部：`NovvyPlayable`、`NovvyAnalytics`、`NovvyShell`、`NovvyShellConfig`、`__novvy…` 变量、`getElementById('novvy…')` 取壳子的元素（比如量壳子的视频、下载卡还在不在、有多高：改用 `options.env.insets`）；
  - 出现统计地址：`tracking.novvy.ai`，或测试环境的 `tracking-server-staging-….run.app`（写在字符串里也算）。
- 会提示但不拒收：game.js 里没找到 `shell.step`、`shell.win / fail / end`、返回的 `pause` / `resume` / `destroy`、`shell.cta` 和 `click_source`（多关还有 `shell.level`）；用 `location`（包括 `top.location`）跳转（会让整个广告离开：Android 点了没反应，iOS 出现商店网页或白屏）；用 `fetch` / `XMLHttpRequest` 读包内文件（真机上会失败）；`game.css` 里有 `html`、`body`、`:root`、`*` 这类改到整个页面的规则；包里带了不会用到的 `index.html`；`game.js` 或 `game.css` 超过 12 MB，没有做静态检查（`scan_limit`，制作方要自己确认符合本节）。

## 8. 壳子据此上报什么（理解日志用）

壳子把每条收下的消息变成发往 Tracking 的事件（GET `https://tracking.novvy.ai/v1/h5/event?...`，参数 `name`、`ts`、`p` 等）。游戏的调用不会原样转发，只有 `shell.cta` 的 `click_source` 校验后填进上报。下表是去重之后的结果（规则见 8.1）：

| 收到的消息 | 壳子上报的事件 |
|---|---|
| `ready`（且轮到这一段） | 本段第一次开始时 `media_play` |
| `first_touch` | 本段第一次操作时 `creative_interaction`（`action=first_interaction`） |
| `step` | 本段首次跨过某一档时 `media_progress`；然后 `creative_interaction`（`action=step`） |
| `result` | `win` 先补 100 的里程碑；不带 `continue_playing`：`media_complete` → `interactive_summary(trigger=stage_end)`；带 `continue_playing`：先暂存，见 8.1 |
| `retry` | `game_restart` |
| `level` | 上一关 `interactive_summary(trigger=level_end)` |
| `end` | 有暂存的结果先报 `media_complete`；然后 `interactive_summary(trigger=stage_end)` |
| `cta` | 本段未结算时 `interactive_summary(trigger=cta_click)`；然后 `creative_click`（`click_source` 来自消息），再调用 SDK 打开商店 |
| `sound` | `creative_interaction`（`target=sound_button`） |
| `haptic` | 不上报（只让手机震动） |
| `error` | `creative_error`（`source=playable`） |

每条事件的 `p`（JSON，值都是字符串）里有：

- `stage_index`、`stage_type`、`stage_list`：第几段、段类型（`video` / `playable` / `image` / `end_card`）、整条播放顺序。有结束卡时它是最后一段（`stage_type=end_card`，例如 `["video","playable","end_card"]`），结束卡上的事件记在这一段；转场不算一段；
- `play_round`：玩家在结束卡上点「再玩一次」后，从第 1 段重新播放，之后的事件带 `play_round`（2、3…），第一轮不带；
- 试玩段另有 `playable_type`、`playable_level_count`、`playable_level`；
- **`h5_ts`**：由游戏的某次调用引起的事件都带，值为那次调用的时间（壳子加载完成、首次触摸、脚本报错也算）。壳子自己产生的事件（视频、计时器、壳子自己的按钮）不带 `h5_ts`。

### 8.1 去重

去重由壳子负责：游戏照第 1.3 节调用即可，不用自己去重，也不要靠重复调用补报。

**一件事只用一个事件名。** 每件事只报标准事件（`creative_*` / `media_*`），以下兼容名不再发送：`playable_entry`、`first_interaction`、`game_start`、`interaction_milestone`、`interaction_step`、`playable_complete`、`playable_hidden`，事件名 `cta_click`（`trigger=cta_click`、`click_source=cta_click` 这两个字段值不受影响），以及试玩出结果时的 `end_card_shown(trigger=playable_complete)`。

**同一事件在一段里报几次、取哪条：**（「每段」指同一轮里的这一段：结束卡上点「再玩一次」后的新一轮重新计，事件带 `play_round`）

| 事件 | 范围 | 取哪条 | 说明 |
|---|---|---|---|
| `media_play` | 每段一次 | 第一条 | 视频暂停后继续播、试玩进入下一关，都不再报 |
| `creative_interaction`（`action=first_interaction`） | 每段一次 | 第一条 | 多关试玩只报第一次操作；每关自己的首触耗时在该关 `interactive_summary` 的 `ttfi_ms` 里 |
| `media_progress`（25 / 50 / 75 / 100） | 每段每档一次 | 第一条 | 在哪一关首次跨过这一档，就报那一关；之后的关、重试后再跨过都不报。每关的进度看该关 `interactive_summary` 的 `progress` |
| `media_complete`（试玩） | 每段一次 | 最后一条 | 带 `continue_playing` 的结果先暂存，被下一个结果替换；本段结束时（`end`、最终 `result`、宿主关闭广告）报出最后那条，请求参数 `ts` 和 `h5_ts` 仍是那个结果发生时的值。每关的结果看该关 `interactive_summary` 的 `completion_status` |
| `end_card_shown` | 每轮一次 | — | 只表示壳子的结束卡（`trigger=creative_end`，带 `style` 模板名：`classic` / `blur` / `store` / `tbc` / `result` / `gift` / `minimal`，用一张图片做结束卡时为 `image`），记在结束卡这一段。流程里没有结束卡节点时不发 `end_card_shown`，广告停在最后一段（视频停在最后一帧、试玩停在自己的画面），banner 和点击仍能跳商店，但不再自动跳转 |
| `interactive_summary` | 每关一条最终汇总 | 最后的状态 | `trigger=cta_click` 是点击时的快照，可以有多条；`level_end` / `stage_end` / `close` 每关只有一条，分析某一关以它为准，不要和快照相加 |
| 消息本身 | — | 第一条 | 本轮第二个 `result`、状态没变的 `sound`、1 秒内的第二个 `cta` 都丢弃（第 6 节） |

### 8.2 壳子自己的事件：图片段、转场、结束卡、重播

这些事件不由游戏的调用引起，游戏不用管，看日志时会遇到：

| 事件 | 什么时候 | 主要字段 |
|---|---|---|
| `media_play`（`media=ad_image`） | 图片段开始显示，每段一次 | 记在图片那一段 |
| `media_complete`（`media=ad_image`） | 图片显示满设定的秒数（广告不可见时暂停计时），随后进入下一段 | `duration_ms` |
| `creative_click`（`scene=image`） | 图片段里点画面跳商店（显示满设定的秒数后才生效，可关闭） | `click_source=forced_click_to_appstore` |
| `transition_shown` | 转场开始。视频进入试玩：倒计时叠在视频最后几秒开始，其他在视频播完后开始；两段视频之间：淡入淡出和闪白在视频最后半段转场时长开始，其他在视频播完后开始 | `style`（进入试玩：`countdown` / `tap` / `choice` / `mission` / `loading` / `swipe` / `punch`；两段视频之间：`fade` / `dissolve` / `flash` / `zoom` / `slide` / `wipe` / `blur`）、`to_stage`（转场之后的那一段）；记在转场之前的视频那一段 |
| `creative_interaction`（`target=transition`） | 玩家在转场里操作：`action` 为 `tap`、`choice`（另带 `choice: A / B`）、`start`、`swipe_up` | `style`、`to_stage` |
| `transition_complete` | 转场结束、进入下一段（两段视频之间的转场在下一段开始时就报，后半段叠在下一段开头播完） | `style`、`to_stage`、`trigger`（`tap`、`choice`、`start`、`swipe_up`、`timeout`、`ready`、`video_end`、`auto`）、`duration_ms` |
| `creative_interaction`（`target=replay`、`action=restart`） | 玩家点结束卡上的「再玩一次」 | 记在结束卡这一段；之后从第 1 段重新开始，事件带 `play_round` |
| `creative_click`（`action=open_landing`） | 点击跳转设成自定义跳转页面时（第 2.2 节），任何一种跳商店的点击都改成打开这个页面，不调用 SDK | 和原来那次点击的 `click_source`、`scene` 等字段相同，另带 `landing_style`（`full` / `half` / `card`） |
| `creative_click`（`scene=landing`） | 在自定义跳转页面里点下载，壳子调用 SDK 打开商店（`action=open_destination`） | `click_source`（见第 2.2 节）、`landing_style`；点任意位置的另带 `tap_anywhere` |
| `creative_interaction`（`target=landing_page`、`action=close`） | 玩家关掉自定义跳转页面，广告继续 | `trigger`（`button`：右上角 ×；`backdrop`：点旁边模糊的地方；`page`：页面自己关的）、`landing_style` |

转场里的震动由壳子发起（Android 玩家点过广告后才会震，iOS 网页不能震），不上报。

## 9. 交付前自检

上传的 game.js 和格式样例逐条过一遍；内置游戏模版还要过第 10.7 节。

- [ ] 交付的是 `game.js`，或 `game.js` 加资源的 ZIP；包里没有 `index.html`；`game.js` 是普通脚本，没有 `import` / `export`。
- [ ] game.js 执行时就调用了一次 `NovvyGame(function (root, shell, options) { … })`，交出 `{ start, pause, resume, destroy }`（要等资源就返回 Promise）。
- [ ] 界面只在 `root` 里；没有往 `document.body` 加东西，没有用全局的 `getElementById` 找元素；game.css 的选择器都以游戏自己的 class 开头。
- [ ] 游戏的状态都在入口函数里：同一页面上调用两次入口函数，两个实例互不影响；`destroy` 之后没有计时器、声音还在跑。
- [ ] 资源路径都以 `options.base` 开头（game.css 里的 `url()` 除外）。
- [ ] 和原来的游戏对比过：玩法、关卡、数值、计时、画面、布局、文案、动画、音效都没变，改动只在接入代码（第 1.5 节）。
- [ ] `start` 被调用之后才开始玩法、声音、倒计时；`pause` / `resume` 暂停和继续它们。
- [ ] `shell.step` 只在真实成功时调用，带本关进度百分比。
- [ ] 每轮调用 `shell.win()` / `shell.fail()`；后面还有下一关或重试时带 `{ continuePlaying: true }`，最后一轮不带。
- [ ] 多关：进入下一关调用 `shell.level(n)`（当前关 + 1），关卡数和上传时声明的一致。
- [ ] 重试调用 `shell.retry()`；跳过 / 放弃调用 `shell.end()`。
- [ ] 所有跳商店的位置都列给用户确认过；每个位置只调用 `shell.cta(…)`，带用户定的 `click_source`（`cta_click` / `forced_click_to_appstore`）；代码里没有 `window.open`、商店链接跳转、`location.href`、`top.location`，也没有定时自动跳商店。
- [ ] 没有在游戏里新加标题、CTA banner、转场、结束卡（游戏原有的结算页和下载按钮照旧）；游戏的声音开关调用 `shell.sound`，震动调用 `shell.haptic`。
- [ ] 平台、语言、屏幕、声音、`insets` 都从 `options.env` 取，收到 `setEnv` 后跟着变，没有写死。
- [ ] game.js 里没有 `postMessage`，也没有 `window.novvy`、`webkit.messageHandlers`、`NovvyPlayable`、`NovvyAnalytics`、`NovvyShell`、`getElementById('novvy…')`、`tracking.novvy.ai`、`tracking-server-staging`。
- [ ] 不用 `fetch` / `XMLHttpRequest` 读包内文件：素材在真机上从 file:// 打开，这些都会失败。
- [ ] 所有资源都在包内；包不超过 5 MB，整个组装包不超过 10 MB、解压后 ≤ 30 MB、≤ 4000 个条目。
- [ ] 在平台「试玩日志调试」页面上传后完整玩一遍：没有被丢弃的消息，右栏能看到对应的上报。

## 10. 平台内置游戏模版（`backend/games/`）

本节只针对本仓库里平台自带的 7 个游戏模版：Escape Arrow、DragonCube、Colorever、FreeCell、Grill Sort、Tasty Travels、Block Out。它们在「Playable 编辑」页设好配置后存成素材库里的 game.js 包，和上传的包一样跑在壳子的页面上，所以第 0–9 节对它们同样适用，本节是额外要求。构建和测试的用法见 `backend/games/README.md`。

### 10.1 从源码到素材

```text
backend/games/<id>/game.js：注册 window.NovvyTemplates['<id>@<version>'] = Object.freeze({ create })
  + shared/novvy-entry.js（构建时接在后面）：调用 NovvyGame(entry)，把游戏的 emit 转成 shell 调用
  → npm run build：esbuild 打成 IIFE（es2020），放进 app/creative/shell/games/<id>-<version>/（产物不提交）
  → Playable 编辑页保存：engine/games.py 的 package 把它包进一个函数，函数里的 NOVVY_GAME_PACKAGE 放着配置和选中那一关的素材
  → 素材库里的一条 game.js 包：playable_type=level，关卡数 1
```

- 游戏自己不调用 `NovvyGame`，也拿不到 `shell`：入口和所有 `shell` 调用都在 `shared/novvy-entry.js` 里，7 个游戏共用。
- 加载 game.js 只给 window 加一个全局变量 `NovvyTemplates`。
- 一条素材只玩一关：不要发 `level`；`step` 的进度是本关目标的完成度。

### 10.2 游戏接口

```js
const game = NovvyTemplates['<id>@<version>'].create({ container, assets, config, env, emit });
await game.init(config);          // 省略时用 create 的 config
game.start(); game.pause(); game.resume(); game.replay(); game.end(); game.destroy();
game.setEnv(patch); game.setMuted(muted); game.setInsets({ top, bottom }); game.resize(); game.getState();
```

- 这 12 个方法都要有（`tests/games.test.mjs` 检查）。`init` 的 Promise 完成就是加载完成（壳子记 `ready`），失败就是加载失败（壳子记 `error`）。`start` 之前不开始玩法、声音和计时。
- `destroy` 在 `init` 之前、`init` 还没完成时调用都要清干净，调两次不出错；`destroy` 之后不再 `emit`，也不会晚到一个 `ready`。
- `emit({ type, ts, data })` 和 `novvy-entry.js` 转成的调用：

| emit 的 type | 壳子收到的调用 |
|---|---|
| `step`（`data.progress`：本关进度 0–100） | `shell.step(progress)` |
| `result`（`data.result`：`win` / `fail`，`data.continue_playing`） | `shell.win()` / `shell.fail()`，带 `continue_playing` 时传 `{ continuePlaying: true }` |
| `retry`、`end` | `shell.retry()`、`shell.end()` |
| `level` | `shell.level(n)`；一条素材只有一关，不要发 |
| `haptic`（`data.style`） | `shell.haptic(style)` |
| `ready`、`error`、`first_touch` | 不转：前两个由 `init` 的 Promise 表示，首触由壳子自己记 |
| `progress`、`interaction` | 不转：平台还不上报 |

- `novvy-entry.js` 不转发 `cta` 和 `sound`。内置游戏不显示游戏自带的下载按钮，下载入口是壳子的 banner、结束卡和自动跳转，都在组装页配置。要给某个游戏加跳商店的位置，先按第 2.1 节列给用户确认，再在 `novvy-entry.js` 里加转发。游戏自己的声音开关要上报，也要先加转发。
- 允许结算后重玩（`allowReplay`）的游戏要留一个结束这一段的出口：`engine-stage.js` 在结算面板（`[role="dialog"]`）里加了一个「Continue」，点了调用 `end`。

### 10.3 环境、声音和资源

- 读写 env 都走 `shared/environment.js`（`createEnvironment`、`mergeEnvironment`）。env 的每个字段都可能缺，缺了就按游戏原来的做法；`setEnv` 只在值真的变了时才响应。
- 引擎原来写死的平台、语言、静音、屏幕都改成从 env 取：引擎游戏的适配代码里用 `ctx.environment`（`ctx.env` 是引擎作用域的 window）。`platform` 是操作系统，不是投放渠道；引擎里区分广告网络的开关一律固定为 `'web'`。
- 屏幕变了（`viewport`、`safeArea`、`orientation`）调用 `resize`。壳子的标题和 banner 占的高度（`insets`）只用来给棋盘让位置（引擎游戏用 CSS 变量 `--origin-hud-space`、`--origin-cta-space`），不要去量壳子的元素。
- 声音：创建时按 `env.muted`；不在运行时（`start` 之前、暂停、结束之后）一律静音；`setEnv({ muted })` 和 `setMuted` 切换。
- 资源全部内嵌：`assets.json` 的 `media` 都是 `data:` URI；引擎作用域里的 `fetch` / `XMLHttpRequest` 只读 `data:`，其他地址直接报错。关卡数据放在 `assets.levels`，key 是 `template.json` 里 `levels[].id` 的字符串，打包时只留选中的那一关。
- 游戏的 game.js 加上选中那一关的素材，就是一条素材的大小：打包后不能超过 5 MB，也算进组装包的 10 MB（第 7 节）。

### 10.4 隔离和释放

- 冻结的引擎跑在每个实例自己的作用域里：Block Out、Colorever、FreeCell、Grill Sort 用 `shared/engine-stage.js` 管生命周期；它们和 DragonCube 都用 `shared/engine-scope.js` 做作用域，Tasty Travels 用自己的 `scope.js`。作用域做这些事：
  - 伪 window / document：`document.body` 是游戏自己的根元素，`getElementById` 只在根元素里找，`innerWidth` / `innerHeight` 是容器的大小；
  - 计时器、动画帧、事件监听、Object URL 都记在实例上，`destroy` 时释放；`engine-scope.js` 还会在 `pause` 时停下计时器和动画帧，并收拢音频；
  - `novvy`、`mraid` 等宿主全局变量在作用域里读不到。
- 作用域不是安全沙箱，游戏和壳子仍在同一个页面上。所以第 7 节拒收的写法，冻结的引擎代码里也不能有。
- 不用作用域的 Escape Arrow 要自己做到同样的事：只在 `container` 里画；`pause` 时停下计时器和声音；`destroy` 清掉自己的所有东西；同一页面上的两个实例互不影响。

### 10.5 冻结代码和版本

- **冻结的引擎源码（`engine.txt`、`engine-sources.json`）原样不改。** 接入的改动只写在平台自己的适配代码里（各游戏的 `game.js`、`adapter.txt`、`layout.txt` 等，以及 `shared/`）。冻结的引擎被检查拦下时，不要改引擎，也不要自己往 `build.mjs` 的 `GUARD_ALLOW` 里加放行（现在为空），要先告诉用户：保存时的上传检查（第 7 节）没有例外。
- **已发布的 `id@version` 永远不改。** `games.lock.json` 记着每个版本 `game.js`、`assets.json` 的 sha256，产物变了构建就失败。改了玩法、素材、适配代码或 `shared/`，或者升级 esbuild 让产物变了，都要升版本：`template.json` 的 `version` 和 `game.js` 里注册的 key 一起改（`tests/` 里写死的版本也一起改），再运行 `npm run build -- --update-lock`，提交 `games.lock.json`。
- 只有从未发布过的版本才可以不升版本、直接 `--update-lock`。某个版本发布过没有由用户决定，**拿不准就先问用户**。
- 升版本后，旧版本不再构建。用旧版本做的素材照常播放，因为它的 game.js 已经存进了素材；但在 Playable 编辑页打开它时，会提示「已下线，只能选一个游戏重新做」。升版本之前要告诉用户这一点。
- 不改玩法和界面（第 0 节第 2 条）对内置游戏同样有效：配置项（`fields`）只能选游戏原有的关卡和玩法开关，不能借配置改出新玩法。

### 10.6 描述文件 `template.json`

| 字段 | 要求 |
|---|---|
| `id` | 和目录名相同；小写字母、数字、`-` |
| `version` | `x.y.z`，和 `game.js` 里注册的 key 一致 |
| `name`、`description` | 编辑页上显示 |
| `defaults` | 每个配置项的默认值，要能通过下表的校验 |
| `fields` | 编辑页上让用户设的配置项（`key`、`label`、`type`，可选 `optional: true`） |
| `levels` | 关卡列表（`id`、`name`…）；`assets.levels` 按它的 `id` 做 key |
| `runtime` | 见下 |

| `fields[].type` | 值 |
|---|---|
| `level` | `levels` 里某一关的 `id` |
| `boolean` | `true` / `false` |
| `select` | `options` 里某一项的 `value` |
| `number` | `min`–`max` 之间的整数（默认 0–99） |
| `limit` | `min`–`max` 之间的整数（默认 1–99），或 `"unlimited"` |

- 配置里不能有 `fields` 以外的 key；`optional` 的可以不填。校验有两份：后端 `engine/games.py` 的 `config_error` 为准，前端 `playable-editor/games.ts` 用同样的规则做即时提示，加字段类型时两边一起改。

```json
"runtime": { "api": 1, "engine": "Cocos Creator 3.8.5", "env": ["platform", "language", "muted", "viewport", "insets"],
             "requires": ["webgl"], "orientation": "portrait", "readyTimeoutMs": 20000 }
```

- `api`：`1`。`engine`：引擎的名字。
- `env`：游戏实际读的 env 字段（第 1.6 节的字段名），测试按它组合环境。
- `requires`：引擎没有退路的能力，只能是 `webgl`、`webaudio`，拿不准就不写。设备没有这些能力时，壳子直接跳过这一段。
- `orientation`：`portrait` 或 `landscape`；现在的游戏都是 `portrait`。
- `readyTimeoutMs`：1000–60000。Canvas 游戏写 10000，Cocos、Pixi 等引擎游戏写 20000。

### 10.7 改完要做的

- `npm --prefix backend/games run build` 在这些情况下会失败：`template.json` 不合规；game.js 没注册 `<id>@<version>`；打出来的 game.js 里有 `novvy.request / click / open / bid / useCustomClose`、`.messageHandlers`、`tracking.novvy.ai`、`tracking-server-staging`（字符串里也算）；锁住的版本产物变了。
- 编辑页保存时，打出来的包还要再过一遍第 7 节的上传检查，被拒收的写法（比如 `getElementById('novvy…')`）会导致保存失败。
- 加一个游戏：按 `backend/games/README.md` 的「加一个游戏」做，把 id 加进 `build.mjs` 的 `GAMES`，在 `tests/` 里加用例。
- 跑这些命令，都要通过：

```bash
npm --prefix backend/games test                    # 构建 + 游戏测试
cd backend && .venv/bin/python -m pytest -q tests/creative/studio/test_games.py tests/creative/studio/test_composer.py
npm --prefix frontend test                         # 含本文和壳子是否一致
```

自检：

- [ ] 冻结的引擎源码没动；玩法、关卡、数值、画面、文案、音效和原版一样。
- [ ] 产物变了的版本已经升版本（或者用户确认过这个版本没发布），`games.lock.json` 已更新。
- [ ] 12 个接口方法都在；`destroy` 在任何时候调用都能清干净，之后不再 `emit`。
- [ ] 平台、语言、静音、屏幕、`insets` 都从 env 取；`start` 之前和暂停时没有声音。
- [ ] 资源都是内嵌的 `data:` URI；`assets.levels` 的 key 和 `levels[].id` 对得上。
- [ ] `template.json` 的 `runtime` 合规，`defaults` 能通过校验。
- [ ] 没有显示自带的下载按钮，没有直接调 SDK，也没有请求统计地址。
- [ ] 上面三条命令都通过；在 Playable 编辑页预览、保存，再放进素材组装预览一遍，「试玩日志调试」页面上没有被丢弃的消息。
