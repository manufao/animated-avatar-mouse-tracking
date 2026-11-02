import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AVATAR_CONFIG } from '../../config/avatar.js';
import { randomBetween } from '../../lib/gaze.js';

import { createMood } from './mood.js';

vi.mock('../../lib/gaze.js', () => ({ randomBetween: vi.fn() }));

describe('mood', () => {
	const { boredAfter, yawnAfter, yawnDuration } = AVATAR_CONFIG;
	const NEXT_YAWN = 30000;
	const isActiveMock = vi.fn();
	const randomMock = vi.fn();
	const onBoredMock = vi.fn();
	const onWakeMock = vi.fn();
	/** @type {HTMLElement} */
	let avatar;

	const create = () =>
		createMood({
			avatar,
			config: AVATAR_CONFIG,
			isActive: isActiveMock,
			now: () => Date.now(),
			random: randomMock,
			onBored: onBoredMock,
			onWake: onWakeMock
		});
	/** Avatar classes that show the mood. */
	const classes = () => [...avatar.classList];

	beforeEach(() => {
		vi.resetAllMocks();
		vi.restoreAllMocks();
		vi.useFakeTimers();
		isActiveMock.mockReturnValue(true);
		vi.mocked(randomBetween).mockReturnValue(NEXT_YAWN);
		avatar = document.createElement('button');
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('restart', () => {
		it('should get bored after the idle delay', () => {
			// Given
			const mood = create();

			// When
			mood.restart();

			// Then
			vi.advanceTimersByTime(boredAfter);
			expect(mood.current()).toBe('bored');
			expect(classes()).toEqual(['is-bored']);
			expect(onBoredMock).toHaveBeenCalledTimes(1);
			expect(onWakeMock).toHaveBeenCalledTimes(0);
		});

		it('should yawn, go back to bored, then yawn again after a random delay', () => {
			// Given
			const mood = create();

			// When
			mood.restart();

			// Then
			vi.advanceTimersByTime(yawnAfter);
			expect(mood.current()).toBe('yawning');
			expect(classes()).toEqual(['is-bored', 'is-yawning']);
			vi.advanceTimersByTime(yawnDuration);
			expect(mood.current()).toBe('bored');
			expect(randomBetween).toHaveBeenCalledExactlyOnceWith(
				25000,
				40000,
				randomMock
			);
			vi.advanceTimersByTime(NEXT_YAWN);
			expect(mood.current()).toBe('yawning');
		});

		it('should wake up and look ahead when restarted while bored', () => {
			// Given
			const mood = create();
			mood.restart();
			vi.advanceTimersByTime(boredAfter);

			// When
			mood.restart();

			// Then
			expect(mood.current()).toBe('awake');
			expect(classes()).toEqual([]);
			expect(onWakeMock).toHaveBeenCalledTimes(1);
		});

		it('should not get bored while inactive', () => {
			// Given
			isActiveMock.mockReturnValue(false);
			const mood = create();

			// When
			mood.restart();

			// Then
			vi.advanceTimersByTime(boredAfter);
			expect(mood.current()).toBe('awake');
			expect(onBoredMock).toHaveBeenCalledTimes(0);
		});

		it('should not yawn when it became inactive while bored', () => {
			// Given
			const mood = create();
			mood.restart();
			vi.advanceTimersByTime(boredAfter);
			isActiveMock.mockReturnValue(false);

			// When
			vi.advanceTimersByTime(yawnAfter);

			// Then
			expect(mood.current()).toBe('bored');
		});
	});

	describe('activity', () => {
		it('should only push back the bored face while awake', () => {
			// Given
			const mood = create();
			mood.restart();
			vi.advanceTimersByTime(boredAfter - 1000);

			// When
			mood.activity();

			// Then
			vi.advanceTimersByTime(1000);
			expect(mood.current()).toBe('awake');
			vi.advanceTimersByTime(boredAfter - 1000);
			expect(mood.current()).toBe('bored');
			expect(onWakeMock).toHaveBeenCalledTimes(0);
		});

		it('should wake up and cancel the yawn when bored', () => {
			// Given
			const mood = create();
			mood.restart();
			vi.advanceTimersByTime(boredAfter);

			// When
			mood.activity();

			// Then
			expect(mood.current()).toBe('awake');
			expect(onWakeMock).toHaveBeenCalledTimes(1);
			vi.advanceTimersByTime(boredAfter - 1);
			expect(mood.current()).toBe('awake');
		});
	});

	describe('pause', () => {
		it('should stop every mood timer', () => {
			// Given
			const mood = create();
			mood.restart();

			// When
			mood.pause();

			// Then
			expect(vi.getTimerCount()).toBe(0);
		});
	});

	describe('reset', () => {
		it('should stop the timers and come back to the awake face', () => {
			// Given
			const mood = create();
			mood.restart();
			vi.advanceTimersByTime(yawnAfter);

			// When
			mood.reset();

			// Then
			expect(vi.getTimerCount()).toBe(0);
			expect(mood.current()).toBe('awake');
			expect(classes()).toEqual([]);
			expect(onWakeMock).toHaveBeenCalledTimes(0);
		});
	});
});
