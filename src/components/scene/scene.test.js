import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { REFRESH_MS } from '../../config/scene.js';
import { OCCASIONS } from '../../data/occasions.js';
import { createMonthDayReader, findOccasion } from '../../lib/calendar.js';
import { phaseAt } from '../../lib/sun.js';

import { createLamp } from './lamp.js';
import { createOccasionLayer } from './occasion-layer.js';
import { initScene } from './scene.js';
import { initSceneChoices } from './scene-choices.js';

vi.mock('../../lib/calendar.js', () => ({
	createMonthDayReader: vi.fn(),
	findOccasion: vi.fn()
}));
vi.mock('../../lib/sun.js', () => ({ phaseAt: vi.fn() }));
vi.mock('./lamp.js', () => ({ createLamp: vi.fn() }));
vi.mock('./occasion-layer.js', () => ({ createOccasionLayer: vi.fn() }));
vi.mock('./scene-choices.js', () => ({ initSceneChoices: vi.fn() }));

describe('scene', () => {
	const root = document.documentElement;
	const NOW = new Date('2026-01-06T12:00:00Z');
	const OCCASION = Symbol('occasionMock');
	const setLightMock = vi.fn();
	const updateLabelMock = vi.fn();
	const applyOccasionMock = vi.fn();
	const monthDayMock = vi.fn();
	const phaseOfMock = vi.fn();
	const clockMock = vi.fn();

	/** Visitor override callback given to the choices. */
	const chooseCallback = () => vi.mocked(initSceneChoices).mock.calls[0][1];

	beforeEach(() => {
		vi.resetAllMocks();
		vi.restoreAllMocks();
		vi.useFakeTimers();
		// Recorded so each test starts without the listeners of the previous one
		vi.spyOn(document, 'addEventListener');
		vi.stubGlobal('requestAnimationFrame', (/** @type {() => void} */ cb) => {
			cb();
			return 1;
		});
		delete root.dataset.light;
		delete root.dataset.scene;
		delete root.dataset.sceneReady;
		vi.mocked(createLamp).mockReturnValue({
			setLight: setLightMock,
			updateLabel: updateLabelMock
		});
		vi.mocked(createOccasionLayer).mockReturnValue(applyOccasionMock);
		vi.mocked(createMonthDayReader).mockReturnValue(monthDayMock);
		vi.mocked(findOccasion).mockReturnValue(/** @type {any} */ (OCCASION));
		monthDayMock.mockReturnValue('01-06');
		phaseOfMock.mockReturnValue('day');
		clockMock.mockReturnValue(NOW);
	});

	afterEach(() => {
		for (const [type, listener] of vi.mocked(document.addEventListener).mock
			.calls) {
			document.removeEventListener(type, listener);
		}
		vi.useRealTimers();
	});

	describe('initScene', () => {
		it('should show the Paris phase, the occasion and mark the scene ready', () => {
			// When
			initScene({ clock: clockMock, phaseOf: phaseOfMock });

			// Then
			expect(phaseOfMock).toHaveBeenCalledExactlyOnceWith(NOW, 48.8566, 2.3522);
			expect(root.dataset.scene).toBe('day');
			expect(setLightMock).toHaveBeenCalledExactlyOnceWith(false);
			expect(updateLabelMock).toHaveBeenCalledTimes(1);
			expect(createMonthDayReader).toHaveBeenCalledExactlyOnceWith(
				'Europe/Paris'
			);
			expect(findOccasion).toHaveBeenCalledExactlyOnceWith(OCCASIONS, '01-06');
			expect(applyOccasionMock).toHaveBeenCalledExactlyOnceWith(OCCASION);
			expect(root.dataset.sceneReady).toBe('');
		});

		it('should use the current date and the sun position by default', () => {
			// Given
			vi.setSystemTime(NOW);
			vi.mocked(phaseAt).mockReturnValueOnce('dusk');

			// When
			initScene();

			// Then
			expect(phaseAt).toHaveBeenCalledExactlyOnceWith(NOW, 48.8566, 2.3522);
			expect(root.dataset.scene).toBe('dusk');
		});

		it('should switch the lamp off when the light is on outside the night', () => {
			// Given
			root.dataset.light = 'on';

			// When
			initScene({ clock: clockMock, phaseOf: phaseOfMock });

			// Then
			expect(setLightMock).toHaveBeenCalledTimes(2);
			expect(setLightMock).toHaveBeenLastCalledWith(false);
		});

		it('should keep the light on at night', () => {
			// Given
			root.dataset.light = 'on';
			phaseOfMock.mockReturnValueOnce('night');

			// When
			initScene({ clock: clockMock, phaseOf: phaseOfMock });

			// Then
			expect(root.dataset.scene).toBe('night');
			expect(setLightMock).toHaveBeenCalledTimes(1);
		});

		it('should fall back to the day scene without light when anything fails', () => {
			// Given
			root.dataset.light = 'on';
			phaseOfMock.mockImplementationOnce(() => {
				throw new Error('broken');
			});

			// When
			initScene({ clock: clockMock, phaseOf: phaseOfMock });

			// Then
			expect(root.dataset.scene).toBe('day');
			expect(root.dataset.light).toBeUndefined();
			expect(updateLabelMock).toHaveBeenCalledTimes(1);
			expect(applyOccasionMock).toHaveBeenCalledTimes(0);
		});

		it('should use the phase forced by the visitor', () => {
			// Given
			initScene({ clock: clockMock, phaseOf: phaseOfMock, occasions: [] });

			// When
			chooseCallback()('night');

			// Then
			expect(root.dataset.scene).toBe('night');
			expect(phaseOfMock).toHaveBeenCalledTimes(1);
			expect(findOccasion).toHaveBeenLastCalledWith([], '01-06');
		});

		it('should refresh the scene every minute while visible', () => {
			// Given
			initScene({ clock: clockMock, phaseOf: phaseOfMock });

			// When
			vi.advanceTimersByTime(REFRESH_MS);

			// Then
			expect(phaseOfMock).toHaveBeenCalledTimes(2);
		});

		it('should refresh the scene when the page becomes visible again', () => {
			// Given
			initScene({ clock: clockMock, phaseOf: phaseOfMock });

			// When
			document.dispatchEvent(new Event('visibilitychange'));

			// Then
			expect(phaseOfMock).toHaveBeenCalledTimes(2);
		});

		it('should not refresh the scene while the page is hidden', () => {
			// Given
			vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
			initScene({ clock: clockMock, phaseOf: phaseOfMock });

			// When
			vi.advanceTimersByTime(REFRESH_MS);

			// Then
			expect(phaseOfMock).toHaveBeenCalledTimes(1);
		});
	});
});
