"""Convert the avatar layers from WebP to AVIF, and preview what changes.

Input: public/img/<layer>.webp (made by build_layers.py).
Output: public/img/<layer>.avif, next to each WebP.
With --preview: outils/out/avif-preview.png, the WebP and the AVIF side by side
with their amplified difference, to check the quality by eye.

Run it from anywhere: uv run --project outils outils/build_avif.py [--preview]
"""

import argparse
from pathlib import Path

import numpy as np
from numpy.typing import NDArray
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
IMG_DIR = HERE.parent / "public" / "img"
PREVIEW_PATH = HERE / "out" / "avif-preview.png"

# The six layers the page loads at start. Occasion accessories stay WebP: the
# script of the page picks their file from the list of special dates.
LAYERS = (
    "body",
    "head-blank",
    "head-bored",
    "head-happy",
    "head-yawn",
    "lids-closed",
)
AVIF_QUALITY = 60  # measured: 37% lighter than the WebP, 45 dB or more
AVIF_SUBSAMPLING = "4:4:4"  # full colour resolution: the outlines are coloured
AVIF_SPEED = 4  # 0 is the slowest and smallest, 10 the fastest

# Preview sheet
BACKDROP = (46, 41, 38)  # dark grey, where the transparency shows
SHEET_BG = (29, 27, 25)
TEXT = (246, 241, 234)
ACCENT = (242, 184, 75)
DIFF_GAIN = 8  # the difference is amplified, or it would stay black
PANEL = (216, 288)  # a layer at 30%
GAP = 12
LABEL_H = 22
PER_ROW = 2  # layers per row of the overview
DETAIL_BOX = (210, 380, 510, 680)  # eyes and mouth, in layer pixels
DETAIL_ZOOM = 2


def to_avif(source: Path, target: Path, quality: int = AVIF_QUALITY) -> None:
    """Re-encode one WebP layer as AVIF, keeping its transparency."""
    with Image.open(source) as layer:
        layer.convert("RGBA").save(
            target, quality=quality, speed=AVIF_SPEED, subsampling=AVIF_SUBSAMPLING
        )


def load_rgba(path: Path) -> Image.Image:
    """Read a picture fully, then close its file."""
    with Image.open(path) as picture:
        return picture.convert("RGBA")


def convert(img_dir: Path = IMG_DIR) -> dict[str, tuple[int, int]]:
    """Write the AVIF of every layer. Returns the (WebP, AVIF) sizes in bytes."""
    sizes = {}
    for name in LAYERS:
        webp = img_dir / f"{name}.webp"
        avif = img_dir / f"{name}.avif"
        to_avif(webp, avif)
        sizes[name] = (webp.stat().st_size, avif.stat().st_size)
    return sizes


def over_backdrop(layer: Image.Image) -> Image.Image:
    """The layer on the dark backdrop, where its transparency shows."""
    canvas = Image.new("RGBA", layer.size, (*BACKDROP, 255))
    canvas.alpha_composite(layer.convert("RGBA"))
    return canvas.convert("RGB")


def psnr(a: NDArray[np.uint8], b: NDArray[np.uint8]) -> float:
    """Peak signal-to-noise ratio in dB between two 8-bit pictures."""
    error = np.mean((a.astype(np.float64) - b.astype(np.float64)) ** 2)
    return float("inf") if error == 0 else float(10 * np.log10(255**2 / error))


def difference(a: Image.Image, b: Image.Image) -> Image.Image:
    """Absolute difference of two pictures, amplified to become visible."""
    delta = np.abs(np.asarray(a, dtype=np.int16) - np.asarray(b, dtype=np.int16))
    return Image.fromarray(np.clip(delta * DIFF_GAIN, 0, 255).astype(np.uint8))


def trio(webp: Image.Image, avif: Image.Image) -> list[Image.Image]:
    """WebP, AVIF and amplified difference, on the backdrop."""
    a, b = over_backdrop(webp), over_backdrop(avif)
    return [a, b, difference(a, b)]


def paste_row(
    sheet: Image.Image, tiles: list[Image.Image], labels: list[str], origin: tuple
) -> int:
    """Draw tiles left to right under their labels. Returns the row height."""
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=14)
    x, y = origin
    for tile, label in zip(tiles, labels, strict=True):
        draw.text((x, y), label, font=font, fill=TEXT)
        sheet.paste(tile, (x, y + LABEL_H))
        x += tile.width + GAP
    return LABEL_H + max(tile.height for tile in tiles) + GAP


def preview(img_dir: Path = IMG_DIR, path: Path = PREVIEW_PATH) -> None:
    """Write the comparison sheet: every layer, then a close-up of the face."""
    pairs = {
        name: (
            load_rgba(img_dir / f"{name}.webp"),
            load_rgba(img_dir / f"{name}.avif"),
        )
        for name in LAYERS
    }
    detail_w = (DETAIL_BOX[2] - DETAIL_BOX[0]) * DETAIL_ZOOM
    detail_h = (DETAIL_BOX[3] - DETAIL_BOX[1]) * DETAIL_ZOOM
    overview_w = PER_ROW * 3 * (PANEL[0] + GAP) + GAP
    width = max(overview_w, 3 * (detail_w + GAP) + GAP)
    rows = -(-len(LAYERS) // PER_ROW)
    row_h = LABEL_H + PANEL[1] + GAP
    height = GAP + rows * row_h + LABEL_H + detail_h + 2 * GAP
    sheet = Image.new("RGB", (width, height), SHEET_BG)

    for index, name in enumerate(LAYERS):
        webp, avif = pairs[name]
        tiles = [t.resize(PANEL, Image.Resampling.LANCZOS) for t in trio(webp, avif)]
        size_webp = (img_dir / f"{name}.webp").stat().st_size
        size_avif = (img_dir / f"{name}.avif").stat().st_size
        score = psnr(np.asarray(over_backdrop(webp)), np.asarray(over_backdrop(avif)))
        saved = 100 * (size_webp - size_avif) / size_webp
        labels = [
            f"{name}  WebP {size_webp / 1000:.1f} KB",
            f"AVIF {size_avif / 1000:.1f} KB (-{saved:.0f}%)",
            f"difference x{DIFF_GAIN}  {score:.1f} dB",
        ]
        column, line = index % PER_ROW, index // PER_ROW
        x = GAP + column * 3 * (PANEL[0] + GAP)
        paste_row(sheet, tiles, labels, (x, GAP + line * row_h))

    # Close-up at full size of the part of the face where the details are
    webp, avif = pairs["head-happy"]
    zoom = (detail_w, detail_h)
    crops = [
        t.crop(DETAIL_BOX).resize(zoom, Image.Resampling.NEAREST)
        for t in trio(webp, avif)
    ]
    labels = ["close-up, WebP", "close-up, AVIF", f"close-up, difference x{DIFF_GAIN}"]
    paste_row(sheet, crops, labels, (GAP, GAP + rows * row_h))

    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--preview", action="store_true", help=f"also write {PREVIEW_PATH.name}"
    )
    args = parser.parse_args()

    sizes = convert()
    total_webp = sum(webp for webp, _ in sizes.values())
    total_avif = sum(avif for _, avif in sizes.values())
    for name, (webp, avif) in sizes.items():
        print(f"{name:12} {webp:>7} -> {avif:>7} bytes")
    saved = 100 * (total_webp - total_avif) / total_webp
    print(f"{'total':12} {total_webp:>7} -> {total_avif:>7} bytes (-{saved:.0f}%)")
    if args.preview:
        preview()
        print(f"preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
