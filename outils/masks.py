"""Mask and matting helpers for the avatar layers. Pure numpy functions."""

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi

type RGB = NDArray[np.float64]  # height x width x 3, 0..255
type Alpha = NDArray[np.float64]  # height x width, 0..1
type Mask = NDArray[np.bool_]  # height x width

WHITE_MIN = 232  # background: every channel above this value
OUTLINE_LUM = 60.0  # luminance of the dark outline, for edge un-matting
EDGE_WIDTH = 3  # pixels around a removed area whose colour is recovered


def background_mask(img: RGB, white_min: int = WHITE_MIN) -> Mask:
    """Near-white regions connected to the image border."""
    labels, _ = ndi.label(img.min(axis=2) > white_min)
    edges = np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])
    return np.isin(labels, np.setdiff1d(edges, [0]))


def unmatte(img: RGB, alpha: Alpha, hole: Mask) -> tuple[RGB, Alpha]:
    """Soften the edges around a removed white area.

    Edge pixels next to `hole` get their alpha from their lightness, and their
    colour is recovered as if they had been composited over white.
    """
    near = ndi.binary_dilation(hole, iterations=EDGE_WIDTH) & ~hole
    lightness = np.clip((255.0 - img.mean(axis=2)) / (255.0 - OUTLINE_LUM), 0.0, 1.0)
    alpha = alpha.copy()
    alpha[near] = np.minimum(alpha[near], lightness[near])
    safe = np.maximum(alpha, 1e-3)[..., None]
    recovered = np.clip((img - (1.0 - alpha[..., None]) * 255.0) / safe, 0, 255)
    out = img.copy()
    out[near] = recovered[near]
    return out, alpha


def largest_components(mask: Mask, count: int) -> Mask:
    """The `count` largest connected regions of `mask`."""
    labels, found = ndi.label(mask)
    if found < count:
        message = f"expected at least {count} regions, found {found}"
        raise ValueError(message)
    sizes = ndi.sum(mask, labels, range(1, found + 1))
    keep = np.argsort(sizes)[::-1][:count] + 1
    return np.isin(labels, keep)


def bounding_box(mask: Mask) -> tuple[int, int, int, int]:
    """Inclusive (left, top, right, bottom) box of the `True` pixels."""
    ys, xs = np.nonzero(mask)
    if xs.size == 0:
        message = "the mask is empty"
        raise ValueError(message)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
