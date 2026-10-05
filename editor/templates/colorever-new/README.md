# Colorever New 广告模板

此目录只使用 colorever 项目的构建结果。Wholehouse 负责广告配置与交付，不制作游戏图案或调整玩法参数。

## 游戏内容

图案编辑器位于旁边的 colorever 项目：在其目录运行 `npm run editor`，访问 `http://127.0.0.1:5174/editor/`。图案、配色、专属装饰、篮子参数、开局模式与随机种子都在源项目设定。保存仅写入 colorever。

设置完并验证后，在 colorever 运行 `npm run build:template`。导出到本目录 `game/`：

- index.html / game.js：经典脚本游戏壳和已编译装饰，全部音频嵌入。
- patterns/catalog.json：允许广告任务选择的成品目录、引擎校验值及构建时验证的步数。
- patterns/*.json：包含确定 opening 的图案与参数，数据有校验值。

禁止在 Wholehouse 修改游戏数据。更新游戏内容应回到 colorever，再重新构建。

## 广告任务

任务仅保存已构建的 patternId 和 intro / hud / background / CTA 配置。不开放格子、颜色、装饰、篮子、开局模式、难度或种子编辑；没有图案编辑页面或写入接口。level 步骤读取固定构建数据，pack 使用同一数据，整个过程不生成随机开局、不修改 colorever 源文件。

单向流程：colorever 编辑与验证 → build → Wholehouse 广告配置与打包。

游戏或数据 build 更新后重新运行相关任务，旧 ZIP 不会自动更新。旧任务内图案草稿备份为任务目录 legacy-picture-draft.json，广告任务改用固定成品选项。

打包只输出 index.html、game.js 及启用的广告媒体；图案数据内联，作者工具和源码不进广告包。
