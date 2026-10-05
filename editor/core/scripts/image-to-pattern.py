#!/usr/bin/env python3
"""Convert a source image into a bead-pattern character matrix.

Parameterized port of the example's tools/dragon-image-to-pattern.py: the
conversion algorithm is identical line-for-line, but the source image, output
paths, grid size, thresholds, and the Board-tile palette now arrive via CLI /
template.json instead of hardcoded constants. The palette (34 tile families
红 紫 蓝 绿 黄 灰, measured from the packed tile atlas
bd/bd4e154b-*.webp) and the allowed-tile list belong to the base package and
are read from the template's template.json.
"""
import argparse
from collections import Counter
import json
import sys
from pathlib import Path

from PIL import Image, ImageFilter


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--template-json", type=Path, required=True,
                        help="template.json providing pattern.palette and pattern.allowedTiles")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--preview", type=Path, required=True)
    parser.add_argument("--width", type=int, default=None)
    parser.add_argument("--height", type=int, default=None)
    parser.add_argument("--brightness-threshold", type=float, default=None)
    parser.add_argument("--min-coverage", type=float, default=None)
    parser.add_argument("--prune-floor", type=int, default=None)
    parser.add_argument("--smoothing-passes", type=int, default=None)
    parser.add_argument("--max-colors", type=int, default=8, choices=range(1, 35),
                        help="maximum output colors, keeping the most frequent tiles (default: 8)")
    parser.add_argument("--allowed-tiles", type=str, default=None,
                        help="comma-separated Board tile IDs overriding template.pattern.allowedTiles")
    return parser.parse_args()


ARGS = parse_args()
TEMPLATE = json.loads(ARGS.template_json.read_text(encoding="utf-8"))
PATTERN_CFG = TEMPLATE["pattern"]

WIDTH = ARGS.width if ARGS.width is not None else PATTERN_CFG["defaultWidth"]
HEIGHT = ARGS.height if ARGS.height is not None else PATTERN_CFG["defaultHeight"]

# Board tile ID -> (representative RGB, name), from template.json.
PALETTE = {
    int(tile): (tuple(entry["rgb"]), entry["name"])
    for tile, entry in PATTERN_CFG["palette"].items()
}

# Tiles allowed in the pattern. Restricting the count keeps the scramble
# inside LPCS component-ratio limits and the board readable. Tasks may
# override the base-package default via --allowed-tiles (e.g. a warm set for
# skin tones).
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

# One matrix symbol per allowed tile; digits extend the alphabet past 26 so
# the full 34-color palette fits.
SYMBOL_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"
SYMBOL_BY_TILE = {}
for index, tile in enumerate(sorted(ALLOWED)):
    if index >= len(SYMBOL_ALPHABET):
        raise SystemExit(f"允许色号过多(上限 {len(SYMBOL_ALPHABET)}),无法分配矩阵符号")
    SYMBOL_BY_TILE[tile] = SYMBOL_ALPHABET[index]

BRIGHTNESS_THRESHOLD = ARGS.brightness_threshold if ARGS.brightness_threshold is not None else PATTERN_CFG["brightnessThreshold"]
MIN_COVERAGE = ARGS.min_coverage if ARGS.min_coverage is not None else PATTERN_CFG["minCoverage"]
PRUNE_FLOOR = ARGS.prune_floor if ARGS.prune_floor is not None else PATTERN_CFG["pruneFloor"]
SMOOTHING_PASSES = ARGS.smoothing_passes if ARGS.smoothing_passes is not None else PATTERN_CFG["smoothingPasses"]


def load_cell_colors(image):
    """Average figure color per grid cell plus the figure mask."""
    rgb = image.convert("RGB")
    mask = Image.new("L", rgb.size, 0)
    mask_px = mask.load()
    rgb_px = rgb.load()
    for y in range(rgb.size[1]):
        for x in range(rgb.size[0]):
            r, g, b = rgb_px[x, y]
            # Figure = glowing energy body; armor background stays dark and dull.
            brightness = max(r, g, b) / 255.0
            if brightness >= BRIGHTNESS_THRESHOLD:
                mask_px[x, y] = 255
    keep_largest_component(mask, mask_px, rgb.size)
    cell_colors = [[None] * WIDTH for _ in range(HEIGHT)]
    for cy in range(HEIGHT):
        for cx in range(WIDTH):
            x0 = round(cx * rgb.size[0] / WIDTH)
            x1 = round((cx + 1) * rgb.size[0] / WIDTH)
            y0 = round(cy * rgb.size[1] / HEIGHT)
            y1 = round((cy + 1) * rgb.size[1] / HEIGHT)
            samples = 0
            total = [0, 0, 0]
            for y in range(y0, y1):
                for x in range(x0, x1):
                    if mask_px[x, y]:
                        r, g, b = rgb_px[x, y]
                        total[0] += r
                        total[1] += g
                        total[2] += b
                        samples += 1
            span = (x1 - x0) * (y1 - y0)
            if samples / span >= MIN_COVERAGE:
                cell_colors[cy][cx] = tuple(t / samples for t in total)
    return cell_colors


