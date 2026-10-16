---
name: dragoncube-video-tasks
description: 根据两层视频素材目录，批量初始化 playable-creator editor 中的 dragon-cube 任务，随机选择两关、上传并运行开场和片尾视频。适用于批量建任务、导入视频或继续未完成的媒体初始化；不用于自定义背景、关卡制作或打包。
---

# DragonCube 视频任务批量初始化

将 `素材根目录/一级目录/二级目录/视频.mp4` 导入当前 playable-creator 项目的 editor，每个二级目录对应一个任务。用户本次明确要求优先于默认规则；仅分析时只做预览，已授权创建时检查后直接执行。

## 素材与命名

- 名称：`MM-DD-二级目录原名-一级目录原名-dragon-cube`，模板 ID 为 `dragon-cube`。日期取用户指定日期，否则取用户当前时区当天；脚本默认 Asia/Shanghai，其他时区请显式传 `--date`。
- API 返回实际任务 ID，不能把完整名称当 ID：editor 会截短名称并处理 ID 冲突。
- 同时有 `1.mp4`、`2.mp4` 为双视频：分别上传 `intro-video`、`outro-video`。仅有其中一个为单视频，唯一视频用于开场，包括只有 `2.mp4` 的目录。
- 按实际文件清单分类，不依据目录名称推测。忽略 `.DS_Store`；写入前报告空目录、额外文件、第三层子目录、符号链接或不符合 MP4 格式/大小限制的文件，不猜测映射。
- 不固定素材根目录、日期、任务数量或历史示例任务。不得复制参考任务中的标题、上传记录、生成文件或已完成的关卡/打包状态。

## 默认配置

所有任务开启 `intro.enabled=true`、`hud.titleEnabled=true`，关闭 `hud.enabled`（立绘）及 `background.enabled`（自定义背景）。两行 HUD 标题留空，文案等待用户后续填写；TITLE 与立绘是独立开关，打开 TITLE 无需运行 HUD 步骤。

| 配置 | 双视频 | 单视频 |
|---|---|---|
| 开场视频 | `1.mp4` → `intro-video` | 唯一视频 → `intro-video` |
| 使用片尾视频 | `outro.enabled=true`，`2.mp4` → `outro-video` | `outro.enabled=false` |
| 第二个 playable | `secondPlayable.enabled=true` | `secondPlayable.enabled=false` |
| 第一个 playable | 从第 4、5 关随机选择一个，保存到 `levelId` | 同左 |
| 第二个 playable | 从第 9、10 关随机选择一个，保存到 `secondPlayable.levelId` | 不启用 |
| 第二关标题 | `secondPlayable.hud` 两行显式保存为空字符串 | 不填写 |
| 第二关自定义背景 | `secondPlayable.background.enabled=false` | 同左 |
| 运行步骤 | `intro → outro` | `intro` |

每个任务独立随机选关，允许不同任务选到相同关卡；结果写入执行报告并保存到任务配置，续跑不重新抽取。其余 CTA/转化时机等沿用模板默认，不沿用 Colorever 的开局参数。

默认单视频规则与 Colorever 相同。用户明确要求单视频也保留双 playable 时，使用 `--single-video repeat`，将唯一视频同时用于开场和片尾；未明确要求时不重复素材。

配置应在运行视频步骤前保存。只允许运行 `intro` 和 `outro`；不运行 `all`、`hud`、`background`、`background2`、`level` 或 `pack`。第 4 步自定义背景关闭，第 5、6、7 步（第二关背景、关卡、打包）保持未运行；启用第二个 playable、选择其关卡只保存配置，不运行关卡生成。

## 执行

使用本 skill 的脚本（Node.js ≥22）。`SKILL_DIR` 为本 skill 实际目录，`REPO` 为目标仓库根目录，`SOURCE` 为素材根目录，`TASK_DATE` 为本次 `MM-DD` 日期。

先运行只读预览，检查素材分类、命名、随机关卡及同名任务：

```sh
node "$SKILL_DIR/scripts/import-video-tasks.mjs" --repo "$REPO" --source "$SOURCE" --date "$TASK_DATE"
```

可加 `--report "$REPORT"` 把预览计划保存到已存在的临时目录，再用 `--resume "$REPORT" --apply` 执行该计划，保留预览时抽到的关卡。未传 `--report` 的预览不写文件，也不要求服务在线。

已授权创建后执行：

```sh
node "$SKILL_DIR/scripts/import-video-tasks.mjs" --repo "$REPO" --source "$SOURCE" --date "$TASK_DATE" --base-url http://127.0.0.1:8088 --apply
```

复用目标仓库现有 editor 服务。未启动时从该仓库运行 `node editor/server.mjs --port 8088`；端口占用时先确认归属，不关闭已有服务。脚本检查 `/api/env`、模板默认配置、API 任务列表及本地任务文档，防止操作其他仓库。沙箱不能连接本机地址时按环境机制申请执行权限，不据此另起服务或修改 editor。

创建、保存配置、上传、运行均使用 editor API，让 API 记录 SHA-256、字节数和真实步骤结果；不得手工伪造任务成功状态。用户临时覆盖其他默认规则时，按本次要求使用现有 API 执行，无需改写本 skill 的通用默认值。

## 中断与验收

- 默认两个任务并发，同一任务按顺序运行媒体步骤；可用 `--concurrency 1` 至 `4` 调整。执行报告逐步原子保存，默认在系统临时目录；保留报告路径。
- 写入前拒绝同名任务。中断后运行 `node "$SKILL_DIR/scripts/import-video-tasks.mjs" --resume "$REPORT" --apply`，仅接管报告已记录 ID 的任务，核对源文件哈希和配置，跳过已成功、未过期且产物齐全的视频步骤。
- 创建响应丢失、报告尚无 ID 但已有同名任务时，先只读核对创建结果，不盲目重试 POST，不创建带 `-2` 的重复任务。单步失败记录错误并继续其他任务；修复实际原因后续跑，不循环重试或自动删除已成功任务。
- 验收随机关卡范围、开关和空标题、上传的原名/大小/SHA-256、视频步骤成功且未过期、转码文件及海报存在；确认只有视频产物，没有 HUD、背景、关卡或打包产物。脚本同时报告已有任务文档是否保持原样。
- 最终报告创建数量、单/双视频数量、上传数、成功步骤数、实际关卡选择、失败项、报告路径和任务链接。仅把实际检查通过的任务说成完成；不为了验收额外运行关卡或打包，也不再次导入真实素材创建重复任务。
