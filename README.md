# playable-creator

HTML5 playable-ad 单体仓库（monorepo）：模板源码、编辑器与最终成品在同一仓库内单向流动。

```
template-core/<id>/   →  npm run build  →  editor/templates/<id>/   →  editor 打包  →  result/<task>/
     玩法源项目                构建产物（入库）           制作平台（主项目）           最终成品（gitignore）
```

## 快速开始

```sh
npm install          # 安装 workspaces 依赖（template-core/*）
npm run build        # 构建全部模板 → editor/templates/<id>/
npm run validate     # 插件注册表校验（含版本护栏）
npm run dev          # 启动编辑器 http://127.0.0.1:8088
npm test             # editor 测试套件 + 各 template-core 测试
```

编辑器工作流：新建任务（选模板）→ 上传素材（片头视频 / HUD 立绘 / 背景）→ 填文案 →
逐步运行并预览 → 一键打包单文件 `index.html`（`result/<task>/`，可 ZIP 导出）。

## 目录

- `editor/` — 主项目，自包含：`server.mjs` + `core/`（通用流水线、注册表、校验）+
  `templates/`（构建产物，入库）+ `plugins/`（各模板的衔接层：契约、覆盖层、steps、工作台）
- `template-core/` — 各玩法的唯一来源：colorever / dragon-cube / water-sort / colorever-gemsort（静态）
- `docs/template-plugin-spec.md` — template / plugin 契约规范与新增模板清单
- `project/`、`result/` — 本地运行数据，不入库

## 新增一个 playable

1. `template-core/<id>/`：玩法源项目，`npm run build` 产出 game 与 game-manifest.json；
2. `editor/plugins/<id>/`：plugin.json 声明 steps/上传槽位/覆盖层/默认配置，按需写 steps/ 与 workbench.js；
3. `npm run validate` 通过，`npm run dev` 里试跑全流程。

editor 核心零改动。详见 [docs/template-plugin-spec.md](docs/template-plugin-spec.md)。

## 制作 Colorever New 图案

图案制作使用项目级 skill [`colorever-patterns`](.agents/skills/colorever-patterns/SKILL.md)，
可在任务中指定 `$colorever-patterns` 并提供参考图、名称和特殊要求。
日常任务按 skill 中的固定路径和命令操作，仅在异常时展开相关源码。

美术标准见 [图案设计规范](docs/colorever-pattern-design.md)，字段与注册方式见
[图案数据契约](.agents/skills/colorever-patterns/references/pattern-contract.md)。
默认仅修改 `colorever-new`，不向其他 Colorever 模板同步。

## 来源

迁移自四个独立仓库（colorever / dragon-cube / water-sort-puzzle / Playable-Wholehouse，
位于同级目录、已冻结只读）。迁移分四个 Phase 完成，每 Phase 一个 commit：
editor 搬家 → template-core 入驻 → 插件化拆分 → 注册表校验收尾。
