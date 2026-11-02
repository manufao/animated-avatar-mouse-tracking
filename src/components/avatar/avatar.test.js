import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AVATAR_CONFIG } from '../../config/avatar.js';
import { maxPupilTravel } from '../../lib/gaze.js';

import { initAvatar } from './avatar.js';
import { createBlink } from './blink.js';
import { createGazeRenderer } from './gaze-renderer.js';
import { createMood } from './mood.js';
import { createPointerTracking } from './pointer-tracking.js';

vi.mock('../../lib/gaze.js', () => ({ maxPupilTravel: vi.fn() }));
vi.mock('./blink.js', () => ({ createBlink: vi.fn() }));
vi.mock('./gaze-renderer.js', () => ({ createGazeRenderer: vi.fn() }));
vi.mock('./mood.js', () => ({ createMood: vi.fn() }));
vi.mock('./pointer-tracking.js', () => ({ createPointerTracking: vi.fn() }));

describe('avatar', () => {
	const TRAVEL = 5;
	const gazeMock = {
		lookAt: vi.fn(),
		request: vi.fn(),
		cancel: vi.fn(),
		reset: vi.fn(),
		setMaxTravel: vi.fn()
	};
	const moodMock = {
		activity: vi.fn(),
		restart: vi.fn(),
		reset: vi.fn(),
		pause: vi.fn(),
		current: vi.fn()
	};
	const blinkMock = { schedule: vi.fn(), stop: vi.fn() };
	const trackingMock = { attach: vi.fn(), detach: vi.fn() };
	const observeMock = vi.fn();
	const addQueryListenerMock = vi.fn();
	const nowMock = vi.fn();
	const randomMock = vi.fn();
	/** @type {HTMLElement} */
	let avatar;
	/** @type {{ matches: boolean, addEventListener: typeof addQueryListenerMock }} */
	let motionQuery;
	/** @type {() => void} */
	let resizeCallback;

	/** @param {object} [options] */
	const init = (options) =>
		initAvatar({
			avatar,
			motionQuery: /** @type {any} */ (motionQuery),
			now: nowMock,
			random: randomMock,
			...options
		});
	/** Fires the reduced-motion change listener. */
	const changeMotion = () => addQueryListenerMock.mock.calls[0][1]();
	/** First argument given to a mocked factory. */
	const optionsOf = (/** @type {any} */ factory) =>
		vi.mocked(factory).mock.calls[0][0];

	beforeEach(() => {
		vi.resetAllMocks();
		vi.restoreAllMocks();
		vi.useFakeTimers();
		vi.spyOn(document, 'addEventListener');
		vi.stubGlobal(
			'ResizeObserver',
			class {
				/** @param {() => void} callback */
				constructor(callback) {
					resizeCallback = callback;
				}
				observe = observeMock;
			}
		);
		vi.mocked(createGazeRenderer).mockReturnValue(gazeMock);
		vi.mocked(createMood).mockReturnValue(/** @type {any} */ (moodMock));
		vi.mocked(createBlink).mockReturnValue(blinkMock);
		vi.mocked(createPointerTracking).mockReturnValue(trackingMock);
		vi.mocked(maxPupilTravel).mockReturnValue(TRAVEL);
		moodMock.current.mockReturnValue('awake');
		motionQuery = { matches: false, addEventListener: addQueryListenerMock };
		avatar = document.createElement('button');
		avatar.innerHTML = `
			<span data-head>
				<span data-eye><span class="pupil"></span></span>
				<span data-eye><span class="pupil"></span></span>
			</span>`;
	});

	afterEach(() => {
		for (const [type, listener] of vi.mocked(document.addEventListener).mock
			.calls) {
			document.removeEventListener(type, listener);
		}
		vi.useRealTimers();
	});

	describe('initAvatar', () => {
		it('should leave the static picture when the head is missing', () => {
			// Given
			avatar.innerHTML = '<span data-eye></span>';

			// When
			const started = init();

			// Then
			expect(started).toBe(false);
			expect(createGazeRenderer).toHaveBeenCalledTimes(0);
		});

		it('should leave the static picture when the eyes are missing', () => {
			// Given
			avatar.innerHTML = '<span data-head></span>';

			// When
			const started = init();

			// Then
			expect(started).toBe(false);
		});

		it('should start tracking, mood and blinks, and measure the eyes', () => {
			// When
			const started = init();

			// Then
			expect(started).toBe(true);
			expect(trackingMock.attach).toHaveBeenCalledTimes(1);
			expect(moodMock.restart).toHaveBeenCalledTimes(1);
			expect(blinkMock.schedule).toHaveBeenCalledTimes(1);
			expect(observeMock).toHaveBeenCalledExactlyOnceWith(avatar);
			expect(maxPupilTravel).toHaveBeenCalledExactlyOnceWith(0, 0, 0.85);
			expect(gazeMock.setMaxTravel).toHaveBeenCalledExactlyOnceWith(TRAVEL);
			expect(trackingMock.detach).toHaveBeenCalledTimes(0);
		});

		it('should wire the parts together', () => {
			// Given
			init();
			const gaze = optionsOf(createGazeRenderer);
			const mood = optionsOf(createMood);
			const blink = optionsOf(createBlink);
			const tracking = optionsOf(createPointerTracking);

			// When
			mood.onBored();
			mood.onWake();

			// Then
			expect(gazeMock.lookAt).toHaveBeenCalledTimes(2);
			expect(gazeMock.lookAt).toHaveBeenCalledWith({ x: 0, y: 0.35 });
			expect(gazeMock.lookAt).toHaveBeenCalledWith({ x: 0, y: 0 });
			expect(gaze.isActive()).toBe(true);
			expect(gaze.isCalm()).toBe(false);
			expect(blink.canBlink()).toBe(true);
			expect(mood.now).toBe(nowMock);
			expect(blink.random).toBe(randomMock);
			expect(tracking).toEqual({
				avatar,
				gaze: gazeMock,
				onActivity: moodMock.activity,
				touchRelease: 800
			});
		});

		it('should use performance.now, Math.random and the default config', () => {
			// When
			initAvatar({ avatar, motionQuery: /** @type {any} */ (motionQuery) });

			// Then
			const mood = optionsOf(createMood);
			expect(mood.now()).toBeTypeOf('number');
			expect(mood.random).toBe(Math.random);
			expect(mood.config).toBe(AVATAR_CONFIG);
		});

		it('should measure with the eye width when the eye has no pupil', () => {
			// Given
			avatar.innerHTML = '<span data-head><span data-eye></span></span>';
			const eye = /** @type {HTMLElement} */ (
				avatar.querySelector('[data-eye]')
			);
			Object.defineProperty(eye, 'clientWidth', { value: 30 });

			// When
			init();

			// Then
			expect(maxPupilTravel).toHaveBeenCalledExactlyOnceWith(30, 30, 0.85);
			expect(optionsOf(createGazeRenderer).pupils).toEqual([]);
		});

		it('should measure again when the avatar is resized', () => {
			// Given
			init();

			// When
			resizeCallback();

			// Then
			expect(gazeMock.setMaxTravel).toHaveBeenCalledTimes(2);
		});

		it('should stay static when the visitor asks for reduced motion', () => {
			// Given
			motionQuery.matches = true;

			// When
			init();

			// Then
			expect(trackingMock.attach).toHaveBeenCalledTimes(0);
			expect(trackingMock.detach).toHaveBeenCalledTimes(1);
			expect(blinkMock.stop).toHaveBeenCalledTimes(1);
			expect(moodMock.reset).toHaveBeenCalledTimes(1);
			expect(gazeMock.reset).toHaveBeenCalledTimes(1);
			expect(optionsOf(createGazeRenderer).isActive()).toBe(false);
		});

		it('should stop when reduced motion is turned on, and restart when it is off', () => {
			// Given
			init();
			motionQuery.matches = true;
			changeMotion();
			motionQuery.matches = false;

			// When
			changeMotion();

			// Then
			expect(trackingMock.detach).toHaveBeenCalledTimes(1);
			expect(trackingMock.attach).toHaveBeenCalledTimes(2);
		});

		it('should not start twice when the motion setting stays off', () => {
			// Given
			init();

			// When
			changeMotion();

			// Then
			expect(trackingMock.attach).toHaveBeenCalledTimes(1);
		});

		it('should look happy for a moment when clicked', () => {
			// Given
			init();

			// When
			avatar.click();

			// Then
			expect(moodMock.activity).toHaveBeenCalledTimes(1);
			expect(avatar.classList.contains('is-happy')).toBe(true);
			vi.advanceTimersByTime(AVATAR_CONFIG.reactDuration);
			expect(avatar.classList.contains('is-happy')).toBe(false);
		});

		it('should not restart the happy face when clicked again during it', () => {
			// Given
			init();
			avatar.click();

			// When
			avatar.click();

			// Then
			expect(moodMock.activity).toHaveBeenCalledTimes(2);
			expect(vi.getTimerCount()).toBe(1);
		});

		it('should pause everything when the page is hidden', () => {
			// Given
			init();
			vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);

			// When
			document.dispatchEvent(new Event('visibilitychange'));

			// Then
			expect(blinkMock.stop).toHaveBeenCalledTimes(1);
			expect(moodMock.pause).toHaveBeenCalledTimes(1);
			expect(gazeMock.cancel).toHaveBeenCalledTimes(1);
			expect(moodMock.restart).toHaveBeenCalledTimes(1);
		});

		it('should wake up and resume when the page is visible again', () => {
			// Given
			init();

			// When
			document.dispatchEvent(new Event('visibilitychange'));

			// Then
			expect(moodMock.restart).toHaveBeenCalledTimes(2);
			expect(blinkMock.schedule).toHaveBeenCalledTimes(2);
			expect(gazeMock.request).toHaveBeenCalledTimes(1);
			expect(blinkMock.stop).toHaveBeenCalledTimes(0);
		});

		it('should stay still when the page is visible again with reduced motion', () => {
			// Given
			motionQuery.matches = true;
			init();

			// When
			document.dispatchEvent(new Event('visibilitychange'));

			// Then
			expect(moodMock.restart).toHaveBeenCalledTimes(0);
			expect(gazeMock.request).toHaveBeenCalledTimes(0);
		});
	});
});
