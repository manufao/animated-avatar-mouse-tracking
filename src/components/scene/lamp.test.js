import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { chainLabel, createLamp } from './lamp.js';

describe('lamp', () => {
	const PULL_MS = 1500;
	/** @type {HTMLElement} */
	let root;
	/** @type {HTMLElement} */
	let lamp;
	/** @type {HTMLButtonElement} */
	let chain;

	beforeEach(() => {
		vi.useFakeTimers();
		root = document.createElement('div');
		root.dataset.scene = 'day';
		lamp = document.createElement('div');
		chain = document.createElement('button');
		chain.dataset.lightToggle = '';
		lamp.append(chain);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('chainLabel', () => {
		it('should explain that the light only works at night during the day', () => {
			// When
			const label = chainLabel(false, false);

			// Then
			expect(label).toBe(
				"Tirer la chaînette : la lumière ne s'allume que la nuit"
			);
		});

		it('should offer to switch the light off when it is on at night', () => {
			// When
			const label = chainLabel(true, true);

			// Then
			expect(label).toBe('Éteindre la lumière');
		});

		it('should offer to switch the light on when it is off at night', () => {
			// When
			const label = chainLabel(true, false);

			// Then
			expect(label).toBe('Allumer la lumière');
		});
	});

	describe('createLamp', () => {
		it('should switch the light on and update the chain at night', () => {
			// Given
			root.dataset.scene = 'night';
			const { setLight } = createLamp({ root, lamp, pullMs: PULL_MS });

			// When
			setLight(true);

			// Then
			expect(root.dataset.light).toBe('on');
			expect(chain.getAttribute('aria-pressed')).toBe('true');
			expect(chain.getAttribute('aria-disabled')).toBe('false');
			expect(chain.getAttribute('aria-label')).toBe('Éteindre la lumière');
		});

		it('should switch the light off and disable the chain during the day', () => {
			// Given
			root.dataset.light = 'on';
			const { setLight } = createLamp({ root, lamp, pullMs: PULL_MS });

			// When
			setLight(false);

			// Then
			expect(root.dataset.light).toBeUndefined();
			expect(chain.getAttribute('aria-pressed')).toBe('false');
			expect(chain.getAttribute('aria-disabled')).toBe('true');
		});

		it('should still switch the light when the page has no lamp', () => {
			// Given
			const { setLight, updateLabel } = createLamp({
				root,
				lamp: null,
				pullMs: PULL_MS
			});

			// When
			setLight(true);

			// Then
			expect(root.dataset.light).toBe('on');
			expect(updateLabel).not.toThrow();
		});

		it('should toggle the light when the lamp is pulled at night', () => {
			// Given
			root.dataset.scene = 'night';
			createLamp({ root, lamp, pullMs: PULL_MS });

			// When
			chain.click();

			// Then
			expect(root.dataset.light).toBe('on');
			expect(lamp.classList.contains('is-pulled')).toBe(true);
		});

		it('should switch the light off when the lamp is pulled again at night', () => {
			// Given
			root.dataset.scene = 'night';
			root.dataset.light = 'on';
			createLamp({ root, lamp, pullMs: PULL_MS });

			// When
			lamp.click();

			// Then
			expect(root.dataset.light).toBeUndefined();
		});

		it('should only play the pull animation when the lamp is pulled during the day', () => {
			// Given
			createLamp({ root, lamp, pullMs: PULL_MS });

			// When
			lamp.click();

			// Then
			expect(root.dataset.light).toBeUndefined();
			expect(lamp.classList.contains('is-pulled')).toBe(true);
			vi.advanceTimersByTime(PULL_MS);
			expect(lamp.classList.contains('is-pulled')).toBe(false);
		});
	});
});
