import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AVATAR_CONFIG } from '../../config/avatar.js';
import {
	easeToward,
	headTransform,
	isSettled,
	pupilTransform
} from '../../lib/gaze.js';

import { createGazeRenderer } from './gaze-renderer.js';

vi.mock('../../lib/gaze.js', () => ({
	easeToward: vi.fn(),
	headTransform: vi.fn(),
	isSettled: vi.fn(),
	pupilTransform: vi.fn()
}));

describe('gaze-renderer', () => {
	const FRAME_ID = 7;
	const CENTER = { x: 0, y: 0 };
	const EASED = { x: 0.1, y: 0 };
	const requestFrameMock = vi.fn();
	const cancelFrameMock = vi.fn();
	const isActiveMock = vi.fn();
	const isCalmMock = vi.fn();
	/** @type {HTMLElement} */
	let head;
	/** @type {HTMLElement[]} */
	let pupils;

	const create = () =>
		createGazeRenderer({
			head,
			pupils,
			config: AVATAR_CONFIG,
			isActive: isActiveMock,
			isCalm: isCalmMock
		});
	/** Runs the frame callback given to the last requestAnimationFrame call. */
	const runFrame = () => requestFrameMock.mock.lastCall?.[0]();

	beforeEach(() => {
		vi.resetAllMocks();
		vi.restoreAllMocks();
		vi.stubGlobal('requestAnimationFrame', requestFrameMock);
		vi.stubGlobal('cancelAnimationFrame', cancelFrameMock);
		requestFrameMock.mockReturnValue(FRAME_ID);
		isActiveMock.mockReturnValue(true);
		isCalmMock.mockReturnValue(false);
		vi.mocked(easeToward).mockReturnValue(EASED);
		vi.mocked(isSettled).mockReturnValue(true);
		vi.mocked(pupilTransform).mockReturnValue('translate(1px, 2px)');
		vi.mocked(headTransform).mockReturnValue('rotate(3deg)');
		head = document.createElement('span');
		pupils = [document.createElement('span'), document.createElement('span')];
	});

	describe('lookAt', () => {
		it('should request one frame when active', () => {
			// Given
			const gaze = create();

			// When
			gaze.lookAt({ x: 1, y: 0 });

			// Then
			expect(requestFrameMock).toHaveBeenCalledTimes(1);
		});

		it('should not request a second frame while one is pending', () => {
			// Given
			const gaze = create();
			gaze.lookAt({ x: 1, y: 0 });

			// When
			gaze.lookAt({ x: 0, y: 1 });

			// Then
			expect(requestFrameMock).toHaveBeenCalledTimes(1);
		});

		it('should not request a frame when inactive', () => {
			// Given
			isActiveMock.mockReturnValueOnce(false);
			const gaze = create();

			// When
			gaze.lookAt({ x: 1, y: 0 });

			// Then
			expect(requestFrameMock).toHaveBeenCalledTimes(0);
		});
	});

	describe('render', () => {
		it('should ease with the awake smoothing and move pupils and head', () => {
			// Given
			const gaze = create();
			gaze.setMaxTravel(4);
			gaze.lookAt({ x: 1, y: 0 });

			// When
			runFrame();

			// Then
			expect(easeToward).toHaveBeenCalledExactlyOnceWith(
				CENTER,
				{ x: 1, y: 0 },
				0.12
			);
			expect(pupilTransform).toHaveBeenCalledExactlyOnceWith(EASED, 4);
			expect(headTransform).toHaveBeenCalledExactlyOnceWith(EASED, 4, 3);
			expect(pupils.map((p) => p.style.transform)).toEqual([
				'translate(1px, 2px)',
				'translate(1px, 2px)'
			]);
			expect(head.style.transform).toBe('rotate(3deg)');
			expect(requestFrameMock).toHaveBeenCalledTimes(1);
		});

		it('should ease with the bored smoothing and keep animating until settled', () => {
			// Given
			isCalmMock.mockReturnValueOnce(true);
			vi.mocked(isSettled).mockReturnValueOnce(false);
			const gaze = create();
			gaze.lookAt({ x: 0, y: 0.35 });

			// When
			runFrame();

			// Then
			expect(easeToward).toHaveBeenCalledExactlyOnceWith(
				CENTER,
				{ x: 0, y: 0.35 },
				0.04
			);
			expect(requestFrameMock).toHaveBeenCalledTimes(2);
		});
	});

	describe('request', () => {
		it('should request a frame again after a cancel', () => {
			// Given
			const gaze = create();
			gaze.lookAt({ x: 1, y: 0 });
			gaze.cancel();

			// When
			gaze.request();

			// Then
			expect(cancelFrameMock).toHaveBeenCalledExactlyOnceWith(FRAME_ID);
			expect(requestFrameMock).toHaveBeenCalledTimes(2);
		});
	});

	describe('reset', () => {
		it('should cancel the frame, clear the transforms and recenter', () => {
			// Given
			const gaze = create();
			gaze.lookAt({ x: 1, y: 0 });
			runFrame();

			// When
			gaze.reset();

			// Then
			expect(cancelFrameMock).toHaveBeenCalledExactlyOnceWith(0);
			expect(head.style.transform).toBe('');
			expect(pupils.map((p) => p.style.transform)).toEqual(['', '']);
			gaze.request();
			runFrame();
			expect(easeToward).toHaveBeenLastCalledWith(CENTER, CENTER, 0.12);
		});
	});
});
