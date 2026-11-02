import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AVATAR_CONFIG } from '../../config/avatar.js';
import { randomBetween } from '../../lib/gaze.js';

import { createBlink } from './blink.js';

vi.mock('../../lib/gaze.js', () => ({ randomBetween: vi.fn() }));

describe('blink', () => {
	const DELAY = 3000;
	const isActiveMock = vi.fn();
	const canBlinkMock = vi.fn();
	const randomMock = vi.fn();
	/** @type {HTMLElement} */
	let avatar;

	const create = () =>
		createBlink({
			avatar,
			config: AVATAR_CONFIG,
			isActive: isActiveMock,
			canBlink: canBlinkMock,
			random: randomMock
		});

	beforeEach(() => {
		vi.resetAllMocks();
		vi.restoreAllMocks();
		vi.useFakeTimers();
		isActiveMock.mockReturnValue(true);
		canBlinkMock.mockReturnValue(true);
		vi.mocked(randomBetween).mockReturnValue(DELAY);
		avatar = document.createElement('button');
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('schedule', () => {
		it('should blink after a random delay, then schedule the next blink', () => {
			// Given
			const blink = create();

			// When
			blink.schedule();

			// Then
			expect(randomBetween).toHaveBeenCalledExactlyOnceWith(
				2500,
				6500,
				randomMock
			);
			vi.advanceTimersByTime(DELAY);
			expect(avatar.classList.contains('is-blinking')).toBe(true);
			vi.advanceTimersByTime(AVATAR_CONFIG.blinkDuration);
			expect(avatar.classList.contains('is-blinking')).toBe(false);
			expect(randomBetween).toHaveBeenCalledTimes(2);
		});

		it('should skip the blink but keep the schedule when blinking is not allowed', () => {
			// Given
			canBlinkMock.mockReturnValueOnce(false);
			const blink = create();

			// When
			blink.schedule();

			// Then
			vi.advanceTimersByTime(DELAY);
			expect(avatar.classList.contains('is-blinking')).toBe(false);
			expect(randomBetween).toHaveBeenCalledTimes(2);
		});

		it('should not schedule anything when inactive', () => {
			// Given
			isActiveMock.mockReturnValueOnce(false);
			const blink = create();

			// When
			blink.schedule();

			// Then
			expect(randomBetween).toHaveBeenCalledTimes(0);
			expect(vi.getTimerCount()).toBe(0);
		});
	});

	describe('stop', () => {
		it('should cancel the pending blink', () => {
			// Given
			const blink = create();
			blink.schedule();

			// When
			blink.stop();

			// Then
			expect(vi.getTimerCount()).toBe(0);
		});
	});
});
