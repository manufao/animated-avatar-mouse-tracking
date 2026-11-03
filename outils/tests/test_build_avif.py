from pathlib import Path

import numpy as np
import pytest
from PIL import Image

import build_avif
from build_avif import LAYERS, convert, over_backdrop, preview, psnr, to_avif

LAYER_SIZE = (720, 960)
ALPHA_TOLERANCE = 5  # out of 255: lossy compression may blur an edge


def write_webp(path: Path, colour: tuple[int, int, int, int]) -> None:
    Image.new("RGBA", LAYER_SIZE, colour).save(path, lossless=True)


@pytest.fixture
def layers_dir(tmp_path: Path) -> Path:
    for name in LAYERS:
        write_webp(tmp_path / f"{name}.webp", (200, 120, 90, 255))
    return tmp_path


class TestPsnr:
    def test_should_return_infinity_for_identical_pictures(self) -> None:
        # Given
        picture = np.full((4, 4, 3), 100, dtype=np.uint8)

        # When
        score = psnr(picture, picture)

        # Then
        assert score == float("inf")

    def test_should_return_the_ratio_in_decibels_for_a_known_error(self) -> None:
        # Given
        a = np.full((4, 4, 3), 100, dtype=np.uint8)
        b = np.full((4, 4, 3), 101, dtype=np.uint8)

        # When
        score = psnr(a, b)

        # Then
        assert score == pytest.approx(10 * np.log10(255**2))


class TestOverBackdrop:
    def test_should_show_the_backdrop_through_transparent_pixels(self) -> None:
        # Given
        layer = Image.new("RGBA", (2, 2), (255, 0, 0, 0))

        # When
        flat = over_backdrop(layer)

        # Then
        assert flat.mode == "RGB"
        assert flat.getpixel((0, 0)) == build_avif.BACKDROP


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


class TestPreview:
    def test_should_write_the_comparison_sheet(self, layers_dir: Path) -> None:
        # Given
        convert(layers_dir)
        sheet = layers_dir / "out" / "preview.png"

        # When
        preview(layers_dir, sheet)

        # Then
        with Image.open(sheet) as image:
            assert image.format == "PNG"
            assert image.width > image.height / 2
