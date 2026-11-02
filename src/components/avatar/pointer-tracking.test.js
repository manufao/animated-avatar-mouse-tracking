import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { centerOf, gazeToward } from '../../lib/gaze.js';

import { createPointerTracking } from './pointer-tracking.js';

vi.mock('../../lib/gaze.js', () => ({
	centerOf: vi.fn(),
	gazeToward: vi.fn()
}));

describe('pointer-tracking', () => {
	const TOUCH_RELEASE = 800;
	const CENTER = { x: 0, y: 0 };
	const GAZE = Symbol('gazeMock');
	const LINK_CENTER = Symbol('linkCenterMock');
	const lookAtMock = vi.fn();
	const onActivityMock = vi.fn();
	/** @type {HTMLElement} */
	let avatar;
	/** @type {ReturnType<typeof createPointerTracking>} */
	let tracking;

	/**
	 * @param {string} type
	 * @param {PointerEventInit} [init]
	 */
	const pointer = (type, init) =>
		window.dispatchEvent(
			new PointerEvent(type, { clientX: 10, clientY: 20, ...init })
		);

	beforeEach(() => {
		vi.resetAllMocks();
		vi.restoreAllMocks();
		vi.useFakeTimers();
		vi.mocked(gazeToward).mockReturnValue(/** @type {any} */ (GAZE));
		vi.mocked(centerOf).mockReturnValue(/** @type {any} */ (LINK_CENTER));
		document.body.innerHTML =
			'<button data-avatar></button><a href="#top">Top</a><p>Text</p>';
		avatar = /** @type {HTMLElement} */ (
			document.querySelector('[data-avatar]')
		);
		tracking = createPointerTracking({
			avatar,
			gaze: { lookAt: lookAtMock },
			onActivity: onActivityMock,
			touchRelease: TOUCH_RELEASE
		});
		tracking.attach();
	});

	afterEach(() => {
		tracking.detach();
		vi.useRealTimers();
	});

	describe('attach', () => {
		it('should look at the pointer when it moves', () => {
			// When
			pointer('pointermove');

			// Then
			expect(onActivityMock).toHaveBeenCalledTimes(1);
			expect(gazeToward).toHaveBeenCalledExactlyOnceWith(
				{ x: 10, y: 20 },
				avatar.getBoundingClientRect(),
				{ width: window.innerWidth, height: window.innerHeight }
			);
			expect(lookAtMock).toHaveBeenCalledExactlyOnceWith(GAZE);
		});

		it('should look at a touch and cancel the pending recentering', () => {
			// Given
			pointer('pointerup', { pointerType: 'touch' });

			// When
			pointer('pointerdown', { pointerType: 'touch' });

			// Then
			vi.advanceTimersByTime(TOUCH_RELEASE);
			expect(onActivityMock).toHaveBeenCalledTimes(1);
			expect(lookAtMock).toHaveBeenCalledExactlyOnceWith(GAZE);
		});

		it('should recenter a while after a touch ends', () => {
			// When
			pointer('pointerup', { pointerType: 'touch' });

			// Then
			expect(lookAtMock).toHaveBeenCalledTimes(0);
			vi.advanceTimersByTime(TOUCH_RELEASE);
			expect(lookAtMock).toHaveBeenCalledExactlyOnceWith(CENTER);
		});

		it('should keep looking at the mouse when its button is released', () => {
			// When
			pointer('pointerup', { pointerType: 'mouse' });

			// Then
			vi.advanceTimersByTime(TOUCH_RELEASE);
			expect(lookAtMock).toHaveBeenCalledTimes(0);
		});

		it('should recenter when the mouse leaves the window', () => {
			// When
			document.body.dispatchEvent(
				new MouseEvent('mouseout', { bubbles: true })
			);

			// Then
			expect(lookAtMock).toHaveBeenCalledExactlyOnceWith(CENTER);
		});

		it('should keep looking when the mouse moves to another element', () => {
			// When
			document.body.dispatchEvent(
				new MouseEvent('mouseout', { bubbles: true, relatedTarget: avatar })
			);

			// Then
			expect(lookAtMock).toHaveBeenCalledTimes(0);
		});

		it('should look at a focused link', () => {
			// Given
			const link = /** @type {HTMLElement} */ (document.querySelector('a'));

			// When
			link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

			// Then
			expect(onActivityMock).toHaveBeenCalledTimes(1);
			expect(centerOf).toHaveBeenCalledExactlyOnceWith(
				link.getBoundingClientRect()
			);
			expect(gazeToward).toHaveBeenCalledWith(
				LINK_CENTER,
				expect.anything(),
				expect.anything()
			);
			expect(lookAtMock).toHaveBeenCalledExactlyOnceWith(GAZE);
		});

		it('should not look at itself when the avatar gets the focus', () => {
			// When
			avatar.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

			// Then
			expect(onActivityMock).toHaveBeenCalledTimes(1);
			expect(lookAtMock).toHaveBeenCalledTimes(0);
		});

		it('should not move the gaze for a focus outside links and buttons', () => {
			// When
			document
				.querySelector('p')
				?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

			// Then
			expect(lookAtMock).toHaveBeenCalledTimes(0);
		});

		it('should not move the gaze when the focus target is not an element', () => {
			// When
			document.dispatchEvent(new FocusEvent('focusin'));

			// Then
			expect(onActivityMock).toHaveBeenCalledTimes(1);
			expect(lookAtMock).toHaveBeenCalledTimes(0);
		});

		it('should count a key press as activity', () => {
			// When
			document.dispatchEvent(new KeyboardEvent('keydown'));

			// Then
			expect(onActivityMock).toHaveBeenCalledTimes(1);
			expect(lookAtMock).toHaveBeenCalledTimes(0);
		});
	});

	describe('detach', () => {
		it('should stop reacting and cancel the pending recentering', () => {
			// Given
			pointer('pointerup', { pointerType: 'touch' });

			// When
			tracking.detach();

			// Then
			pointer('pointermove');
			document.dispatchEvent(new KeyboardEvent('keydown'));
			vi.advanceTimersByTime(TOUCH_RELEASE);
			expect(onActivityMock).toHaveBeenCalledTimes(0);
			expect(lookAtMock).toHaveBeenCalledTimes(0);
		});
	});
});
