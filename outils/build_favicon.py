"""Build the site icons from the avatar picture.

Input: public/img/avatar-static.webp (made by build_layers.py).
Output: public/favicon.ico (16, 32, 48) and public/apple-touch-icon.png (180).

Run it from anywhere: uv run --project outils outils/build_favicon.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
AVATAR = ROOT / "public" / "img" / "avatar-static.webp"
PUBLIC = ROOT / "public"

# Square around the face, from the hairline to under the chin (720 x 960 canvas)
FACE_BOX = (150, 250, 570, 670)
DISC_COLOUR = "#f6f1ea"  # page background of the day scene
FACE_SHARE = 0.92  # face size, as a share of the disc
ICO_SIZES = [(16, 16), (32, 32), (48, 48)]
APPLE_SIZE = 180
SUPERSAMPLE = 4  # draw large, then shrink: smooth disc edge


def icon(size: int) -> Image.Image:
    """The face on a round disc, `size` pixels wide, with transparent corners."""
    big = size * SUPERSAMPLE
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    ImageDraw.Draw(canvas).ellipse((0, 0, big - 1, big - 1), fill=DISC_COLOUR)
    with Image.open(AVATAR) as avatar:
        face = avatar.convert("RGBA").crop(FACE_BOX)
    side = round(big * FACE_SHARE)
    face = face.resize((side, side), Image.Resampling.LANCZOS)
    offset = (big - side) // 2
    # Keep the face inside the disc: the bun and the ears must not stick out
    disc = Image.new("L", (big, big), 0)
    ImageDraw.Draw(disc).ellipse((0, 0, big - 1, big - 1), fill=255)
    layer = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    layer.paste(face, (offset, offset), face)
    layer.putalpha(Image.composite(layer.getchannel("A"), disc, disc))
    canvas.alpha_composite(layer)
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    largest = max(ICO_SIZES)[0]
    icon(largest).save(PUBLIC / "favicon.ico", sizes=ICO_SIZES)
    icon(APPLE_SIZE).save(PUBLIC / "apple-touch-icon.png", optimize=True)


if __name__ == "__main__":
    main()
