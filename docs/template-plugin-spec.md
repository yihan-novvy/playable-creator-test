# 模板与插件规范

本规范定义 monorepo 中 `template-core/`（玩法源项目）、`editor/templates/`（构建产物）
与 `editor/plugins/`（editor 衔接层）的目录结构、契约文件与约束。
**新增一个 playable 模板 = 按本规范新增一个 template-core 目录 + 一个 plugin 目录，
editor 核心零改动。** 规范由 editor 启动时的注册表校验强制执行（见第 6 节）。

```
playable-creator/
├── template-core/          # 真实模板源码（玩法生成器）
└── editor/                 # 主项目，自包含
    ├── templates/          # template-core 的构建产物（提交入库）
    └── plugins/            # 衔接层（editor 的一部分，不是独立项目）
```

```
数据流（单向，禁止逆向）:

template-core/<name>/  --npm run build-->  editor/templates/<name>/
                                                   │ editor 内部消费；generated，禁止手改
                                                   ▼
editor/plugins/<name>/  (契约 + 覆盖层 + steps + 工作台)
                                                   │
                                                   ▼
editor/  ──运行任务──>  project/<task>/  ──pack──>  result/<task>/
```

- **template-core/<name>**：玩法的唯一来源。拥有玩法源码、图案/关卡数据、素材与音频；
  `build` 产出可运行的游戏基础包和一份机器可读清单。不认识 editor，不认识 plugin。
- **editor/templates/<name>**：构建产物消费区（`game/` + `game-manifest.json`）。
  **提交入库**，保证 editor 克隆即用；内容是 generated，禁止手改（护栏见 2.6）。
- **editor/plugins/<name>**：template 与 editor 之间的衔接层。声明流水线步骤、上传槽位、
  默认配置、广告覆盖层与该模板的工作台 UI。认识 `editor/templates/` 产物，不认识其源码。
  它是 editor 的组成部分，与 core 同仓同测，不是独立项目。
- **editor core**：通用流水线基建。提供可复用的 step 实现（`core:*`）、任务存储与 HTTP API。
  不硬编码任何具体模板名。

---

## 1. 命名与位置

| 项 | 规则 |
| --- | --- |
| 源码目录 | `template-core/<id>/`，`id` 匹配 `^[a-z][a-z0-9-]*$`，与目录名一致 |
| 产物目录 | `editor/templates/<id>/`，与 template id 同名，由 template-core 的 build 写入 |
| plugin 目录 | `editor/plugins/<id>/`，同 kebab-case 规则；plugin id 与 template id **默认同名**，确实需要多个广告形态时允许一个 template 对多个 plugin（如 `foo-arcade` / `foo-classic` 同指 `foo`） |
| 唯一性 | template id、plugin id 在各自目录内全局唯一（校验强制） |
| 大小写 | 一律 kebab-case 小写，禁止空格、下划线、大写 |

npm workspaces 只包含 `template-core/*`（提升 vite/three 等依赖到根 node_modules）；
editor 零依赖，不要求 package.json，根 scripts 直接 `node editor/server.mjs`。
plugins 是普通目录，由 editor 文件系统扫描发现，不进 workspaces。

根命令约定：

```
npm run build      # 依次构建 template-core/* → editor/templates/*
npm run dev        # node editor/server.mjs
npm run test       # 各 template-core 测试 + editor 测试
npm run validate   # 注册表校验（与 editor 启动校验同一实现）
```

---

## 2. Template（template-core/<id>/）规范

### 2.1 目录结构

```
template-core/<id>/
├── package.json          # 必需；name 建议 "template-<id>"；必须提供 build / test script
├── src/                  # 源码，内部组织自由（本规范不约束）
└── README.md             # 建议：说明玩法、素材来源、构建方式
```

源码项目不再有自己的 `build/`——产物统一写到 `editor/templates/<id>/`。

### 2.2 硬性约束

1. **只写 `editor/templates/<id>/`**。这是唯一声明的构建目标（跨目录但路径固定）；
   禁止写 monorepo 内外的任何其他位置。
2. **确定性构建**：相同源码 + 相同输入 ⇒ 逐字节相同的产物。禁止时间戳、随机数
   （开局随机必须由显式 seed 驱动并固化进产物）。
