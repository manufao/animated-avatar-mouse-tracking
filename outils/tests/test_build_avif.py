from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from build_avif import LAYERS, convert, to_avif

LAYER_SIZE = (720, 960)
ALPHA_TOLERANCE = 5  # out of 255: lossy compression may blur an edge


def write_webp(path: Path, colour: tuple[int, int, int, int]) -> None:
    Image.new("RGBA", LAYER_SIZE, colour).save(path, lossless=True)


@pytest.fixture
def layers_dir(tmp_path: Path) -> Path:
    for name in LAYERS:
        write_webp(tmp_path / f"{name}.webp", (200, 120, 90, 255))
    return tmp_path


class TestToAvif:
    def test_should_keep_the_size_and_the_transparency(self, tmp_path: Path) -> None:
        # Given
        source = tmp_path / "layer.webp"
        picture = Image.new("RGBA", (64, 64), (200, 120, 90, 255))
        picture.paste((0, 0, 0, 0), (0, 0, 32, 64))  # transparent left half
        picture.save(source, lossless=True)
        target = tmp_path / "layer.avif"

        # When
        to_avif(source, target)

        # Then
        with Image.open(target) as avif:
            alpha = np.asarray(avif.convert("RGBA"))[..., 3]
            assert avif.size == (64, 64)
        assert alpha[:, :16].max() <= ALPHA_TOLERANCE
        assert alpha[:, 48:].min() >= 255 - ALPHA_TOLERANCE


class TestConvert:
    def test_should_write_an_avif_next_to_every_webp(self, layers_dir: Path) -> None:
        # When
        sizes = convert(layers_dir)

        # Then
        assert list(sizes) == list(LAYERS)
        for name, (webp, avif) in sizes.items():
            assert (layers_dir / f"{name}.avif").stat().st_size == avif
            assert (layers_dir / f"{name}.webp").stat().st_size == webp
