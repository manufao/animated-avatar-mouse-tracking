import numpy as np
import pytest

from masks import background_mask, bounding_box, largest_components, unmatte

WHITE = 255.0
INK = 40.0


def picture(rows: list[str]) -> np.ndarray:
    """RGB picture from a drawing: '.' is white, '#' is dark ink."""
    grid = np.array([[WHITE if c == "." else INK for c in row] for row in rows])
    return np.repeat(grid[..., None], 3, axis=2)


def mask(rows: list[str]) -> np.ndarray:
    """Boolean mask from a drawing: '#' is True."""
    return np.array([[c == "#" for c in row] for row in rows])


class TestBackgroundMask:
    def test_should_keep_only_the_white_connected_to_the_border(self) -> None:
        # Given
        img = picture(
            [
                ".....",
                ".###.",
                ".#.#.",
                ".###.",
                ".....",
            ]
        )

        # When
        background = background_mask(img)

        # Then
        expected = ~mask(
            [
                ".....",
                ".###.",
                ".###.",
                ".###.",
                ".....",
            ]
        )
        np.testing.assert_array_equal(background, expected)

    def test_should_return_no_background_when_the_border_is_dark(self) -> None:
        # Given
        img = picture(["###", "#.#", "###"])

        # When
        background = background_mask(img)

        # Then
        assert not background.any()


class TestUnmatte:
    def test_should_soften_only_the_pixels_around_the_hole(self) -> None:
        # Given
        img = np.full((1, 6, 3), 255.0)
        img[0, 1:] = [160.0, 120.0, 100.0]
        alpha = np.ones((1, 6))
        hole = np.array([[True, False, False, False, False, False]])

        # When
        out, out_alpha = unmatte(img, alpha, hole)

        # Then
        edge = (255.0 - (160.0 + 120.0 + 100.0) / 3) / (255.0 - 60.0)
        np.testing.assert_allclose(out_alpha[0], [1, edge, edge, edge, 1, 1])
        recovered = (np.array([160.0, 120.0, 100.0]) - (1 - edge) * 255) / edge
        np.testing.assert_allclose(out[0, 1], recovered.clip(0, 255))
        np.testing.assert_array_equal(out[0, 4], img[0, 4])
        np.testing.assert_array_equal(alpha, np.ones((1, 6)))

    def test_should_keep_the_lower_existing_alpha(self) -> None:
        # Given
        img = np.full((1, 2, 3), 60.0)
        alpha = np.array([[1.0, 0.2]])
        hole = np.array([[True, False]])

        # When
        _, out_alpha = unmatte(img, alpha, hole)

        # Then
        np.testing.assert_allclose(out_alpha, [[1.0, 0.2]])


class TestLargestComponents:
    def test_should_keep_the_largest_regions(self) -> None:
        # Given
        regions = mask(["##.#.###"])

        # When
        kept = largest_components(regions, 2)

        # Then
        np.testing.assert_array_equal(kept, mask(["##...###"]))

    def test_should_raise_when_there_are_too_few_regions(self) -> None:
        # When / Then
        with pytest.raises(ValueError, match="expected at least 2 regions, found 1"):
            largest_components(mask(["##.."]), 2)


class TestBoundingBox:
    def test_should_return_the_inclusive_box_of_the_mask(self) -> None:
        # Given
        drawing = mask(["....", ".#..", "..#.", "...."])

        # When
        box = bounding_box(drawing)

        # Then
        assert box == (1, 1, 2, 2)

    def test_should_raise_when_the_mask_is_empty(self) -> None:
        # When / Then
        with pytest.raises(ValueError, match="the mask is empty"):
            bounding_box(mask(["..", ".."]))