3. **`npm test` 必须存在**，至少校验玩法规则（可解性、资源守恒之类）。

### 2.3 构建产物契约

`npm run build` 必须产出：

```
editor/templates/<id>/
├── game/                 # 自包含可运行游戏（见 2.4）
└── game-manifest.json    # 机器可读清单（schema 见下）
```

`game-manifest.json`：

```jsonc
{
  "id": "colorever",                    // 必需；= 目录名
  "name": "Colorever",                  // 必需；显示名
  "version": "1.2.0",                   // 必需；语义化版本，必须等于 template-core/<id>/package.json 的 version
  "entry": "game/index.html",           // 必需；相对 editor/templates/<id>/ 的入口
  "levels": [                           // 可选；有关卡概念的模板必须提供
    { "id": "cat", "name": "猫", "path": "game/levels/cat.json" }
  ],
  "constants": {                        // 可选；模板专属常量（调色板、格距等），
    "palette": { "...": "..." }         // plugin 通过它读取，禁止直接猜路径
  }
}
```

规则：

- 字段只增不改义；editor 与 plugin 必须容忍未知字段（向前兼容）。
- `levels[].path` 相对 `editor/templates/<id>/`。
- plugin 需要的任何游戏侧信息（资产路径、常量、关卡表）必须出现在 manifest 或
  `constants` 中，**禁止 plugin 硬编码游戏内部路径**——这是现在 template.json 里
  `assetPath` 散落各处的教训。

### 2.4 game/ 广告基线（可运行性约束）

`game/` 必须满足（沿用三个现有项目的既有纪律）：

- 双击 `index.html` 以 `file://` 直开可完整试玩；
- 无 ES module script、无运行时 fetch/XHR、无 CDN 依赖，资源全部本地相对引用；
- 音频在首次用户触摸时解锁；提供全局静音开关；
- 设备像素比上限 2；
- 图片优先 WebP，音频优先 m4a/aac（iOS WebView 不支持 Ogg）。

### 2.5 colorever-gemsort 类静态模板

无构建逻辑的模板同样走统一契约：原始资产作为源码提交在 `template-core/<id>/`，
`build` script 为纯复制到 `editor/templates/<id>/`，并手写一份 `game-manifest.json`。
换取的是 editor/plugin 侧零特殊分支。

### 2.6 新鲜度护栏

`editor/templates/` 提交入库（克隆即用），因此必须防"源码改了、产物没跟上"：

- `game-manifest.json` 的 `version` 必须等于 `template-core/<id>/package.json` 的
  `version`；`npm run validate` 比对两者，不一致 = 警告「template-core/<id> 有更新，
  请重新 npm run build」。
- `editor/templates/README.md` 标注本目录为构建产物，禁止手改；改动一律回
  template-core 源码后重新 build。
- 可选（CI）：重新构建并与入库产物做 diff，逐字节一致才算通过。

---

## 3. Plugin（editor/plugins/<id>/）规范

### 3.1 目录结构

```
editor/plugins/<id>/
├── plugin.json           # 必需；契约唯一入口
├── overlays/             # 可选；hud/intro/cta/background 覆盖层源
├── steps/                # 可选；plugin 私有 step 实现
├── workbench.js          # 可选；该模板的工作台前端（缺省用通用工作台）
└── README.md             # 建议：配置项与素材要求说明
```

### 3.2 plugin.json schema

```jsonc
{
  "id": "colorever-new",              // 必需；= 目录名
  "name": "Colorever New（方形珠子）", // 必需；显示名
  "template": "colorever",            // 必需；按名解析为 editor/templates/colorever
  "steps": [                          // 必需；按执行顺序
    { "id": "intro",      "runner": "core:intro" },
    { "id": "hud",        "runner": "core:hud" },
    { "id": "background", "runner": "core:background" },
    { "id": "level",      "runner": "./steps/level.mjs" },
    { "id": "pack",       "runner": "./steps/pack.mjs" }
  ],
  "uploads": {                        // 可选；声明上传槽位
    "intro-video": { "file": "intro-video.mp4", "magic": "mp4",  "required": false },
    "background":  { "file": "background.png",  "magic": "png",  "required": false }
  },
  "overlays": {                       // 可选；路径相对 plugin 目录
    "hud": "./overlays/hud",
    "cta": "./overlays/cta"
  },
  "defaults": {                       // 可选；任务 config 的缺省值（与任务 config 深合并）
    "hud": { "enabled": false },
    "cta": { "enabled": true, "destinationUrl": "" }
  },
  "workbench": "./workbench.js"       // 可选；缺省用通用工作台
}
```

