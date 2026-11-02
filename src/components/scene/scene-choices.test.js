import { beforeEach, describe, expect, it, vi } from 'vitest';

import { initSceneChoices, toForcedPhase } from './scene-choices.js';

describe('scene-choices', () => {
	const onChooseMock = vi.fn();
	/** @type {HTMLElement} */
	let group;

	/** @param {string} choice */
	const button = (choice) => {
		const el = group.querySelector(`[data-scene-choice="${choice}"]`);
		if (!(el instanceof HTMLElement)) {
			throw new Error(`missing ${choice} button`);
		}
		return el;
	};

	beforeEach(() => {
		vi.resetAllMocks();
		vi.restoreAllMocks();
		group = document.createElement('div');
		group.hidden = true;
		group.innerHTML = `
			<button data-scene-choice="auto" aria-pressed="true">Heure de Paris</button>
			<button data-scene-choice="day" aria-pressed="false">Jour</button>
			<button data-scene-choice="night" aria-pressed="false">Nuit</button>`;
	});

	describe('toForcedPhase', () => {
		it('should force the day', () => {
			// When / Then
			expect(toForcedPhase('day')).toBe('day');
		});

		it('should force the night', () => {
			// When / Then
			expect(toForcedPhase('night')).toBe('night');
		});

		it('should follow Paris daylight for any other choice', () => {
			// When / Then
			expect(toForcedPhase('noon')).toBeNull();
		});
	});

	describe('initSceneChoices', () => {
		it('should do nothing when the page has no choices', () => {
			// When / Then
			expect(() => initSceneChoices(null, onChooseMock)).not.toThrow();
		});

		it('should show the choices', () => {
			// When
			initSceneChoices(group, onChooseMock);

			// Then
			expect(group.hidden).toBe(false);
			expect(onChooseMock).toHaveBeenCalledTimes(0);
		});

		it('should force the night and press its button when night is clicked', () => {
			// Given
			initSceneChoices(group, onChooseMock);

			// When
			button('night').click();

			// Then
			expect(onChooseMock).toHaveBeenCalledExactlyOnceWith('night');
			expect(button('night').getAttribute('aria-pressed')).toBe('true');
			expect(button('auto').getAttribute('aria-pressed')).toBe('false');
		});

		it('should follow Paris daylight and press auto when auto is clicked', () => {
			// Given
			initSceneChoices(group, onChooseMock);
			button('day').click();

			// When
			button('auto').click();

			// Then
			expect(onChooseMock).toHaveBeenLastCalledWith(null);
			expect(button('auto').getAttribute('aria-pressed')).toBe('true');
			expect(button('day').getAttribute('aria-pressed')).toBe('false');
		});
	});
});
