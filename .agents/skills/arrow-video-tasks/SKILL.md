---
name: arrow-video-tasks
description: 根据两层素材目录，批量初始化 playable-creator editor 中的 Escape Arrow 任务，读取可选 config.json 的标题和弹窗文案，上传并运行开场和片尾视频。适用于批量建任务、导入视频和续跑媒体初始化；不用于关卡创作、玩法引擎改造或打包。
---

# Arrow 视频任务批量初始化

将 `素材根目录/一级目录/二级目录/视频.mp4` 导入当前 playable-creator editor，每个二级目录对应一个任务。参考同仓库 Colorever、DragonCube 的媒体初始化范围，使用 Arrow 自身的模板与配置。用户本次明确要求优先于以下默认规则；只分析时预览，已授权创建时检查后直接执行。

## 素材与命名

- 模板 ID 为 `escape-arrow`，任务名称为 `MM-DD-二级目录原名-一级目录原名-escape-arrow`。日期取用户指定日期，否则取用户当前时区当天；脚本默认 Asia/Shanghai，其他时区显式传 `--date`。
- 使用 API 返回的实际任务 ID。editor 会处理名称截短和 ID 冲突，不能以完整任务名替代 ID。
- 同时有 `1.mp4`、`2.mp4` 为双视频，分别上传到 `intro-video`、`outro-video`；只有其中一个为单视频，唯一视频都用于开场，包括仅有 `2.mp4` 的目录。
- 每组允许附带 `config.json`，忽略 `.DS_Store`。按文件清单分类；写入前拒绝空目录、额外文件、第三层目录、符号链接、无效 MP4 或超过 100 MiB 的视频。
- 不固定素材根目录、日期、任务数量或历史任务 ID。源目录及其 readiness 记录保持原样。

## 默认配置

| 配置 | 双视频 | 单视频 |
|---|---|---|
| 开场 | `intro.enabled=true`，`1.mp4` | `intro.enabled=true`，唯一 MP4 |
| 片尾 | `outro.enabled=true`，`2.mp4` | `outro.enabled=false` |
| 第二个 playable | `secondPlayable.enabled=true` | `secondPlayable.enabled=false` |
| 关卡 | 模板默认第一、第二关，当前为 1、2 | 模板默认第一关，当前为 1 |
| 运行步骤 | `intro → outro` | `intro` |

所有任务关闭 HUD 立绘和两关自定义背景，打开 HUD title；没有素材配置时，两行标题显式留空。保留 Arrow 默认生命、提示和重玩设置，当前为 `lives=3`、`hints='unlimited'`、`allowReplay=true`，其余 CTA 时机沿用模板默认。不继承 DragonCube 的随机选关范围，也不加入 Colorever 的 opening 参数。

所有配置先保存，再上传视频、运行媒体步骤。只允许运行 `intro`、`outro`，不运行 `all`、`hud`、`background`、`background2`、`level`、`pack`，不改写模板构建产物。选定关卡只是保存编号，不运行关卡生成。

## 可选 config.json

脚本支持 `schemaVersion=1`、`templateId='escape-arrow'` 的素材描述文档，完整原文与 SHA-256 写入报告，API 只接收映射后的任务配置，不能直接 PATCH 整份素材 JSON。

- `hud.titleEnabled/titleLine1/titleLine2/ariaLabel` → 第一关 HUD；`secondPlayable.hud` → 双 playable 第二关 HUD。没有给定文案时使用空字符串。
- `popup.title` 与 `popup.body` 用换行连接 → `cta.takeoverText`；只有 `popup.rawText` 时使用该值。两种表达同时提供时须一致。保留 CTA 默认按钮文字，不将 body 错当按钮文字，也不向 editor 写无效的 `popup` 字段。
- 可选 `levelId`、`secondPlayable.levelId` 使用当前 Arrow 清单中的关卡；可选 `gameplay`、`playableCta` 和第二关 `cta` 按 Arrow 格式保存。未提供则沿用模板默认。
- `intro.enabled`、`outro.enabled`、`secondPlayable.enabled` 以及 `assets.introVideo/outroVideo` 必须与实际文件对应。冲突时写入前报告，不猜测素材重复或段链。
- `forcedWatchSeconds` 当前没有 editor 对应字段，不能宣称已应用。数值保留在报告，并逐任务提示未应用；不截断、补长视频，不为此扩展引擎。
- `source`、`drama`、`videoSelection`、`readiness` 为素材元数据，只保留在报告。非空 `game1References/game2References` 也仅记录并提示未进行关卡创作。
- 未支持的设置或非法类型在写入前拒绝。用户临时要求其他配置时，核实当前 API 和模板能力后按本次要求执行，不为单次覆盖修改本 skill 默认值。

## 执行

使用本 skill 的脚本，依赖 Node.js ≥22。`SKILL_DIR` 是本 skill 实际目录，`REPO` 是目标仓库，`SOURCE` 是素材根目录，`TASK_DATE` 为本次 `MM-DD` 日期。

先运行只读预览，核对单/双视频、命名、配置映射、警告与同名任务：

```sh
node "$SKILL_DIR/scripts/import-video-tasks.mjs" --repo "$REPO" --source "$SOURCE" --date "$TASK_DATE"
```

预览不要求服务在线，默认不写文件。加 `--report "$REPORT"` 可保存计划，再以 `--resume "$REPORT" --apply` 执行；报告的父目录需已存在。

当前请求已授权创建后执行：

```sh
node "$SKILL_DIR/scripts/import-video-tasks.mjs" --repo "$REPO" --source "$SOURCE" --date "$TASK_DATE" --base-url http://127.0.0.1:8088 --apply
```

复用目标仓库已有 editor 服务；确实未启动时从该仓库运行 `node editor/server.mjs --port 8088`。端口占用先核实归属，不关闭其他服务。脚本检查 `/api/env`、模板默认配置、API 任务列表与本地任务文档，防止操作其他仓库。沙箱无法访问本机地址时申请对应执行权限，不据此另起服务或更换数据目录。

创建、配置、上传和运行均通过 editor API，保留真实的 SHA-256、字节数和步骤结果。不能只拷贝 MP4 或伪造成功状态。

## 中断、验收与交付

默认两任务并发，同一任务串行；`--concurrency` 支持 1–4。报告默认在系统临时目录逐步原子保存。保留路径，中断后续跑：

```sh
node "$SKILL_DIR/scripts/import-video-tasks.mjs" --resume "$REPORT" --apply
```

写入前拒绝同名任务。续跑只接管报告已记录 ID，核对视频、素材配置和已保存任务配置，跳过成功、未过期且产物齐全的视频步骤。创建响应丢失、报告没有 ID 但出现同名任务时，先只读检查结果，不能盲目重试 POST 或创建带 `-2` 的副本。单步失败记录后继续其他任务，解决实际原因后续跑；不循环重试或自动删除任务。

验收实际关卡、开关、标题及弹窗映射，上传原名/大小/SHA-256，视频步骤成功且未过期、转码视频和开场海报齐全，并核对媒体指标和生成文件清单。确认没有 HUD、背景、关卡及打包产物，报告已有任务文档是否保持原样。

最终报告创建数量、单/双视频数量、上传数、成功步骤数、失败项、未应用配置、报告路径和任务链接；只把实际检查通过的项目说成完成。不要为了验收重复导入真实素材。