规则：

- `runner` 两种取值：`core:<step>` 引用 editor 内置实现（`editor/core/steps/<step>.mjs`），
  或 `./...` 引用 plugin 私有实现。plugin 可以 import `editor/core/*` 复用工具，
  **禁止 import 其他 plugin**，禁止 import template-core 源码。
- `steps[].id` 匹配 `^[a-z][a-z0-9-]*$` 且在 plugin 内唯一；**必须恰好包含一个 `pack`
  步骤且位于末尾**（pack 是唯一写 `result/` 的步骤，失败即中断整条流水线）。
- `uploads[].magic` 取值限于 core 支持的魔数集合：`mp4 | jpg | png | webp`
  （新增类型改 core，不在 plugin 里自写校验）。
- 未知顶层字段：校验器**警告**（多为拼写错误），不阻断。

### 3.3 Step runner 接口

每个 runner 模块（`core:*` 与 `./steps/*.mjs` 同一接口）：

```js
// 必需：执行该步骤。只写 ctx.generatedDir（pack 只写 ctx.resultDir）。
export async function run(ctx) {
  // ...
  return { metrics: { levelId: 3, cells: 64 }, warnings: [] };
}

// 可选：声明前置条件。缺省视为无前置。
export function prerequisites(config) {
  return { uploads: ["intro-video"], generated: ["poster.webp"] };
}
```

`ctx`（由 editor core 构造，runner 不得自行拼路径）：

| 字段 | 含义 |
| --- | --- |
| `taskId` / `stepId` | 任务与步骤标识 |
| `plugin` / `template` | 解析后的 plugin.json 与 **合并后的 template 清单**（plugin.json + game-manifest 深合并，plugin 字段优先） |
| `config` | 生效配置 = 深合并(plugin.defaults, 任务 config) |
| `engine` | 步骤变体（如 pattern 的 `ai` vs 默认阈值脚本），由调用方传入 |
| `templateDir` / `templateRoot` | 解析后的 `editor/templates/<id>/`（**只读**；游戏资产与 template.json） |
| `pluginDir` | 插件目录（**只读**；overlays 在这里） |
| `pluginScriptsDir` | `plugins/<id>/scripts/`（插件专属脚本；通用脚本在 `ctx.scriptsRoot` = `editor/core/scripts/`） |
| `uploads` | `{ slot: 绝对路径或 null }`，槽位见 plugin.json `uploads` |
| `uploadsDir` / `generatedDir` | `project/<task>/uploads` 与 `generated/` 子目录，runner 可写 |
| `resultDir` | `result/<task>/`，仅 pack 可写 |
| `helpers` | core 工具：`requireFiles`（错误带 `.missing`）；子进程与探测工具从 `core/lib/exec.mjs` import |

约定：

- 失败 = `throw Error`；需要提示补前置时，在 error 上挂 `missing: [路径...]`
  （沿用现有 `requireFiles` 行为，前端展示为"建议重跑"清单）。
- **启用开关统一**：所有 core step（及私有 step 的惯例）遵循
  `config.<step>.enabled === false` ⇒ 返回 `{ metrics: { skipped: true }, warnings: [] }`。
  禁止再像现在 dragon-cube 那样为 intro/hud/background 写三个包装函数。
- 前置条件放 `prerequisites(config)`，**用代码表达条件逻辑**（如 pack 的前置取决于
  intro/hud 是否启用），plugin.json 里不重复声明。
- 禁止写 `templateDir`、`pluginDir`、其他任务、monorepo 其他任何位置。

### 3.4 Overlays 约定

- 每个覆盖层一个目录，含若干 `.html` 片段源；文案占位符 `__UPPER_SNAKE__`，
  由 core 的 `fill-overlays` 在 pack 时做 HTML 转义注入。
