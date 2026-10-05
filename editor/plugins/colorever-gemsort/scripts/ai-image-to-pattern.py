#!/usr/bin/env python3
"""Convert a portrait photo into a bead-pattern matrix, with an LLM drawing the mask.

与 image-to-pattern.py 的分工:那个脚本用"亮度阈值 + 最大连通块"猜主体轮廓,
对深色铠甲上的发光龙有效,对真人照片会只剩一张亮脸。这里把"哪格是主体"
交给视觉 LLM 判断(显著性是它的强项),颜色仍由代码在掩膜内对原图逐格采样、
映射到 Board 调色板 —— 颜色保真不依赖模型。输出与 image-to-pattern.py
完全同构(width/height/rows/symbolToTile/tileNames/colorCounts + 预览图),
write-levels.mjs 无需任何改动即可消费。

LLM 端点走 Anthropic 兼容协议,复用当前会话的 ANTHROPIC_BASE_URL /
ANTHROPIC_AUTH_TOKEN 环境变量。
"""
import argparse
import base64
import io
import json
import math
import os
import ssl
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--template-json", type=Path, required=True,
                        help="template.json providing pattern.palette and pattern.allowedTiles")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--preview", type=Path, required=True)
    parser.add_argument("--width", type=int, default=None)
    parser.add_argument("--height", type=int, default=None)
    parser.add_argument("--min-coverage", type=float, default=None)
    parser.add_argument("--prune-floor", type=int, default=None)
    parser.add_argument("--smoothing-passes", type=int, default=None)
    parser.add_argument("--allowed-tiles", type=str, default=None,
                        help="comma-separated Board tile IDs overriding template.pattern.allowedTiles")
    parser.add_argument("--model", type=str, default=None,
                        help="chat model id (default: $ANTHROPIC_MODEL or glm-5.3-flash)")
    parser.add_argument("--attempts", type=int, default=5,
                        help="LLM 调用次数上限;每次失败会把原因反馈进下一次提示")
    parser.add_argument("--image-max-side", type=int, default=620,
                        help="发给 LLM 的图片最长边(降低 token 成本)")
    parser.add_argument("--mask-in", type=Path, default=None,
                        help="复用已落盘的 LLM 掩膜(sidecar JSON),跳过 LLM 调用")
    parser.add_argument("--mask-out", type=Path, default=None,
                        help="把校验通过的掩膜写到该 JSON,便于只调颜色不重调 LLM")
    parser.add_argument("--gamma", type=str, default="auto",
                        help="颜色采样前提亮指数;auto=按全图中点亮度自适应(目标 0.52),1 = 不提亮")
    parser.add_argument("--saturation", type=float, default=1.2,
                        help="颜色采样前的饱和度增益")
    parser.add_argument("--max-color-component-ratio", type=float, default=0.45,
                        help="预留阈值(当前仅记录 largestColorComponent 指标,不做拒绝);玩法把关在 LPCS")
    return parser.parse_args()


ARGS = parse_args()
TEMPLATE = json.loads(ARGS.template_json.read_text(encoding="utf-8"))
PATTERN_CFG = TEMPLATE["pattern"]

WIDTH = ARGS.width if ARGS.width is not None else PATTERN_CFG["defaultWidth"]
HEIGHT = ARGS.height if ARGS.height is not None else PATTERN_CFG["defaultHeight"]
MIN_COVERAGE = ARGS.min_coverage if ARGS.min_coverage is not None else PATTERN_CFG["minCoverage"]
PRUNE_FLOOR = ARGS.prune_floor if ARGS.prune_floor is not None else PATTERN_CFG["pruneFloor"]
SMOOTHING_PASSES = ARGS.smoothing_passes if ARGS.smoothing_passes is not None else PATTERN_CFG["smoothingPasses"]

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

SYMBOL_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"
SYMBOL_BY_TILE = {}
for index, tile in enumerate(sorted(ALLOWED)):
    if index >= len(SYMBOL_ALPHABET):
        raise SystemExit(f"允许色号过多(上限 {len(SYMBOL_ALPHABET)}),无法分配矩阵符号")
    SYMBOL_BY_TILE[tile] = SYMBOL_ALPHABET[index]

BASE_URL = (os.environ.get("ANTHROPIC_BASE_URL") or "https://api.anthropic.com").rstrip("/")
AUTH_TOKEN = os.environ.get("ANTHROPIC_AUTH_TOKEN") or os.environ.get("ANTHROPIC_API_KEY")
if not AUTH_TOKEN and not ARGS.mask_in:
    raise SystemExit("缺少 ANTHROPIC_AUTH_TOKEN / ANTHROPIC_API_KEY 环境变量")
