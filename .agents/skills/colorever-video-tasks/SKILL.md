---
name: colorever-video-tasks
description: 根据两层视频素材目录，批量初始化 playable-creator editor 中的 Colorever New 任务，配置单/双 playable、上传视频并运行视频和背景步骤。适用于批量建任务、导入视频和继续未完成的媒体初始化；不用于图案制作、关卡生成或打包。
---

# Colorever 视频任务批量初始化

将 `素材根目录/一级目录/二级目录/视频.mp4` 导入当前 playable-creator 项目的 editor。每个二级目录对应一个任务。用户本次明确要求优先于下列默认规则；只有分析请求时只做预览，已授权创建时可检查后直接执行。

## 素材与命名

- 名称：`MM-DD-二级目录原名-一级目录原名-colorever`。日期取用户指定日期，否则取用户当前时区的当天，不沿用示例任务日期；脚本默认时区为 Asia/Shanghai，其他时区请显式传 `--date`。
- 模板 ID 为 `colorever-new`，名称后缀仍为 `colorever`。任务 ID 由 editor 返回，不能把完整名称直接当 ID，editor 会截短并处理 ID 冲突。
- 同时存在 `1.mp4`、`2.mp4`：双视频任务。只有其中一个：单视频任务，**唯一的视频都上传到开场槽位，包括只有 `2.mp4` 的目录**。
- 以文件清单判断单/双视频，不仅凭 `george-1`、`george-1-2` 等目录名。忽略 `.DS_Store`；空目录、额外 MP4、第三层子目录或错误文件格式在写入前报告，不猜测映射。
- 不固定素材根目录、示例任务 ID、日期、任务数量或图案名称。不要把历史示例的图案、文案、上传或生成记录复制到新任务。

## 默认配置

所有任务：`intro.enabled=true`、`hud.titleEnabled=true`、`hud.enabled=false`、标题两行留空；`background={enabled:true,source:'video-last',blurSigma:12}`。TITLE 开关与立绘图片开关是两个独立字段。保留模板默认图案；不上传立绘、不运行 HUD。

| 配置 | 双视频 | 单视频 |
|---|---|---|
| 开场视频 | `1.mp4` → `intro-video` | 唯一 MP4 → `intro-video` |
| 片尾视频 | `2.mp4` → `outro-video`，`outro.enabled=true` | `outro.enabled=false` |
| 第二个 playable | `secondPlayable.enabled=true` | `secondPlayable.enabled=false` |
| 第一关开局 | 保留模板默认简易模式 | 使用下述适中参数 |
| 第二关开局 | 使用下述适中参数 | 不启用 |
| 最后一关转化 | `secondPlayable.cta={mode:'steps',afterSteps:8}` | `playableCta={mode:'steps',afterSteps:8}` |
| 第二关标题 | 显式保存两行空字符串，防止自动回填图案名 | 不填写 |
| 第二关背景 | `secondPlayable.background={enabled:true,source:'video-last',blurSigma:12}`，取片尾尾帧 | 不启用 |

适中参数：`{mode:'medium',coverage:95,batchSize:30,seed:1}`。单视频的第一关与双视频的第二关共用这套开局及转化参数。双视频第一关不修改开局，也不加最终转化配置。

配置应在媒体步骤开始前保存。上传所有素材后，双视频按 `intro → background → outro → background2` 运行，单视频只运行 `intro → background`。只允许这四种媒体步骤；不使用 `all`，不运行 `level`、`pack` 或改写模板构建产物。

## 执行

优先使用本 skill 的脚本，避免重复编写创建和上传逻辑。脚本只依赖 Node.js ≥22。将 `SKILL_DIR` 替换成本 skill 实际目录；`REPO` 是目标仓库根目录，`SOURCE` 是素材根目录，`TASK_DATE` 是本次的 `MM-DD` 日期。

先运行默认的只读预览，检查分类、命名和同名任务：

```sh
node "$SKILL_DIR/scripts/import-video-tasks.mjs" --repo "$REPO" --source "$SOURCE" --date "$TASK_DATE"
```

预览仅检查本地目录和任务文件，不要求服务在线。确认当前请求已授权创建后执行：

```sh
node "$SKILL_DIR/scripts/import-video-tasks.mjs" --repo "$REPO" --source "$SOURCE" --date "$TASK_DATE" --base-url http://127.0.0.1:8088 --apply
```

用户改变默认配置时，使用现有 editor API 按本次要求执行，不套用固定脚本，也不为单次覆盖修改已安装 skill 的默认规则。

复用目标仓库的现有服务。未启动时从该仓库运行 `node editor/server.mjs --port 8088`；端口被占用时先确认服务归属，不关闭现有服务。API 负责写入 `project/<id>/project.json`、记录上传 SHA-256 和步骤结果，不能只拷贝 MP4 或手工伪造成功状态。脚本通过 API 列表和本地任务文档核对服务与仓库，并检查 `/api/env`。

沙箱无法连接本机地址时，按环境机制请求相应的执行权限；连接失败不代表服务未启动。不要因此修改 editor、切换仓库或创建第二份任务数据。

## 重复与中断

脚本默认两任务并发，同一任务内部串行。写入前拒绝同名已有任务，执行报告默认保存在系统临时目录并逐步落盘。保留报告路径；中断后用同一个报告继续：

```sh
node "$SKILL_DIR/scripts/import-video-tasks.mjs" --resume "$REPORT" --apply
```

续跑只接管报告中已记录 ID 的任务，核对源文件哈希和已保存配置，跳过已经成功且产物齐全的步骤。拒绝覆盖已有任务或创建带 `-2` 的重复任务。若创建响应丢失、报告尚无任务 ID 而同名任务已经存在，先只读核对创建结果，不盲目重试 POST。单步失败时记录错误并继续其他任务；修复实际原因后再续跑，不循环重试、不自动删除已成功的任务。

## 验收与交付

脚本检查：任务分类、空标题、开局和转化配置、每份上传的原名/字节数/SHA-256、媒体步骤成功且未过期、生成文件齐全，以及没有关卡或打包产物。使用当前插件定义的尺寸核对背景；必要时用 PIL 解码图片检查完整性。

最终报告创建数量、单/双视频数量、上传和成功步骤数、失败项及报告位置，并提供任务列表链接。只把实际检查通过的项目说成已完成。不要在交付前自行运行关卡或打包，也不要为了验证 skill 再导入真实素材创建一批任务。
