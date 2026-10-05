import { createTask, readTask, updateTaskConfig, deleteTask } from '../lib/store.mjs';

// 前端逐字段保存配置(每次 PATCH 只带被改的那个字段)。曾因 updateTaskConfig
// 整键替换导致同顶层键下的兄弟字段互相覆盖(如改了标题第二行就丢第一行),
// 刷新后回落模板 defaults,看起来像「配置没保存」。这里锁住深合并语义。

export default async function run(assert) {
  const task = createTask({ name: `cfg-patch-${Date.now()}`, templateId: 'colorever-gemsort' });
  try {
    // 模拟工作台逐字段编辑:两行标题分两次 PATCH,必须共存。
    updateTaskConfig(task.id, { hud: { titleLine1: '第一行文案' } });
    updateTaskConfig(task.id, { hud: { titleLine2: '第二行文案' } });
    updateTaskConfig(task.id, { hud: { ariaLabel: '无障碍描述' } });
    const hud = readTask(task.id).config.hud;
    assert.equal(hud.titleLine1, '第一行文案', 'titleLine1 survives later sibling patches');
    assert.equal(hud.titleLine2, '第二行文案', 'titleLine2 survives later sibling patches');
    assert.equal(hud.ariaLabel, '无障碍描述', 'ariaLabel survives sibling patches');

    // 同键标量覆盖仍然是覆盖(改回旧值要生效)。
    updateTaskConfig(task.id, { hud: { titleLine1: '新第一行' } });
    assert.equal(readTask(task.id).config.hud.titleLine1, '新第一行', 'scalar patch overwrites previous value');

    // patternConfig 各参数同样分次保存、互不丢失。
    updateTaskConfig(task.id, { patternConfig: { width: 24 } });
    updateTaskConfig(task.id, { patternConfig: { height: 32 } });
    updateTaskConfig(task.id, { patternConfig: { allowedTiles: '2,25,26' } });
    const pc = readTask(task.id).config.patternConfig;
    assert.equal(pc.width, 24, 'patternConfig.width survives sibling patches');
    assert.equal(pc.height, 32, 'patternConfig.height survives sibling patches');
    assert.equal(pc.allowedTiles, '2,25,26', 'patternConfig.allowedTiles survives sibling patches');

    // 显式 null 仍整值写入:hudCrop 置 null = 恢复完整图。
    updateTaskConfig(task.id, { hudCrop: { left: { x: 1, y: 2, width: 30, height: 30 } } });
    updateTaskConfig(task.id, { hudCrop: { left: null, right: { x: 0, y: 0, width: 10, height: 10 } } });
    const crop = readTask(task.id).config.hudCrop;
    assert.equal(crop.left, null, 'explicit null clears a crop');
    assert.equal(crop.right.width, 10, 'sibling crop side survives a null-clear patch');

    // 白名单外的顶层键照旧丢弃。
    updateTaskConfig(task.id, { sneaky: { x: 1 } });
    assert.equal(readTask(task.id).config.sneaky, undefined, 'non-whitelisted keys are still rejected');
  } finally {
    deleteTask(task.id);
  }
}
