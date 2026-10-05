#!/usr/bin/env python3
"""Convert an image into a FULL bead-pattern grid — no spatial mask; at most eight dominant colors.

与 ai-image-to-pattern.py 的分工:那条管线先由 LLM/阈值猜"哪些格是主体",
掩膜错了是结构性错误、无法补救。这条管线不自动删除格子:整张图等比缩放
(长边 = --long-side,不要求 1:1),逐格采样颜色映射到 Board 调色板,
保留最多 8 种主色并合并稀有色,把"哪些格不要"完全交给编辑器里的人工擦除(image-to-pattern-full 产出的
pattern-raw.json + 人工擦除结果由 editor 写回标准 pattern.json)。

输出是数值网格 {"width", "height", "tiles": [[tileId, ...]]}(0 = 空),
便于前端做魔棒/按色删除;不是 write-levels 消费的 rows 格式——那一步由
editor/server.mjs 的 /pattern/manual 端点在保存时编码。
"""
import argparse
from collections import Counter
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageEnhance


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--template-json", type=Path, required=True,
                        help="template.json providing pattern.palette and pattern.allowedTiles")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--preview", type=Path, required=True)
    parser.add_argument("--long-side", type=int, default=40,
                        help="网格长边;短边按原图宽高比等比求得(最小 2)")
    parser.add_argument("--allowed-tiles", type=str, default=None,
                        help="comma-separated Board tile IDs overriding template.pattern.allowedTiles")
    parser.add_argument("--gamma", type=str, default="auto",
                        help="颜色采样前提亮指数;auto=按全图中点亮度自适应(目标 0.52),1 = 不提亮")
    parser.add_argument("--saturation", type=float, default=1.2,
                        help="颜色采样前的饱和度增益")
    parser.add_argument("--smoothing-passes", type=int, default=1,
                        help="众数平滑次数(轻度去噪;0 = 完全保真)")
    parser.add_argument("--max-colors", type=int, default=8, choices=range(1, 35),
                        help="最多保留的主色数量(默认 8)")
    parser.add_argument("--prune-floor", type=int, default=None,
                        help="稀有色合并下限,默认使用模板设置")
    return parser.parse_args()


ARGS = parse_args()
TEMPLATE = json.loads(ARGS.template_json.read_text(encoding="utf-8"))
PATTERN_CFG = TEMPLATE["pattern"]

PALETTE = {
    int(tile): (tuple(entry["rgb"]), entry["name"])
    for tile, entry in PATTERN_CFG["palette"].items()
}

if ARGS.allowed_tiles:
    if ARGS.allowed_tiles.strip().lower() == "all":
        ALLOWED = sorted(PALETTE)
    else:
        ALLOWED = [int(tile) for tile in ARGS.allowed_tiles.split(",") if tile.strip()]
    unknown = [tile for tile in ALLOWED if tile not in PALETTE]
    if unknown:
        raise SystemExit(f"允许色号不在调色板中: {unknown}")
    if len(ALLOWED) < 2:
        raise SystemExit("至少需要 2 个允许色号")
else:
    ALLOWED = list(PATTERN_CFG["allowedTiles"])


def grid_dimensions(size):
    """等比缩放求网格:长边固定,短边按宽高比四舍五入(最小 2)。"""
    src_w, src_h = size
    long_side = max(2, ARGS.long_side)
    if src_w >= src_h:
        return long_side, max(2, round(src_h * long_side / src_w))
    return max(2, round(src_w * long_side / src_h)), long_side


WIDTH, HEIGHT = grid_dimensions(Image.open(ARGS.source).size)


def chroma(rgb):
    return max(rgb) - min(rgb)


# 灰色系 tile(色度 ≤30)。低饱和的肤色/布色在加权欧氏距离下会被灰块吸走,
# 所以只有色度低的格子才允许映射到灰块。
GREY_TILES = {tile for tile in ALLOWED if chroma(PALETTE[tile][0]) <= 30}


def nearest_tile(color, allowed):
    candidates = ([t for t in allowed if t not in GREY_TILES]
                  if chroma(color) >= 26 else allowed) or allowed
    best_tile, best_score = None, None
    r, g, b = color
    for tile in candidates:
        pr, pg, pb = PALETTE[tile][0]
        # 蓝通道权重最高:暖/冷误判最伤观感(肤色掉进暗黄、灰绿掉进粉红)。
        score = 1.2 * (r - pr) ** 2 + 1.2 * (g - pg) ** 2 + 1.6 * (b - pb) ** 2
        if best_score is None or score < best_score:
            best_tile, best_score = tile, score
    return best_tile