MODEL = ARGS.model or os.environ.get("ANTHROPIC_MODEL") or "glm-5.3-flash"


# ------------------------------- LLM: mask -------------------------------- #

PROMPT_TEMPLATE = """Convert this photo into a bead-art silhouette mask for a puzzle game board.

The board is a grid of {width} columns x {height} rows of square cells. Output exactly {height} strings, each exactly {width} characters long:
- '#' = this cell is part of the subject
- ' ' = empty cell

The image you see has already been stretched to exactly the board's aspect ratio, so it maps 1:1 onto the cells: draw the mask on what you see, nothing else.

Rules:
1. Preserve the main subject actually shown in the image: a person, animal, object, icon or other foreground subject. Do not invent a person when the source is an object. Exclude the background, including any checkerboard backdrop.
2. Composition: follow the actual image position, scale and framing. Preserve the full visible subject and its important features.
3. The figure outline must be smooth and 4-connected: no isolated cells, no diagonal-only connections.
4. Preserve holes in objects such as handles. You may carve a few interior '#' holes for dark features (eyes, open mouth, deep shadow) only where it clearly helps recognition. Keep it minimal.
5. Follow the subject's actual silhouette. For a person include hair, face, neck and visible torso; for an object preserve its outline and attached parts.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{{"rows": ["{row_hint}", "..."]}}"""


def build_payload(feedback, escalate=False):
    # 先把源图拉伸到棋盘宽高比再发给模型:掩膜格与颜色采样格从此逐格对应,
    # 模型不可能"加宽"出采样不到主体的格子(否则会采到背景色)。
    origin = Image.open(ARGS.source).convert("RGB")
    src_w, src_h = origin.size
    board_aspect = WIDTH / HEIGHT
    if src_w / src_h > board_aspect:
        stretched = origin.resize((round(src_h * board_aspect), src_h), Image.LANCZOS)
    else:
        stretched = origin.resize((src_w, round(src_w / board_aspect)), Image.LANCZOS)
    scale = ARGS.image_max_side / max(stretched.size)
    if scale < 1:
        stretched = stretched.resize((round(stretched.size[0] * scale), round(stretched.size[1] * scale)), Image.LANCZOS)
    buffer = io.BytesIO()
    stretched.save(buffer, format="JPEG", quality=88)
    image_b64 = base64.b64encode(buffer.getvalue()).decode("ascii")

    prompt = PROMPT_TEMPLATE.format(
        width=WIDTH, height=HEIGHT,
        row_hint="#" * min(WIDTH, 20),
    )
    if feedback:
        prompt += f"\n\nYour previous attempt was rejected: {feedback}\nFix this and try again."

    body = {
        "model": MODEL,
        # GLM 会把输出预算全花在思考块上导致空答案,所以默认关掉 thinking;
        # escalate 时放开 thinking 并给足输出预算。
        "max_tokens": 32768 if escalate else 16384,
        "temperature": 0,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": image_b64}},
                {"type": "text", "text": prompt},
            ],
        }],
    }
    if not escalate:
        body["thinking"] = {"type": "disabled"}
    return json.dumps(body).encode("utf-8")