def keep_largest_component(mask, mask_px, size):
    """Keep the biggest 4-connected blob and fill its interior holes."""
    width, height = size
    seen = [[False] * width for _ in range(height)]
    best = []
    for y0 in range(height):
        for x0 in range(width):
            if not mask_px[x0, y0] or seen[y0][x0]:
                continue
            stack = [(x0, y0)]
            seen[y0][x0] = True
            blob = []
            while stack:
                x, y = stack.pop()
                blob.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < width and 0 <= ny < height and mask_px[nx, ny] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if len(blob) > len(best):
                best = blob
    clean = [[False] * width for _ in range(height)]
    for x, y in best:
        clean[y][x] = True
    # Flood-fill background from the borders; unreached dark cells are holes.
    outside = [[False] * width for _ in range(height)]
    stack = [(x, y) for x in range(width) for y in (0, height - 1) if not clean[y][x]]
    stack += [(x, y) for y in range(height) for x in (0, width - 1) if not clean[y][x]]
    for x, y in stack:
        outside[y][x] = True
    while stack:
        x, y = stack.pop()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height and not clean[ny][nx] and not outside[ny][nx]:
                outside[ny][nx] = True
                stack.append((nx, ny))
    for y in range(height):
        for x in range(width):
            keep = clean[y][x] or not outside[y][x]
            mask_px[x, y] = 255 if keep else 0


def nearest_tile(color, allowed):
    best_tile, best_score = None, None
    r, g, b = color
    for tile in allowed:
        pr, pg, pb = PALETTE[tile][0]
        # Hue matters more than brightness for readability at 40 cells.
        score = 1.6 * (r - pr) ** 2 + 1.2 * (g - pg) ** 2 + (b - pb) ** 2
        if best_score is None or score < best_score:
            best_tile, best_score = tile, score
    return best_tile


def reduce_colors(tiles, cell_colors, max_colors=8, floor=6):
    """Keep dominant colors and merge minor colors without removing cells."""
    counts = Counter(tile for row in tiles for tile in row if tile is not None)
    # Stable tie-break so rerunning the same image gives the same palette.
    ranked = sorted(counts, key=lambda tile: (-counts[tile], tile))[:max_colors]
    # Retain at least two existing colors when possible, matching the prior
    # rare-color policy; never invent extra colors to reach the limit.
    minimum = min(2, len(ranked))
    kept = sorted(tile for index, tile in enumerate(ranked)
                  if index < minimum or counts[tile] >= floor)
    reduced = [row[:] for row in tiles]
    for y, row in enumerate(tiles):
        for x, tile in enumerate(row):
            if tile is not None and tile not in kept:
                # Smoothing can fill a formerly empty cell with no RGB sample.
                color = cell_colors[y][x] or PALETTE[tile][0]
                reduced[y][x] = nearest_tile(color, kept)
    # Count the actual remapped cells; these are the game's color inventory.
    final_counts = Counter(tile for row in reduced for tile in row if tile is not None)
    return reduced, final_counts


def modal_filter(tiles):
    """Replace each cell with the most common non-empty neighbor tile."""
    for _ in range(SMOOTHING_PASSES):
        adjusted = [row[:] for row in tiles]
        for cy in range(HEIGHT):
            for cx in range(WIDTH):
                votes = {}
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < HEIGHT and 0 <= nx < WIDTH and tiles[ny][nx]:
                            votes[tiles[ny][nx]] = votes.get(tiles[ny][nx], 0) + 1
                if not votes:
                    continue
                winner = max(votes.items(), key=lambda item: (item[1], -item[0]))[0]
                # Only smooth genuinely mixed cells so thin structure survives.
                if votes[winner] >= 4 and votes[winner] > sum(v for k, v in votes.items() if k != winner):
                    adjusted[cy][cx] = winner
        tiles = adjusted
    return tiles


def main():
    image = Image.open(ARGS.source).convert("RGB")
    image = image.filter(ImageFilter.GaussianBlur(2))
    cell_colors = load_cell_colors(image)
    interior = [[None] * WIDTH for _ in range(HEIGHT)]
    for cy in range(HEIGHT):
        for cx in range(WIDTH):
            color = cell_colors[cy][cx]
            interior[cy][cx] = nearest_tile(color, ALLOWED) if color else None
    interior = modal_filter(interior)

    interior, counts = reduce_colors(
        interior, cell_colors, max_colors=ARGS.max_colors, floor=PRUNE_FLOOR,
    )

    rows = []
    for cy in range(HEIGHT):
        row = []
        for cx in range(WIDTH):
            tile = interior[cy][cx]
            row.append(SYMBOL_BY_TILE[tile] if tile else " ")
        rows.append("".join(row))

    # Render the preview from `rows` — the exact data the level generator
    # consumes — so preview, JSON, and the game can never drift apart
    # (the outline ring included).
    tile_by_symbol = {symbol: tile for tile, symbol in SYMBOL_BY_TILE.items()}
    preview = Image.new("RGB", (WIDTH * 16, HEIGHT * 16), (18, 18, 22))
    for cy in range(HEIGHT):
        for cx in range(WIDTH):
            symbol = rows[cy][cx]
            tile = tile_by_symbol.get(symbol)
            color = PALETTE[tile][0] if tile else (18, 18, 22)
            for yy in range(cy * 16 + 1, (cy + 1) * 16 - 1):
                for xx in range(cx * 16 + 1, (cx + 1) * 16 - 1):
                    preview.putpixel((xx, yy), color)
    preview = preview.resize((WIDTH * 24, HEIGHT * 24), Image.NEAREST)
    ARGS.preview.parent.mkdir(parents=True, exist_ok=True)
    preview.save(ARGS.preview)

    payload = {
        "width": WIDTH,
        "height": HEIGHT,
        "rows": rows,
        "symbolToTile": {symbol: tile for tile, symbol in SYMBOL_BY_TILE.items()},
        "tileNames": {str(tile): PALETTE[tile][1] for tile in SYMBOL_BY_TILE},
        "colorCounts": {str(t): counts.get(t, 0) for t in sorted(counts)},
    }
    ARGS.out.parent.mkdir(parents=True, exist_ok=True)
    ARGS.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f"wrote {ARGS.out}")
    print(f"wrote {ARGS.preview}")
    for row in rows:
        print(row)


if __name__ == "__main__":
    sys.exit(main())
