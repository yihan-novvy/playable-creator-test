#!/usr/bin/env python3
"""Convert editable/hud/dragon-right.png into a 29x29 bead-pattern matrix.

Follows docs/pattern-replacement: the output rows use one symbol per Board tile
ID so the Node level script can map them straight onto the Board layer.
Emits dragon-pattern.generated.json next to this script plus a preview PNG.
"""
import colorsys
import json
import sys
from pathlib import Path

from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / "editable" / "hud" / "dragon-right.png"
OUTPUT_JSON = HERE / "dragon-pattern.generated.json"
OUTPUT_PREVIEW = HERE / "dragon-pattern.preview.png"

WIDTH = 40
HEIGHT = 40

# Board tile ID -> representative RGB, measured from the packed tile atlas
# (editable/assets/assets/bundle_gemsort/native/bd/bd4e154b-*.webp) and the
# running game. Families follow the Board_Images tileset order: 红 紫 蓝 绿 黄 灰.
PALETTE = {
    1: ((239, 166, 178), "红1"),
    2: ((250, 180, 125), "红2"),
    3: ((246, 105, 80), "红3"),
    4: ((199, 54, 39), "红4"),
    5: ((131, 42, 30), "红5"),
    6: ((107, 30, 43), "红6"),
    7: ((200, 41, 131), "紫1"),
    8: ((130, 52, 126), "紫2"),
    9: ((108, 52, 132), "紫3"),
    10: ((115, 27, 91), "紫4"),
    11: ((112, 20, 122), "紫5"),
    12: ((70, 27, 113), "紫6"),
    13: ((40, 195, 192), "蓝1"),
    14: ((37, 162, 192), "蓝2"),
    15: ((2, 116, 179), "蓝3"),
    16: ((76, 77, 211), "蓝4"),
    17: ((46, 20, 152), "蓝5"),
    18: ((33, 63, 89), "蓝6"),
    19: ((159, 209, 30), "绿1"),
    20: ((29, 130, 72), "绿2"),
    21: ((8, 133, 140), "绿3"),
    22: ((21, 144, 120), "绿4"),
    23: ((4, 126, 6), "绿5"),
    24: ((8, 83, 4), "绿6"),
    25: ((236, 197, 3), "黄1"),
    26: ((220, 146, 4), "黄2"),
    27: ((208, 96, 16), "黄3"),
    28: ((189, 122, 4), "黄4"),
    29: ((171, 110, 6), "黄5"),
    30: ((150, 69, 19), "黄6"),
    31: ((239, 233, 227), "灰1"),
    32: ((199, 189, 179), "灰2"),
    33: ((140, 131, 122), "灰3"),
    34: ((33, 46, 62), "灰4"),
}

# Tiles allowed in the pattern. Restricting the count keeps the scramble
# inside LPCS component-ratio limits and the board readable.
ALLOWED = [7, 8, 9, 10, 11, 12, 16, 17, 13, 31, 25]
SYMBOL_BY_TILE = {}
for index, tile in enumerate(sorted(ALLOWED)):
    SYMBOL_BY_TILE[tile] = "abcdefghijklmnopqrstuvwxyz"[index]

BRIGHTNESS_THRESHOLD = 0.5
MIN_COVERAGE = 0.5
PRUNE_FLOOR = 6
SMOOTHING_PASSES = 2


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
        # Hue matters more than brightness for readability at 29 cells.
        score = 1.6 * (r - pr) ** 2 + 1.2 * (g - pg) ** 2 + (b - pb) ** 2
        if best_score is None or score < best_score:
            best_tile, best_score = tile, score
    return best_tile


def prune_rare_colors(tiles, floor=4):
    """Merge tiny color populations into their nearest surviving neighbor."""
    counts = {}
    for tile in tiles:
        if tile:
            counts[tile] = counts.get(tile, 0) + 1
    changed = True
    while changed:
        changed = False
        rare = [tile for tile, count in counts.items() if count < floor]
        for tile in rare:
            if len(counts) <= 2:
                break
            replacement = nearest_tile(PALETTE[tile][0], [t for t in counts if t != tile])
            counts[replacement] = counts.get(replacement, 0) + counts[tile]
            del counts[tile]
            changed = True
    return counts


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
    image = Image.open(SOURCE).convert("RGB")
    image = image.filter(ImageFilter.GaussianBlur(2))
    cell_colors = load_cell_colors(image)
    interior = [[None] * WIDTH for _ in range(HEIGHT)]
    for cy in range(HEIGHT):
        for cx in range(WIDTH):
            color = cell_colors[cy][cx]
            interior[cy][cx] = nearest_tile(color, ALLOWED) if color else None
    interior = modal_filter(interior)

    flat = [interior[y][x] for y in range(HEIGHT) for x in range(WIDTH)]
    counts = prune_rare_colors(flat, floor=PRUNE_FLOOR)
    kept = set(counts)
    for cy in range(HEIGHT):
        for cx in range(WIDTH):
            if interior[cy][cx] and interior[cy][cx] not in kept:
                interior[cy][cx] = nearest_tile(cell_colors[cy][cx], sorted(kept))

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
    preview.save(OUTPUT_PREVIEW)

    payload = {
        "width": WIDTH,
        "height": HEIGHT,
        "rows": rows,
        "symbolToTile": {symbol: tile for tile, symbol in SYMBOL_BY_TILE.items()},
        "tileNames": {str(tile): PALETTE[tile][1] for tile in SYMBOL_BY_TILE},
        "colorCounts": {str(t): counts.get(t, 0) for t in sorted(counts)},
    }
    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f"wrote {OUTPUT_JSON}")
    print(f"wrote {OUTPUT_PREVIEW}")
    for row in rows:
        print(row)


if __name__ == "__main__":
    sys.exit(main())
