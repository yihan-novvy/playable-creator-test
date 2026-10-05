# Playable Editor

任务化的 playable 编辑器。零依赖(Node ≥22 + python3/PIL + ffmpeg + zip/unzip),无构建步骤。

```bash
node editor/server.mjs [--port 8088]
```

打开 <http://127.0.0.1:8088>。

## 工作流(六步流水线)

| # | 步骤 | 输入 | 产物(project/<id>/generated/) | 预览 |
|---|---|---|---|---|
| 1 | 开场视频 | intro-video.mp4(+可选 intro-poster.jpg 覆盖) | poster.jpg(默认抽视频首帧) | video + poster |
| 2 | HUD | 每侧立绘:① 选来源(**从海报获取**免上传 / **上传图片**);② 完整图片默认即立绘;③ 可选**裁剪**(弹窗:拖画/移动/角点缩放 + 圆形实时预览,Esc/背板点击关闭,确认后重新运行生效),或**恢复完整图** | hud-left/right.png(可选金色重调色) | 圆头像 + 标题实时渲染 |
| 3 | 背景 | background.png(**可选**,缺省用海报图计算) | background.png(缩放到 1560×2598 + 高斯模糊) | 输出图 |
| 4 | 图案 | HUD 成品立绘(`config.patternSource` 选左/右,**裁剪后的结果直接决定图案**) | pattern.json + pattern-preview.png | 图案预览 + 颜色统计 |
| 5 | 关卡 | pattern.json | levels.json(Board/Gems 数据 + 打散指标) | canvas 渲染打散棋盘 |
| 6 | 打包 | 以上全部 | → dist/<id>/index.html | 390×844 手机框试玩 + 下载 |

重跑第 5 步 = 重新随机打散;重跑第 6 步 = 稳定重打包。输入文件更新后对应步骤会标记"建议重跑"。

## API

```
GET    /api/env                                    工具链自检
GET    /api/templates                              模板列表(含调色板/默认配置)
GET    /api/tasks                                  任务列表
POST   /api/tasks                                  {name, templateId} 建任务
GET    /api/tasks/:id                              任务详情 + 步骤状态/过期标记
PATCH  /api/tasks/:id                              {config: {...}} 更新配置
DELETE /api/tasks/:id                              删除任务(project+dist)
PUT    /api/tasks/:id/uploads/:slot                原始字节上传(≤100MB,魔数校验)
GET    /api/tasks/:id/uploads/:slot                下载/回看
DELETE /api/tasks/:id/uploads/:slot                清除上传
POST   /api/tasks/:id/run                          {step: "intro|...|pack|all"}
GET    /api/tasks/:id/prerequisites/:step          前置清单
GET    /project/:id/uploads|generated/<file>       静态预览(支持 Range)
GET    /dist/:id/index.html                        成品
```

上传槽位:`intro-video` `intro-poster` `background` `portrait-src-left` `portrait-src-right`(HUD 立绘源图)。HUD 裁剪不走独立接口:弹窗确认 = PATCH `config.hudCrop`,hud 步骤运行时按 `config.hudImageSource`(poster|upload)+ 裁剪矩形产出立绘,未裁剪时源图字节直通。

## 任务配置(project/<id>/project.json 的 config)

文案类(`hud.titleLine1/2`、`hud.ariaLabel`、`intro.ariaLabel`)打包时经 HTML 转义注入覆盖层;`hud.enabled` / `intro.enabled` 关闭后打包跳过对应注入;`recolorPortraits` 开启立绘金色重调色;`patternSourceSlot` 选择图案源上传;`background.blurSigma` 与 `patternConfig.*` 控制模糊与图案转换参数;`win.placements` 设置获胜次数——净正确放置 N 颗后触发「游戏成功 → 跳转应用商店」,之后每次点击再次跳转(默认 "complete"=图案补完的最后一步才触发,可填固定颗数,"patchSize"=首块补丁完整放回后触发,0 = 关闭)。手引导固定只演示一轮 from-to(抬起→暂存→放回,阶段 5-6 打包时写入 "Close" 由引擎跳过),之后手指收起、自由操作。顶部训练条显示**真实完成度**:运行时直读棋盘模型的 `getCorrectFillRatio()`(与胜利判定同一指标),开局即约 90%,图案补完的胜利音拉满 100%;扫描失败时降级为按本关放置次数均分的节奏条。未设置的字段回落到模板 defaults。

pack 步骤同时会重写两份游戏内配置(见 `src/lib/meta-patch.mjs`):GlobalConfig 的获胜开关(游戏本身只支持进度百分比,pack 按 N 次放置换算出精确的进度线写入)和 GuideConfig 的手势引导配色(模板写死的黄3/灰3 在生成图案里通常不存在,pack 自动改用棋盘上两个最大的色组)。

