# 图案数据契约

适用于 `template-core/colorever-new`。日常制作按此契约填写，使用 `scripts/check-pattern.mjs` 调用现有引擎验证。下述技术范围来自当前 `src/level.js`；若工具报告与文档不一致，以实际错误定位并更新契约。

## 数据字段

| 字段 | 含义与范围 |
| --- | --- |
| `version` / `name` | 使用 `version: 1`；`name` 为非空显示名，最多 100 字符。 |
| `width` / `height` | 各为 4～40 的整数；不必正方形。美术上优先约 24～32 格。 |
| `colors` | 颜色 ID 到 `#RRGGBB` 的映射。ID 为 1～255 的整数键，色板 2～16 色；图案至少实际使用两色。 |
| `colorNames` | 同一颜色 ID 对应的用途描述，如“奶油白口鼻”；每项最多 40 字符。 |
| `target` | 长度严格等于 `width * height` 的一维整数数组，按从上到下、从左到右排列；索引为 `y * width + x`。`0` 表示没有珠子、没有目标槽位，其余值必须存在于 `colors`。 |
| `opening` | 源图案保持 `null`，不把打散后的棋盘烘焙进图案。 |
| `capacity` / `trayCols` | 缓存容量 4～96，列数 4～16，容量不小于列数，行数向上取整且不超过 6。默认 48 / 12，按图案需求调整。 |
| `openingMode` | `easy`、`medium` 或 `scattered`；新图案演示默认优先 `easy`。 |
| `difficulty` / `seed` | 打散参数为 1～100 整数；种子为 0～2147483647 整数。作为开发预览和离线演示默认值，广告任务可另设。 |
| `decoration` | 新图案默认 `"none"`；引擎也支持既有 `cat`、`chick`、`phoenix` 类型，普通图案任务不新增类型。 |
| `decorations` | 既有专属装饰的可选微调。纯珠子新图案省略；需要维护专属装饰时才读取对应模块。 |

不要把 `0` 当作背景颜色；需要珠子背景时定义一个实际颜色 ID。没有珠子的位置应留为 `0`。

已有数据的最小参考是 `src/patterns/medical-kit.json` 和 `medical-kit.js`。仅在字段说明不足时读取这一份，不批量读取图案库。它的外形和色板不是其他题材必须照搬的样式。

## 新图案的四处源文件

ID 使用以字母开头的小写字母、数字和连字符，先确认未被占用。假设 ID 为 `sample-pattern`：

1. `src/patterns/sample-pattern.json`：上述字段与完成图。
2. `src/patterns/sample-pattern.js`：保留装饰接口，纯珠子图案使用空实现：

   ```js
   export function decorate(context) {}
   ```

3. `src/patterns/catalog.json`：新增一个条目，保留其他条目：

   ```json
   {
     "id": "sample-pattern",
     "name": "图案显示名",
     "description": "主体与配色说明",
     "level": "sample-pattern.json",
     "module": "sample-pattern.js"
   }
   ```

4. `src/patterns/index.js`：Vite 开发预览使用的静态注册；补充 import 与 `patterns` 成员：

   ```js
   import samplePatternLevel from './sample-pattern.json';
   import {decorate as samplePattern} from './sample-pattern.js';
   // 加入既有 export const patterns 对象，不另建第二个对象：
   'sample-pattern': {level: samplePatternLevel, decorate: samplePattern}
   ```

日常修改既有图案只改数据；只有名称、描述或模块改变才改相应注册。

## 检查与构建边界

`check-pattern.mjs <id>` 检查 ID 唯一性、源文件与开发注册、原始数据，以及三种模式在演示种子下的求解和颜色库存。它不运行装饰模块，也不判断轮廓和配色是否好看。

`--built` 额外检查所选构建图案、装饰片段、引擎哈希和 `game-manifest.json` 是否对应源数据。它不代替浏览器加载和广告集成检查。

构建使用 `npm run build -w template-core/colorever-new`，只输出本模板。标准图案输出在 `editor/templates/colorever-new/game/patterns/`，装饰片段在 `game/decorators/`；注册清单与哈希由构建产生。引擎不内置图案，图案变化不应改变引擎字节。
