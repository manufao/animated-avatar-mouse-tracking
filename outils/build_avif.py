"""Convert the avatar layers from WebP to AVIF.

Input: public/img/<layer>.webp (made by build_layers.py).
Output: public/img/<layer>.avif, next to each WebP.

Run it from anywhere: uv run --project outils outils/build_avif.py
"""

from pathlib import Path

from PIL import Image

IMG_DIR = Path(__file__).resolve().parent.parent / "public" / "img"

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


def to_avif(source: Path, target: Path, quality: int = AVIF_QUALITY) -> None:
    """Re-encode one WebP layer as AVIF, keeping its transparency."""
    with Image.open(source) as layer:
        layer.convert("RGBA").save(
            target, quality=quality, speed=AVIF_SPEED, subsampling=AVIF_SUBSAMPLING
        )


def convert(img_dir: Path = IMG_DIR) -> dict[str, tuple[int, int]]:
    """Write the AVIF of every layer. Returns the (WebP, AVIF) sizes in bytes."""
    sizes = {}
    for name in LAYERS:
        webp = img_dir / f"{name}.webp"
        avif = img_dir / f"{name}.avif"
        to_avif(webp, avif)
        sizes[name] = (webp.stat().st_size, avif.stat().st_size)
    return sizes


def main() -> None:
    sizes = convert()
    total_webp = sum(webp for webp, _ in sizes.values())
    total_avif = sum(avif for _, avif in sizes.values())
    for name, (webp, avif) in sizes.items():
        print(f"{name:12} {webp:>7} -> {avif:>7} bytes")
    saved = 100 * (total_webp - total_avif) / total_webp
    print(f"{'total':12} {total_webp:>7} -> {total_avif:>7} bytes (-{saved:.0f}%)")


if __name__ == "__main__":
    main()
