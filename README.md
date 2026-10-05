# playable-creator

HTML5 playable-ad 单体仓库（monorepo）：模板源码、编辑器与最终成品在同一仓库内单向流动。

```
template-core/<id>/   →  npm run build  →  editor/templates/<id>/   →  editor 打包  →  result/<task>/
     玩法源项目                构建产物（入库）           制作平台（主项目）           最终成品（gitignore）
```

- `editor/` — 主项目，自包含：可视化编辑器（上传素材 → 逐步预览 → 一键打包单文件 index.html）
- `template-core/` — 各玩法的唯一来源（玩法源码、图案/关卡数据、素材与音频）
- `docs/template-plugin-spec.md` — template / plugin 契约规范，新增模板的验收标准
- `project/`、`result/` — 本地运行数据，不入库

迁移自四个独立仓库（colorever / dragon-cube / water-sort-puzzle / Playable-Wholehouse），
旧仓库已冻结、保留作参考。迁移进行中，分四个阶段，每阶段一个 commit：

1. editor 搬家（行为不变）
2. template-core 入驻（构建重定向 + game-manifest 契约）
3. 插件化拆分（runner.mjs 去模板特化 → plugins/）
4. 注册表校验、文档与收尾