def call_llm(payload):
    # macOS 上 python.org 装的 Python 常缺系统 CA;优先 certifi,缺失则放宽校验。
    try:
        import certifi
        context = ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        context = ssl._create_unverified_context()
    request = urllib.request.Request(
        f"{BASE_URL}/v1/messages",
        data=payload,
        headers={
            "content-type": "application/json",
            "authorization": f"Bearer {AUTH_TOKEN}",
            "x-api-key": AUTH_TOKEN,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=600, context=context) as response:
        body = json.loads(response.read().decode("utf-8"))
    text = "".join(block.get("text", "") for block in body.get("content", []))
    return text, body


def normalize_rows(text):
    """Extract, normalize and shape-check the mask; returns rows or raises ValueError.

    首选 JSON;模型有时会忽略格式直接画 ASCII,此时退回逐行解析。"""
    start, end = text.find("{"), text.rfind("}")
    if start >= 0 and end > start:
        try:
            rows = json.loads(text[start:end + 1])["rows"]
        except (json.JSONDecodeError, KeyError, TypeError):
            rows = None
        if isinstance(rows, list):
            if len(rows) != HEIGHT:
                raise ValueError(f"行数不是 {HEIGHT}(得到 {len(rows)})")
            return [_fix_row(row) for row in rows]
    raw = [line.strip() for line in text.splitlines()
           if line.strip() and "#" in line and all(ch in "#xXoO*. " for ch in line.strip())]
    raw = [line for line in raw if set(line) - {".", " "}]
    if len(raw) != HEIGHT:
        raise ValueError(f"既不是合法 JSON 也不是 {HEIGHT} 行 ASCII 掩膜(拿到 {len(raw)} 行)")
    return [_fix_row(row) for row in raw]


def _fix_row(row):
    row = "".join("#" if ch in "#xXoO*" else " " for ch in str(row))
    return row[:WIDTH].ljust(WIDTH, " ")


def validate_mask(rows):
    filled = sum(row.count("#") for row in rows)
    ratio = filled / (WIDTH * HEIGHT)
    # 上限 0.80:铺满画布的半身像(发+肩到边)本来就会到 0.7+。
    if not 0.10 <= ratio <= 0.80:
        raise ValueError(f"填充率 {ratio:.2f} 超出 [0.10, 0.80]")
    return ratio


# --------------------------- mask → colored board -------------------------- #

def keep_largest_component(mask):
    """Keep the biggest 4-connected blob and fill its interior holes."""
    width, height = WIDTH, HEIGHT
    seen = [[False] * width for _ in range(height)]
    best = []
    for y0 in range(height):
        for x0 in range(width):
            if not mask[y0][x0] or seen[y0][x0]:
                continue
            stack = [(x0, y0)]
            seen[y0][x0] = True
            blob = []
            while stack:
                x, y = stack.pop()
                blob.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < width and 0 <= ny < height and mask[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if len(blob) > len(best):
                best = blob
    clean = [[False] * width for _ in range(height)]
    for x, y in best:
        clean[y][x] = True
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
    return clean


def load_cell_colors(image, mask):
    """Average source color per masked cell(掩膜是格级的,格内取全像素均值)."""
    rgb = image.convert("RGB")
    rgb_px = rgb.load()
    cell_colors = [[None] * WIDTH for _ in range(HEIGHT)]
    for cy in range(HEIGHT):
        for cx in range(WIDTH):
            if not mask[cy][cx]:
                continue
            x0 = round(cx * rgb.size[0] / WIDTH)
            x1 = round((cx + 1) * rgb.size[0] / WIDTH)
            y0 = round(cy * rgb.size[1] / HEIGHT)
            y1 = round((cy + 1) * rgb.size[1] / HEIGHT)
            samples = 0
            total = [0, 0, 0]
            for y in range(y0, y1):
                for x in range(x0, x1):
                    r, g, b = rgb_px[x, y]
                    total[0] += r
                    total[1] += g
                    total[2] += b
                    samples += 1
            if samples:
                cell_colors[cy][cx] = tuple(t / samples for t in total)
    return cell_colors


def chroma(rgb):
    return max(rgb) - min(rgb)


# 灰色系 tile(色度 ≤30)。低饱和的肤色/布色在距离度量下会被灰块吸走,
# 所以只有色度低的格子才允许映射到灰块。
GREY_TILES = {tile for tile in ALLOWED if chroma(PALETTE[tile][0]) <= 30}


def _rgb_to_lab(rgb):
    """sRGB(D65)→CIELAB,供感知均匀的 ΔE 距离使用。"""
    def pivot(channel):
        c = channel / 255
        return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92

    r, g, b = (pivot(v) for v in rgb)
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    def f(t):
        return t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x), f(y), f(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


PALETTE_LAB = {tile: _rgb_to_lab(rgb) for tile, (rgb, _) in PALETTE.items()}


def nearest_tile(color, allowed):
    candidates = ([t for t in allowed if t not in GREY_TILES]
                  if chroma(color) >= 26 else allowed) or allowed
    l_color, a_color, b_color = _rgb_to_lab(color)
    best_tile, best_score = None, None
    for tile in candidates:
        l_tile, a_tile, b_tile = PALETTE_LAB[tile]
        # ΔE(CIELAB):RGB 加权距离会把棕/肤误判给紫,Lab 下紫棕距离被拉正。
        score = (l_color - l_tile) ** 2 + (a_color - a_tile) ** 2 + (b_color - b_tile) ** 2
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


def prune_rare_colors(tiles, floor):
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


def largest_color_component(tiles):
    """最大的同色 4 连通块格数(对齐 LPCS 的 largestComponent 概念)。"""
    seen = [[False] * WIDTH for _ in range(HEIGHT)]
    best = 0
    for y0 in range(HEIGHT):
        for x0 in range(WIDTH):
            if not tiles[y0][x0] or seen[y0][x0]:
                continue
            color = tiles[y0][x0]
            stack = [(x0, y0)]
            seen[y0][x0] = True
            size = 0
            while stack:
                x, y = stack.pop()
                size += 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < WIDTH and 0 <= ny < HEIGHT and tiles[ny][nx] == color and not seen[ny][nx]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            best = max(best, size)
    return best


def colorize(mask):
    """掩膜 → 配色。单色连通块只测量不拒绝:大面积同色(灰裙/肤色)是合法的,
    玩法层面的把关由 LPCS 打散(levels 步骤)负责。"""
    image = enhance(Image.open(ARGS.source).convert("RGB").filter(ImageFilter.GaussianBlur(2)))
    cell_colors = load_cell_colors(image, mask)
    interior = [[nearest_tile(cell_colors[cy][cx], ALLOWED) if cell_colors[cy][cx] else None
                 for cx in range(WIDTH)] for cy in range(HEIGHT)]
    interior = modal_filter(interior)

    flat = [interior[y][x] for y in range(HEIGHT) for x in range(WIDTH)]
    counts = prune_rare_colors(flat, floor=PRUNE_FLOOR)
    kept = set(counts)
    for cy in range(HEIGHT):
        for cx in range(WIDTH):
            if interior[cy][cx] and interior[cy][cx] not in kept:
                interior[cy][cx] = nearest_tile(cell_colors[cy][cx], sorted(kept))

    filled = sum(sum(1 for v in row if v) for row in mask)
    mono = largest_color_component(interior)
    return interior, counts, {"largestColorComponent": mono, "filledCells": filled}


def main():
    if ARGS.mask_in:
        sidecar = json.loads(ARGS.mask_in.read_text(encoding="utf-8"))
        ratio, attempts_used, model = sidecar["maskFillRatio"], 0, "mask-in"
        mask = keep_largest_component([[ch == "#" for ch in row] for row in sidecar["rows"]])
        interior, counts, color_stats = colorize(mask)
    else:
        interior, counts, ratio, attempts_used, model = None, None, 0.0, 0, MODEL
        last_error, escalate = None, False
        for attempt in range(1, ARGS.attempts + 1):
            attempts_used = attempt
            try:
                text, resp = call_llm(build_payload(last_error, escalate))
                if not text.strip():
                    escalate = True
                    raise ValueError(f"模型只输出了思考没有答案(stop_reason={resp.get('stop_reason')}),放开 thinking 重试")
                rows = normalize_rows(text)
                ratio = validate_mask(rows)
                mask = keep_largest_component([[ch == "#" for ch in row] for row in rows])
                # 配色也纳入重试:背景泄漏等配色级失败会把原因反馈给 LLM 重画。
                interior, counts, color_stats = colorize(mask)
                break
            except Exception as error:  # noqa: BLE001 — 反馈给下一轮重试
                last_error = str(error)
                print(f"[attempt {attempt}] 失败: {last_error}", file=sys.stderr)
                interior = None
        if interior is None:
            raise SystemExit(f"LLM {ARGS.attempts} 次尝试均未产出合法图案: {last_error}")

    if ARGS.mask_out and not ARGS.mask_in:
        ARGS.mask_out.parent.mkdir(parents=True, exist_ok=True)
        ARGS.mask_out.write_text(json.dumps({
            "width": WIDTH, "height": HEIGHT, "maskFillRatio": ratio,
            "model": model, "rows": ["".join("#" if v else " " for v in row) for row in mask],
        }, ensure_ascii=False, indent=2))

    out_rows = ["".join(SYMBOL_BY_TILE[interior[cy][cx]] if interior[cy][cx] else " "
                        for cx in range(WIDTH)) for cy in range(HEIGHT)]

    ARGS.preview.parent.mkdir(parents=True, exist_ok=True)
    render_preview(interior).save(ARGS.preview)

    payload = {
        "width": WIDTH,
        "height": HEIGHT,
        "rows": out_rows,
        "symbolToTile": {symbol: tile for tile, symbol in SYMBOL_BY_TILE.items()},
        "tileNames": {str(tile): PALETTE[tile][1] for tile in SYMBOL_BY_TILE},
        "colorCounts": {str(t): counts.get(t, 0) for t in sorted(counts)},
        "generator": {"type": "llm-mask", "model": model, "attempts": attempts_used,
                      "maskFillRatio": round(ratio, 3), **(color_stats if interior is not None else {}),
                      "source": str(ARGS.source)},
    }
    ARGS.out.parent.mkdir(parents=True, exist_ok=True)
    ARGS.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f"model={model} attempts={attempts_used} maskFillRatio={ratio:.3f}")
    print(f"wrote {ARGS.out}")
    print(f"wrote {ARGS.preview}")
    for row in out_rows:
        print(row)


if __name__ == "__main__":
    sys.exit(main())
