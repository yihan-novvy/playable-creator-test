#!/usr/bin/env python3
"""Crop a rectangular region out of an image (e.g. a HUD portrait from the
intro poster).

    python3 crop-image.py --source <img> --out <png|webp> --x X --y Y --width W --height H

Coordinates are pixels in the SOURCE image. The output format follows the
--out extension (PIL infers it); a --min-side value upscales (LANCZOS) when
the selection is smaller than that on both sides, so tiny selections stay
usable as avatars, and a --max-side value downscales when the longer side
exceeds it (the HUD avatars display at ~70 CSS px — full-resolution crops
are wasted bytes).

--trim-dark LUM trims border rows/columns whose every pixel is at or below
that luminance (studio-black letterbox around product shots, or an RGBA
source whose transparency just turned black in the RGB convert). The figure
then fills thumbnails like the HUD's pattern-reference polaroid. Content
that genuinely reaches the frame edge keeps the full image.
"""
import argparse
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--x", type=int, default=None)
    parser.add_argument("--y", type=int, default=None)
    parser.add_argument("--width", type=int, default=None)
    parser.add_argument("--height", type=int, default=None)
    parser.add_argument("--min-side", type=int, default=0,
                        help="upscale when both sides are smaller than this")
    parser.add_argument("--max-side", type=int, default=0,
                        help="downscale when the longer side exceeds this")
    parser.add_argument("--quality", type=int, default=80,
                        help="webp quality (ignored for other formats)")
    parser.add_argument("--trim-dark", type=int, default=0, metavar="LUM",
                        help="trim borders at/below this luminance first (0 disables)")
    args = parser.parse_args()

    image = Image.open(args.source).convert("RGB")
    has_rect = None not in (args.x, args.y, args.width, args.height)
    if has_rect and (args.width <= 0 or args.height <= 0):
        raise SystemExit("裁剪宽高必须为正数")
    if has_rect:
        x0 = max(0, min(args.x, image.width - 1))
        y0 = max(0, min(args.y, image.height - 1))
        x1 = max(x0 + 1, min(args.x + args.width, image.width))
        y1 = max(y0 + 1, min(args.y + args.height, image.height))
        cropped = image.crop((x0, y0, x1, y1))
        box_note = f"[{x0},{y0} {x1 - x0}x{y1 - y0}]"
    else:
        cropped = image
        box_note = "[full image]"

    if args.trim_dark > 0:
        mask = cropped.convert("L").point(lambda v: 255 if v > args.trim_dark else 0)
        dark_box = mask.getbbox()
        if dark_box:
            cropped = cropped.crop(dark_box)
            box_note += f" trim-dark->{dark_box}"

    if args.min_side > 0 and cropped.width < args.min_side and cropped.height < args.min_side:
        scale = max(args.min_side / cropped.width, args.min_side / cropped.height)
        cropped = cropped.resize(
            (round(cropped.width * scale), round(cropped.height * scale)),
            Image.LANCZOS,
        )
    if args.max_side > 0 and max(cropped.width, cropped.height) > args.max_side:
        scale = args.max_side / max(cropped.width, cropped.height)
        cropped = cropped.resize(
            (round(cropped.width * scale), round(cropped.height * scale)),
            Image.LANCZOS,
        )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    save_kwargs = {"quality": args.quality} if args.out.suffix.lower() == ".webp" else {"optimize": True}
    cropped.save(args.out, **save_kwargs)
    print(f"cropped {image.size} {box_note} -> {args.out} ({cropped.width}x{cropped.height})")


if __name__ == "__main__":
    main()