保存方式:工作台输入框失焦即自动保存,「保存配置」按钮把界面上有改动的字段一次性提交兜底(输入完直接刷新不会触发失焦保存)。PATCH 对 config 顶层键做**深合并**,逐字段保存不会覆盖同键下的兄弟字段;标量、数组与显式 `null` 仍整值替换(裁剪框置 null = 恢复完整图)。

## 目录

- `server.mjs` — 路由、静态挂载、任务锁(同任务串行,不同任务可并行)。
- `lib/paths.mjs` / `store.mjs` / `http-utils.mjs` — 路径解析、任务 CRUD/锁/过期检测、HTTP 工具(Range、防穿越)。
- `public/` — 前端两页(任务列表 + 工作台)。
- `tools/run-step.mjs` — 无头跑单步。
- `test/` — `run-all.mjs` 汇总三套检查:
  - `repack-port` — 移植版 repack 对示例目录产出与已知良好 editable/index.html 做 __zip 之外字节等价 + __res 深等 + zip 解包逐文件等。
  - `steps` — 模板完整性(sha256 对 git 026ad34)、fill-overlays 转义、图案/关卡脚本对示例输入的确定性复现。
  - `e2e-reference` — 走真实 HTTP API 建任务/上传/跑六步,成品与已知产物多点等价;两个关卡数据 JSON 例外(levels 步骤每次运行都会用 move-cycle 打散重新生成(无法轮转色块的图案回退 grouped-colors)),改为结构断言「打包内容 == 本轮 levels.json 产物」,其余文件仍要求逐字节一致。

## 模板(src/templates/<name>/)

### DragonCube

`dragon-cube` 模板使用 Unity DragonCube 的第 1–10 关。在新建任务时选择该模板，工作台的「选择原版关卡」下拉框保存 `config.levelId`；「试玩当前关卡」立即预览所选关卡，运行「全部运行」后可导出 ZIP。第 7–10 关包含定向猫块。关卡 JSON 由相邻 `playable-ad/dragon-cube` 仓库同步，工作台不提供关卡创作。

片头、HUD、自定义背景默认关闭，可按需开启并上传素材；CTA 默认开启，可填写目标地址，广告 SDK 也可接管跳转。修改独立游戏后在 `playable-ad/dragon-cube` 运行 `npm run sync:wholehouse` 同步基础包和关卡。

- `template.json` — 契约常量唯一来源:背景资产路径与 1560×2598、两关卡路径、GEM_TILE_OFFSET=68、MAX_OPENING_COMPLETION=0.9、scrambleOverrides、scrambleMoveCycle(轮转色块参数)、图案 PALETTE(34 色)与 allowedTiles、各步骤 defaults。
- `game/` — 干净的 Cocos 构建(repack 模板 + assets 树 + 两 manifest)。注意:game_pic_bg 是 **WebP 载荷 .png 文件名**,manifest 声明 image/webp——不要"修正"。
- `overlays/` — hud/intro 覆盖层源。文案占位符 `__HUD_TITLE_LINE1__` 等;资源占位符(`__HUD_LEFT_DRAGON__` 等 4 个)归 repack 处理。

新增模板:复制本目录结构、替换基础包、改 template.json;步骤脚本全部经由 template.json 读取常量,无需改代码。

## 与手工流程的对应

手工流程(`playable-examples/.../tools/`)被参数化移植为 `src/scripts/`:`repack-assets.mjs`→`repack.mjs`、`blur-game-background.mjs`→`blur-background.mjs`、`dragon-image-to-pattern.py`→`image-to-pattern.py`、`replace-opening-levels-with-dragon.mjs`→`write-levels.mjs`(改为产出数据工件,关卡落盘在打包工作区)、`recolor-hud-portraits.py`→`recolor-portraits.py`。未移植:`extract-assets.mjs`(一次性)、`catalog-assets.mjs`(文档生成)、`generate-minimax-intro.py`(外部 AI infra,改为直接上传成品视频)、`replace-opening-levels-with-bottle.mjs`(被图案流程取代)。

### AI 创建配置

服务启动时读取项目根目录 `.env`(已加入 Git 忽略);已导出的同名环境变量优先。配置 `ANTHROPIC_BASE_URL`、`ANTHROPIC_AUTH_TOKEN`(或 `ANTHROPIC_API_KEY`)和支持图片输入的 `ANTHROPIC_MODEL`,然后重启服务。凭据仅留在服务端,不要写入任务配置或提交到仓库。未配置时 AI 创建会显示明确的配置提示,普通生成与人工筛选仍可使用。

关卡打散默认使用广告试玩模式:按每种颜色的实际数量聚成大块,随机排列颜色顺序及铺排方向,优先减少分散色块和单颗珠子。保留颜色库存、占位形状和模板开局匹配率上限,不再强制拆成许多小块。每次运行生成新 seed 并写入关卡产物;脚本可用 `--seed <uint32>` 复现同一结果。

也可复用已有 Anthropic 兼容配置: `node editor/server.mjs --port 8099 --ai-settings /path/to/settings.json`。只读取该文件 `env` 中上述四项配置;已导出的变量和 `.env` 优先。
