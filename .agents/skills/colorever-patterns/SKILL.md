---
name: colorever-patterns
description: 为当前 playable-creator 项目的 colorever-new 新增或优化可玩珠子图案，按参考图调整轮廓和配色，并校验数据、构建和手机预览。用于图案任务，不用于玩法引擎改造、其他模板或独立图片生成。
---

# Colorever New 图案制作

## 从这里开始

以下命令从仓库根目录运行。根据本文件位置向上三级定位根目录，不依赖绝对机器路径。

1. 读取 [设计规范](../../../docs/colorever-pattern-design.md) 和 [数据契约](references/pattern-contract.md)。它们是日常制作所需的固定上下文。
2. 查看 Git 状态，确认本次图案 ID 和用户要求。修改已有图案只读它的 JSON、装饰模块及对应注册片段；新增图案按契约创建，不遍历现有图案寻找写法。
3. 先设计完成图，再验证开局。默认只修改 `colorever-new` 的目标图案和必要配套，不同步其他模板，不顺带改材质、渲染或玩法。

日常不需要重读根 README、模板完整 README、历史对话、其他图案测试或整个引擎。需要编辑共享注册文件时只取相关片段，保留其他条目。用户明确要求分析源码时，按该任务读取。

## 制作与检查

按契约编辑 `template-core/colorever-new/src/patterns/<id>.json`。新增时同时补齐同目录的 `<id>.js`、`catalog.json` 与 `index.js` 注册；只有数据变化时沿用已有模块和注册。

运行本 skill 自带的只读校验器，用实际开局引擎检查选定图案，不需要阅读求解实现：

```sh
node .agents/skills/colorever-patterns/scripts/check-pattern.mjs <id>
```

输出为简短 JSON，包含网格、珠子数、用色和 easy / medium / scattered 三种模式的求解结果。每种模式使用图案的演示 seed / difficulty；通过不代表所有种子都已验证。若某模式失败，先检查连续色块、缓存参数和演示种子，按用户要求修正；不自动降低验收范围。

需要让广告编辑器使用新数据时，使用现有定向构建，再比对该图案的产物、清单和哈希：

```sh
npm run build -w template-core/colorever-new
node .agents/skills/colorever-patterns/scripts/check-pattern.mjs <id> --built
```

只修改图案时不应改变 `game/game.js`、`game/level-engine.mjs`。检查这些文件的 Git diff；如果发生变化，先查清原因。构建产物通过构建更新，不手写生成区。

## 实际预览

复用正在运行的 Colorever New 开发服务；先确认地址对应本项目。没有可用服务时，从根目录启动：

```sh
npm run dev -w template-core/colorever-new -- --host 127.0.0.1 --port 5175 --strictPort
```

新服务的完成图地址为 `http://127.0.0.1:5175/api/patterns/<id>/preview?completed=1&renderer=new`，开局地址将 `completed=1` 改为 `completed=0`。使用本次实际服务端口，不关闭或覆盖占用端口的服务。

在实际浏览器中按 320px、390px 宽检查完成图、开局和空槽，并试玩至完成；按设计规范判断效果。优先复用这些通用预览入口，不为每张图案复制一份专用打包或截图脚本。浏览器工具不可用时，保留已验证的数据结果，明确尚未完成视觉或触摸验收。

离线 HTML、ZIP、广告覆盖层和第二关接入仅在本次交付需要时处理；此时再读 [导出与集成](references/export-and-integration.md)。

## 何时展开读取

- 字段校验失败：先按错误和数据契约修正；契约与实现不一致时只读 `src/level.js` 的相关校验。
- 求解失败：先调整当前图案、种子或缓存；怀疑引擎问题时再读 `src/level.js` 和必要的模型片段。
- 开发预览失败：先看浏览器错误、当前注册和服务地址，再查 `scripts/authoring.mjs` 或报错文件。
- 构建或哈希失败：先看命令输出，再查具体构建脚本；不回退到手改清单或绕过校验。

涉及玩法、渲染或公共流程改造时重新确定任务范围，不把它们混入普通图案制作。只需为真实的新逻辑或图案专有约束补充测试，通用格式和求解由现有工具验证。

交付图案 ID、尺寸、珠子数、用色、实际预览或截图以及已通过的检查。区分自动检查与实际视觉验收。是否提交遵循本次用户指令，不因使用 skill 自动提交。
