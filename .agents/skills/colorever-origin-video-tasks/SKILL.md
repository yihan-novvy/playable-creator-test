---
name: colorever-origin-video-tasks
description: 根据两层视频素材目录，批量初始化 playable-creator editor 中的 colorever-origin 任务，开启片头与顶部 HUD 标题，设置第 20 次有效操作首跳及 10,8,6,4 循环间隔，上传并运行 1.mp4。适用于建任务、导入片头和续跑媒体初始化；不用于 Colorever New、关卡创作或打包。
---

# Colorever Origin 视频任务批量初始化

将 `素材根目录/一级目录/二级目录/1.mp4` 导入当前 playable-creator editor，每个二级目录对应一个任务。用户本次明确要求优先于以下默认值；仅分析时只预览，已授权创建时检查后执行。

## 素材与命名

- 模板 ID：`colorever-origin`。任务名：`MM-DD-二级目录原名-一级目录原名-colorever-origin`。日期取用户指定日期，否则取用户当前时区当天；脚本默认 Asia/Shanghai，其他时区显式传 `--date`。
- 使用 API 返回的实际任务 ID。editor 会截短名称并处理 ID 冲突，完整任务名不能代替 ID。
- 每组只使用 `1.mp4`，上传到 `intro-video`。Origin 没有片尾和第二个 playable，不能套用其他视频 skill 的单/双视频规则或将 `2.mp4` 当作片头。
- 忽略 `.DS_Store`。空目录、额外文件、第三层目录、符号链接、错误 MP4 格式或超过 100 MiB 的视频在写入前报告；不猜测映射。用户另有素材安排时先核实再执行。
- 不固定源目录、日期、任务数量和历史任务 ID，不修改源文件。

## 默认配置与运行范围

| 工作台选项 | API 配置 |
|---|---|
| 勾选使用开场视频 | `intro.enabled=true` |
| 勾选显示顶部 HUD 标题 | `hud.titleEnabled=true` |
| 第 N 次有效操作跳转 | `playableCta.mode='steps'` |
| 首跳步数 N | `playableCta.afterSteps=20` |
| 循环间隔 | `playableCta.intervals=[10,8,6,4]` |

仅保存以上配置覆盖，HUD 主副标题、GO 按钮和其他设置沿用 Origin 模板默认值。HUD 标题开关与立绘开关独立，不需要运行 HUD 步骤。不要沿用其他 skill 的空标题、开局模式、背景、随机选关或第二关配置。

先保存配置，再将每组 `1.mp4` 上传到“片头视频 MP4”，仅运行 `intro`。产物为 `generated/intro-video.mp4` 和 `generated/poster.webp`。打包 `pack` 保持未运行，不调用 `all`，不改写模板或玩法文件。

## 执行与续跑

使用本 skill 的脚本（Node.js ≥22）。`SKILL_DIR` 为本 skill 目录，`REPO` 为仓库，`SOURCE` 为素材根目录，`TASK_DATE` 为本次 `MM-DD`。

先只读预览，核对命名、配置、文件和同名任务：

```sh
node "$SKILL_DIR/scripts/import-video-tasks.mjs" --repo "$REPO" --source "$SOURCE" --date "$TASK_DATE"
```

预览不要求服务在线，默认不写文件。加 `--report "$REPORT"` 可保存计划，父目录需已存在。请求已授权创建后执行：

```sh
node "$SKILL_DIR/scripts/import-video-tasks.mjs" --repo "$REPO" --source "$SOURCE" --date "$TASK_DATE" --base-url http://127.0.0.1:8088 --apply
```

复用目标仓库已有 editor；确实未启动时从仓库运行 `node editor/server.mjs --port 8088`。端口占用先核实归属，不关闭其他服务。脚本检查 `/api/env`、模板默认值、API 任务列表与本地任务文档，确认服务属于当前仓库。沙箱不能连接本机地址时申请对应执行权限，不据此另起服务或切换数据目录。

所有创建、配置、上传和运行经 editor API，保留真实的 SHA-256、字节数和步骤结果。用户仅本次覆盖默认值时核实当前 API 后按要求执行，不为临时覆盖改写本 skill 默认规则。

默认两任务并发，同一任务串行；`--concurrency` 支持 1–4。报告默认在系统临时目录逐步原子保存。中断后保留并使用同一报告：

```sh
node "$SKILL_DIR/scripts/import-video-tasks.mjs" --resume "$REPORT" --apply
```

写入前拒绝同名任务。续跑只接管报告中已记录的 ID，核对源文件和已保存配置，跳过成功、未过期且产物齐全的片头步骤。创建响应丢失、报告尚无 ID 但出现同名任务时先只读核对，不盲目重试 POST，不创建带 `-2` 的副本。单任务失败记录后继续其他任务，修复实际原因后续跑；不循环重试或自动删除任务。

## 验收与交付

核对上述五项配置、模板默认标题、每份上传的原名/大小/SHA-256、片头成功且未过期、转码尺寸与时长有效、视频和海报产物齐全。确认步骤仅有 `intro`，不存在打包结果；报告已有任务文档是否保持原样。

最终报告创建数、上传数、成功片头数、失败项、报告路径和任务链接。只把实际检查通过的任务说成完成，不为验收重复导入真实素材或运行打包。
