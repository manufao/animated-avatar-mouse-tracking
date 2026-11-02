from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from build_layers import SOURCE_SIZE, Split, landmarks, load


def write_jpg(path: Path, size: tuple[int, int]) -> None:
    Image.new("RGB", size, (200, 100, 50)).save(path)


class TestLoad:
    def test_should_return_the_picture_as_float_rgb(self, tmp_path: Path) -> None:
        # Given
        write_jpg(tmp_path / "ref.jpg", SOURCE_SIZE)

        # When
        img = load("ref", tmp_path)

        # Then
        width, height = SOURCE_SIZE
        assert img.shape == (height, width, 3)
        assert img.dtype == np.float64

    def test_should_raise_when_the_picture_is_missing(self, tmp_path: Path) -> None:
        # When / Then
        with pytest.raises(FileNotFoundError, match="missing source picture"):
            load("ref", tmp_path)

    def test_should_raise_when_the_picture_has_another_size(
        self, tmp_path: Path
    ) -> None:
        # Given
        write_jpg(tmp_path / "ref.jpg", (100, 50))

        # When / Then
        with pytest.raises(ValueError, match=r"ref\.jpg: expected 1792 x 2400"):
            load("ref", tmp_path)


class TestLandmarks:
    def test_should_return_eyes_from_left_to_right_and_the_pivot(self) -> None:
        # Given
        holes = np.zeros((10, 20), dtype=bool)
        holes[2:4, 12:16] = True  # right eye, labelled first
        holes[5:7, 2:6] = True  # left eye
        cut = np.full(20, 8)
        split = Split(cut, np.zeros((10, 20), dtype=bool), holes, 4, 15)

        # When
        marks = landmarks(holes, split)

        # Then
        assert marks["eyes"] == [
            pytest.approx({"cx": 17.5, "cy": 55.0, "w": 20.0, "h": 20.0}),
            pytest.approx({"cx": 67.5, "cy": 25.0, "w": 20.0, "h": 20.0}),
        ]
        assert marks["pivot"] == {"x": 50.0, "y": 80.0}
        assert marks["neck"] == {"left": 4, "right": 15}
        assert marks["eye_w_px"] == pytest.approx(4.0)
