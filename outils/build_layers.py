"""Build the avatar layers from the seven Nano Banana pictures.

Input: src/<name>.jpg, 1792 x 2400 pixels, all with the same framing.
Output: out/<layer>.webp (720 x 960) and out/landmarks.json for the CSS.

Run it from anywhere: uv run --project outils outils/build_layers.py
"""

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from scipy import ndimage as ndi

from masks import (
    RGB,
    Alpha,
    Mask,
    background_mask,
    bounding_box,
    largest_components,
    unmatte,
)

HERE = Path(__file__).resolve().parent
SRC_DIR = HERE / "src"
OUT_DIR = HERE / "out"
SOURCE_SIZE = (1792, 2400)  # width, height of every input picture
OUT_SIZE = (720, 960)
WEBP_QUALITY = 86

# Rows and columns below are measured on the 1792 x 2400 source pictures.
SKIN_COLOUR = np.array([211.0, 139.0, 114.0])
SKIN_TOLERANCE = 60  # sum of the three channel differences
NECK_SEED = (1705, SOURCE_SIZE[0] // 2)  # (row, column) of a neck pixel
DEFAULT_CUT_ROW = 1600  # head/body split outside the neck (ears, face sides)
NECK_MIN_TOP = 1450  # neck columns start below this row
NECK_OUTLINE = 14  # outline columns on each side of the neck
NECK_EXTENSION_TOP = 1300  # the body neck goes up to here, behind the head
NECK_EXTENSION_MARGIN = 8  # extra columns on each side of the extension
NECK_EDGE = 2  # columns drawn with the outline colour on each side
NECK_SAMPLE_ROWS = (1700, 1760)  # rows where the neck skin colour is sampled
OUTLINE_COLOUR = np.array([70.0, 50.0, 48.0])
CUT_SMOOTHING = 5  # median filter width on the split line
EYE_WHITE_MIN = 225  # eye holes: every channel above this value
CROWN_ROWS = (280, 760)  # the crown sits between these rows
# Golden cardboard: warm, bright red and green channels, little blue
GOLD_MIN_RED, GOLD_MIN_GREEN, GOLD_MAX_BLUE, GOLD_MIN_WARMTH = 140, 105, 140, 45
CROWN_CLOSING = 4
CROWN_OUTLINE = 7

HEAD_LAYERS = {
    "closed": "lids-closed",
    "bored": "head-bored",
    "yawn": "head-yawn",
    "happy": "head-happy",
}


@dataclass(frozen=True)
class Split:
    """Where the head layers end and the body layer starts."""

    cut: NDArray[np.int_]  # split row of each column
    head_region: Mask
    neck: Mask
    left: int  # first and last neck columns
    right: int


def load(name: str, src_dir: Path = SRC_DIR) -> RGB:
    """Load a source picture, checking it has the expected size."""
    path = src_dir / f"{name}.jpg"
    if not path.is_file():
        message = f"missing source picture: {path}"
        raise FileNotFoundError(message)
    with Image.open(path) as picture:
        if picture.size != SOURCE_SIZE:
            width, height = SOURCE_SIZE
            message = f"{path.name}: expected {width} x {height}, got {picture.size}"
            raise ValueError(message)
        return np.asarray(picture.convert("RGB"), dtype=np.float64)


def save(img: RGB, alpha: Alpha, mask: Mask, name: str) -> None:
    """Write one layer as a resized WebP with transparency."""
    opacity = (alpha * mask * 255).round().astype(np.uint8)
    rgba = np.dstack([img.round().clip(0, 255).astype(np.uint8), opacity])
    layer = Image.fromarray(rgba, "RGBA").resize(OUT_SIZE, Image.Resampling.LANCZOS)
    layer.save(OUT_DIR / f"{name}.webp", quality=WEBP_QUALITY, method=6)


def split_head(ref: RGB, figure: Mask) -> Split:
    """Find the neck and the row where the head is cut from the body."""
    height, width = figure.shape
    skin = (np.abs(ref - SKIN_COLOUR).sum(axis=2) < SKIN_TOLERANCE) & figure
    labels, _ = ndi.label(skin)
    seed = labels[NECK_SEED]
    if seed == 0:
        message = f"no skin at the neck seed {NECK_SEED}: check NECK_SEED"
        raise ValueError(message)
    neck = labels == seed

    top = np.argmax(neck, axis=0)
    deep = neck.any(axis=0) & (top > NECK_MIN_TOP)
    columns = np.flatnonzero(deep)
    if columns.size == 0:
        message = f"no neck column below row {NECK_MIN_TOP}"
        raise ValueError(message)
    left, right = int(columns.min()), int(columns.max())

    cut = np.full(width, DEFAULT_CUT_ROW)
    cut[deep] = top[deep]
    # Neck outline columns take the value of the nearest neck column
    cut[max(0, left - NECK_OUTLINE) : left] = cut[left]
    cut[right + 1 : right + 1 + NECK_OUTLINE] = cut[right]
    cut = ndi.median_filter(cut, size=CUT_SMOOTHING)
    rows = np.arange(height)[:, None]
    return Split(cut, rows < cut[None, :], neck, left, right)


def build_body(ref: RGB, background: Mask, split: Split) -> None:
    """Everything under the cut, plus the neck extended up behind the head."""
    img, alpha = unmatte(ref, np.ones(background.shape), background)
    mask = ~background & ~split.head_region
    rows = np.arange(background.shape[0])[:, None]
    low, high = NECK_SAMPLE_ROWS
    neck_skin = np.median(ref[split.neck & (rows > low) & (rows < high)], axis=0)
    margin = NECK_EXTENSION_MARGIN
    for x in range(split.left - margin, split.right + margin + 1):
        top, bottom = NECK_EXTENSION_TOP, split.cut[x]
        if bottom <= top:
            continue
        edge = x < split.left + NECK_EDGE or x > split.right - NECK_EDGE
        img[top:bottom, x] = OUTLINE_COLOUR if edge else neck_skin
        mask[top:bottom, x] = True
        alpha[top:bottom, x] = 1.0
    save(img, alpha, mask, "body")


def build_head(name: str, out_name: str, split: Split, *, eye_holes: bool) -> Mask:
    """One head layer from its own picture. Returns the eye holes, if cut."""
    img = load(name)
    background = background_mask(img)
    img, alpha = unmatte(img, np.ones(background.shape), background)
    mask = ~background & split.head_region
    holes = np.zeros(background.shape, dtype=bool)
    if eye_holes:
        white = (img.min(axis=2) > EYE_WHITE_MIN) & mask
        holes = largest_components(white, 2)
        img, alpha = unmatte(img, alpha, holes)
        mask &= ~holes
    save(img, alpha, mask, out_name)
    return holes


def build_crown() -> None:
    """Epiphany accessory: the golden cardboard of the crown picture."""
    crown = load("crown")
    r, g, b = crown[..., 0], crown[..., 1], crown[..., 2]
    rows = np.arange(crown.shape[0])[:, None]
    low, high = CROWN_ROWS
    gold = (r > GOLD_MIN_RED) & (g > GOLD_MIN_GREEN) & (b < GOLD_MAX_BLUE)
    gold &= (r - b > GOLD_MIN_WARMTH) & (rows > low) & (rows < high)
    gold = ndi.binary_closing(gold, iterations=CROWN_CLOSING)
    gold = largest_components(ndi.binary_fill_holes(gold), 1)
    background = background_mask(crown)
    mask = ndi.binary_dilation(gold, iterations=CROWN_OUTLINE) & ~background
    img, alpha = unmatte(crown, np.ones(background.shape), background)
    save(img, alpha, mask, "occasion-epiphanie")


def landmarks(holes: Mask, split: Split) -> dict[str, object]:
    """Eye and neck positions for the CSS, in percent of the canvas."""
    height, width = holes.shape
    labels, _ = ndi.label(holes)
    eyes = []
    for label in (1, 2):
        x0, y0, x1, y1 = bounding_box(labels == label)
        eyes.append(
            {
                "cx": (x0 + x1) / 2 / width * 100,
                "cy": (y0 + y1) / 2 / height * 100,
                "w": (x1 - x0 + 1) / width * 100,
                "h": (y1 - y0 + 1) / height * 100,
            }
        )
    eyes.sort(key=lambda eye: eye["cx"])
    return {
        "eyes": eyes,
        "pivot": {"x": 50.0, "y": split.cut[width // 2] / height * 100},
        "neck": {"left": split.left, "right": split.right},
        "eye_w_px": eyes[0]["w"] * width / 100,
    }


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    ref = load("ref")
    background = background_mask(ref)
    split = split_head(ref, ~background)

    build_body(ref, background, split)
    holes = build_head("blank", "head-blank", split, eye_holes=True)
    for name, out_name in HEAD_LAYERS.items():
        build_head(name, out_name, split, eye_holes=False)
    # Full picture, for previews and the README
    img, alpha = unmatte(ref, np.ones(background.shape), background)
    save(img, alpha, ~background, "avatar-static")
    build_crown()

    marks = landmarks(holes, split)
    (OUT_DIR / "landmarks.json").write_text(json.dumps(marks, indent=2))
    print(json.dumps(marks, indent=1))


if __name__ == "__main__":
    main()