- 占位资源（`__HUD_LEFT_*__` 等）由对应步骤产出后经 repack 注入。
- plugin 引用覆盖层一律通过 `overlays` 字段声明的 key，不允许在 step 里拼
  `overlays/...` 字面路径。

### 3.5 Workbench 前端接口

- task 工作台按任务所属 plugin **动态加载** `/plugins/<id>/workbench.js`，
  经 `window.PlayablePlugins[<pluginId>]` 注册；没有 workbench.js 的插件
  使用通用工作台。plugin.json 的 `workbench` 字段当前是过渡期的前端展示
  分组键（裸字符串）；写成 `./...` 路径形态时才表示专用工作台脚本。
- 注册契约（最小接口，实现期允许在 core 侧补充回调，但不得要求 plugin 关心 core 内部）：

```js
window.PlayablePlugins = window.PlayablePlugins || {};
PlayablePlugins["colorever-new"] = {
  // 声明该模板工作台的额外字段/面板；通用字段（标题、CTA、开关）由通用工作台渲染
  panels(ctx) {
    return [{ key: "levelId", type: "select", label: "选择原版关卡", options: ctx.template.levels }];
  },
  // 可选：某步骤完成后的自定义预览（如关卡 canvas 渲染）
  preview(stepId, generated, ctx) {}
};
```

---

## 4. editor core 的职责边界

- 启动时扫描 `editor/plugins/*/plugin.json`，按名解析 `editor/templates/<id>/`，合并
  game-manifest，跑第 6 节校验；校验失败**拒绝启动**并明确报错到哪个文件哪个字段。
- `GET /api/templates` 返回注册表（id、name、steps、defaults、levels、palette），
  前端据此渲染，禁止前端硬编码模板列表。
- 内置可复用 step：`core:intro`、`core:hud`、`core:background`、`core:pattern`、
  `core:pack`（覆盖层注入式打包）。逐步从现有 runner.mjs 中去模板特化而来。
- 持有全部路径纪律：`project/`、`result/` 的解析与隔离、任务锁。

## 5. 产物与提交纪律

- 步骤中间产物只进 `project/<task>/generated/`；最终成品只进 `result/<task>/`，由 pack
  步骤产出，**重复运行 pack 必须幂等**（先清空 `result/<task>/` 再写入）。
- `project/` 与 `result/` 在 monorepo 根目录，整体 gitignore，仅本地存在。
- `editor/templates/` **提交入库**（区别于以上两者），新鲜度由 2.6 护栏保证。
  除此之外 monorepo 不产生任何未跟踪产物。

## 6. 注册表校验清单（editor 启动与 `npm run validate` 共用）

1. 每个 `editor/plugins/*/plugin.json` 可解析；`id` = 目录名且全局唯一；`template` 指向
   存在的 `editor/templates/<id>/`。
2. 对应 `editor/templates/<id>/game-manifest.json` 存在且可解析；`id` = 目录名；缺失时
   报错文案必须提示「先在 template-core/<id> 运行 npm run build」。
3. **版本比对**：`game-manifest.json` 的 `version` == `template-core/<id>/package.json`
   的 `version`；不一致 = **警告**（源码有更新，请重新 build），errors 才阻断启动。
4. `steps`：id 合法且唯一；恰好一个 `pack` 且在末尾；每个 `runner` 文件存在且导出 `run`。
5. `uploads`：magic 类型受支持；文件名不冲突。
6. `overlays` / `workbench` 指向的路径存在。
7. template 侧：`game/` 存在且包含 `entry`。

## 7. 新增一个 playable 的完整动作

1. `template-core/foo/`：实现玩法源项目，`npm run build` 产出
   `editor/templates/foo/`（`game/` + `game-manifest.json`；静态模板则资产 + 纯 copy build）。
2. `editor/plugins/foo/`：写 `plugin.json`（引用 template、挑 core steps、声明私有 step、
   defaults、uploads、overlays），按需写 `steps/`、`overlays/`、`workbench.js`。
3. 根目录 `npm run validate` 通过，`npm run dev` 里新建任务试跑全流程。

editor 核心、通用工作台、API：零改动。
