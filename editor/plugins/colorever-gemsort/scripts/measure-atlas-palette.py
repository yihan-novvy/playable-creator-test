#!/usr/bin/env python3
"""Measure the true on-board colors of the gemsort tile atlas.

The pattern palette in template.json must describe what the GAME actually
renders for each Board tile ID, otherwise the editor preview looks right while
the packaged game shows shifted colors (pink -> red etc.). The game renders a
tile t on the Board with the STANDING gem sprite at atlas frame index
3*(t-1) ("0_XXXX_<名>_宝石_立"); bases and flat gems sit at 3*(t-1)+2 and
3*(t-1)+1. Frame rects live in the atlas config JSON (shelf-packed, NOT a
regular grid), so colors are sampled per rect, never by grid math.

Reads frame rects from the atlas config (Cocos packed JSON: a list of object
groups whose entries look like {"name": ..., "rect": {x,y,width,height}}),
takes the median of each frame's interior pixels (median resists the glossy
highlight), and prints the corrected palette. --write updates template.json's
pattern.palette rgb values in place; the "name" fields are untouched because
they key GuideConfig's color mapping at pack time (src/lib/meta-patch.mjs).

  python3 measure-atlas-palette.py \
    --atlas  <bundle_gemsort>/native/bd/bd4e154b-*.webp \
    --atlas-config <bundle_gemsort>/import/06/060f9d8be.json \
    --template-json <colorever-gemsort>/template.json [--write]
"""
import argparse
import json
import re
import statistics
from pathlib import Path

from PIL import Image

GEM_FRAME_KINDS = ("宝石_立", "宝石_平", "底")
GEM_FRAME_OFFSET = {"宝石_立": 0, "宝石_平": 1, "底": 2}


def load_frame_rects(atlas_config_path):
    data = json.loads(Path(atlas_config_path).read_text())
    frames = {}
    # The packed JSON nests object groups arbitrarily deep; collect every
    # dict that carries both a name and a rect.
    def walk(node):
        if isinstance(node, list):
            for item in node:
                walk(item)
        elif isinstance(node, dict):
            rect = node.get("rect")
            name = node.get("name")
            if isinstance(name, str) and isinstance(rect, dict):
                frames[name] = (rect["x"], rect["y"], rect["width"], rect["height"])
            for value in node.values():
                walk(value)
    walk(data)
    return frames


TILE_FRAME_RE = re.compile(r"^0_(\d{4})_")


def frame_index(name):
    match = TILE_FRAME_RE.match(name)
    if not match:
        return None
    return int(match.group(1))


def frame_median(atlas, rect, inset=0.25):
    x, y, w, h = rect
    xs = range(int(x + w * inset), int(x + w * (1 - inset)))
    ys = range(int(y + h * inset), int(y + h * (1 - inset)))
    rs, gs, bs = [], [], []
    for yy in ys:
        for xx in xs:
            r, g, b, a = atlas.getpixel((xx, yy))
            if a < 128:
                continue
            rs.append(r)
            gs.append(g)
            bs.append(b)
    if not rs:
        raise RuntimeError(f"frame {rect} has no opaque pixels")
    return [int(statistics.median(c)) for c in (rs, gs, bs)]


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--atlas", required=True, help="packed tile atlas webp")
    ap.add_argument("--atlas-config", required=True, help="atlas SpriteFrame config json")
    ap.add_argument("--template-json", required=True, help="template.json providing pattern.palette")
    ap.add_argument("--kind", default="宝石_立", choices=GEM_FRAME_KINDS,
                    help="which sprite the palette should describe (default: the standing gem the Board renders)")
    ap.add_argument("--write", action="store_true",
                    help="update pattern.palette rgb values in template.json in place")
    args = ap.parse_args()

    template_path = Path(args.template_json)
    template = json.loads(template_path.read_text())
    palette = template["pattern"]["palette"]

    atlas = Image.open(args.atlas).convert("RGBA")
    frames = load_frame_rects(args.atlas_config)
    by_index = {}
    for name, rect in frames.items():
        index = frame_index(name)
        if index is None:
            continue
        by_index.setdefault(index, (name, rect))

    changes = 0
    for tile_str, entry in palette.items():
        tile = int(tile_str)
        index = 3 * (tile - 1) + GEM_FRAME_OFFSET[args.kind]
        if index not in by_index:
            raise RuntimeError(f"tile {tile}: atlas config has no frame index {index}")
        name, rect = by_index[index]
        measured = frame_median(atlas, rect)
        old = entry["rgb"]
        distance = sum((a - b) ** 2 for a, b in zip(old, measured)) ** 0.5
        marker = "  <- updated" if distance > 1 else ""
        print(f"{entry['name']:<4} old={old} new={measured} d={distance:.0f}{marker}")
        if args.write and measured != old:
            entry["rgb"] = measured
            changes += 1
    if args.write:
        template_path.write_text(json.dumps(template, ensure_ascii=False, indent=2) + "\n")
        print(f"wrote {changes} palette entries to {template_path}")
    else:
        print("(dry run; pass --write to update template.json)")


if __name__ == "__main__":
    main()