def resolve_gamma(image):
    """auto: 选 gamma 使全图中点亮度抬到 0.52,欠曝剧照多提、正常照片≈1。"""
    if ARGS.gamma != "auto":
        return float(ARGS.gamma)
    lum = sorted(image.convert("L").getdata())
    median = lum[len(lum) // 2] / 255
    if median <= 0 or median >= 1:
        return 1.0
    # 指数约定:gamma<1 提亮、>1 压暗。只允许提亮(0.4~1.0),正常照片≈1 不动。
    return min(1.0, max(0.4, math.log(0.52) / math.log(median)))


def enhance(image):
    """剧照普遍欠曝;用同一条 gamma 曲线逐通道提亮(保色相),再可选增饱和。
    不用 autocontrast——它逐通道拉伸,在暖暗调照片上会把蓝通道暴拉导致整图偏色。"""
    gamma = resolve_gamma(image)
    lut = [round(255 * (i / 255) ** gamma) for i in range(256)] * 3
    image = image.point(lut)
    if ARGS.saturation != 1.0:
        image = ImageEnhance.Color(image).enhance(ARGS.saturation)
    return image


def modal_filter(tiles):
    for _ in range(ARGS.smoothing_passes):
        adjusted = [row[:] for row in tiles]
        for cy in range(HEIGHT):
            for cx in range(WIDTH):
                votes = {}
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < HEIGHT and 0 <= nx < WIDTH:
                            votes[tiles[ny][nx]] = votes.get(tiles[ny][nx], 0) + 1
                winner = max(votes.items(), key=lambda item: (item[1], -item[0]))[0]
                if votes[winner] >= 4 and votes[winner] > sum(v for k, v in votes.items() if k != winner):
                    adjusted[cy][cx] = winner
        tiles = adjusted
    return tiles


def render_preview(tiles):
    preview = Image.new("RGB", (WIDTH * 16, HEIGHT * 16), (18, 18, 22))
    for cy in range(HEIGHT):
        for cx in range(WIDTH):
            tile = tiles[cy][cx]
            color = PALETTE[tile][0] if tile else (18, 18, 22)
            for yy in range(cy * 16 + 1, (cy + 1) * 16 - 1):
                for xx in range(cx * 16 + 1, (cx + 1) * 16 - 1):
                    preview.putpixel((xx, yy), color)
    return preview.resize((WIDTH * 24, HEIGHT * 24), Image.NEAREST)


def main():
    # LANCZOS 一步到位:每个目标像素 ≈ 原图对应格的面积均值,即逐格采样色。
    image = enhance(Image.open(ARGS.source).convert("RGB")).resize((WIDTH, HEIGHT), Image.LANCZOS)
    rgb_px = image.load()
    tiles = [[nearest_tile(rgb_px[x, y], ALLOWED) for x in range(WIDTH)] for y in range(HEIGHT)]
    if ARGS.smoothing_passes > 0:
        tiles = modal_filter(tiles)

    counts = Counter(tile for row in tiles for tile in row)
    ranked = sorted(counts, key=lambda tile: (-counts[tile], tile))[:ARGS.max_colors]
    floor = ARGS.prune_floor if ARGS.prune_floor is not None else PATTERN_CFG["pruneFloor"]
    kept = sorted(tile for index, tile in enumerate(ranked)
                  if index < min(2, len(ranked)) or counts[tile] >= floor)
    tiles = [[tile if tile in kept else nearest_tile(rgb_px[x, y], kept)
              for x, tile in enumerate(row)] for y, row in enumerate(tiles)]
    counts = Counter(tile for row in tiles for tile in row)

    ARGS.out.parent.mkdir(parents=True, exist_ok=True)
    ARGS.out.write_text(json.dumps({
        "width": WIDTH,
        "height": HEIGHT,
        "tiles": tiles,
        "colorCounts": {str(tile): count for tile, count in sorted(counts.items())},
        "generator": {"type": "manual-raw", "longSide": ARGS.long_side, "maxColors": ARGS.max_colors,
                      "source": str(ARGS.source)},
    }, ensure_ascii=False, indent=2))
    ARGS.preview.parent.mkdir(parents=True, exist_ok=True)
    render_preview(tiles).save(ARGS.preview)
    print(f"grid={WIDTH}x{HEIGHT} colors={len(counts)}")
    print(f"wrote {ARGS.out}")
    print(f"wrote {ARGS.preview}")


if __name__ == "__main__":
    sys.exit(main())
