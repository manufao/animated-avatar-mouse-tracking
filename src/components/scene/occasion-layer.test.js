import { beforeEach, describe, expect, it } from 'vitest';

import { createOccasionLayer } from './occasion-layer.js';

describe('occasion-layer', () => {
	const EPIPHANY = {
		name: 'epiphanie',
		from: '01-06',
		to: '01-06',
		image: 'img/occasion-epiphanie.webp'
	};
	/** @type {HTMLElement} */
	let root;
	/** @type {HTMLElement} */
	let head;

	beforeEach(() => {
		root = document.createElement('div');
		head = document.createElement('div');
	});

	describe('createOccasionLayer', () => {
		it('should clear the occasion when there is none and no layer yet', () => {
			// Given
			root.dataset.occasion = 'old';
			const apply = createOccasionLayer(root, head);

			// When
			apply(null);

			// Then
			expect(root.dataset.occasion).toBeUndefined();
			expect(head.querySelector('img')).toBeNull();
		});

		it('should add the accessory layer on top of the head', () => {
			// Given
			const apply = createOccasionLayer(root, head);

			// When
			apply(EPIPHANY);

			// Then
			const layer = head.querySelector('img');
			expect(root.dataset.occasion).toBe('epiphanie');
			expect(layer?.className).toBe('occasion');
			expect(layer?.getAttribute('src')).toBe(EPIPHANY.image);
			expect(layer?.alt).toBe('');
			expect(layer?.width).toBe(720);
			expect(layer?.height).toBe(960);
			expect(layer?.hidden).toBe(false);
		});

		it('should reuse the layer and keep its source for the same occasion', () => {
			// Given
			const apply = createOccasionLayer(root, head);
			apply(EPIPHANY);
			apply(null);

			// When
			apply(EPIPHANY);

			// Then
			const layers = head.querySelectorAll('img');
			expect(layers).toHaveLength(1);
			expect(layers[0].hidden).toBe(false);
		});

		it('should change the source for another occasion', () => {
			// Given
			const apply = createOccasionLayer(root, head);
			apply(EPIPHANY);

			// When
			apply({ ...EPIPHANY, name: 'noel', image: 'img/occasion-noel.webp' });

			// Then
			expect(head.querySelector('img')?.getAttribute('src')).toBe(
				'img/occasion-noel.webp'
			);
		});

		it('should hide the layer when the occasion is over', () => {
			// Given
			const apply = createOccasionLayer(root, head);
			apply(EPIPHANY);

			// When
			apply(null);

			// Then
			expect(head.querySelector('img')?.hidden).toBe(true);
			expect(root.dataset.occasion).toBeUndefined();
		});

		it('should only mark the page for an occasion without image', () => {
			// Given
			const apply = createOccasionLayer(root, head);

			// When
			apply({ name: 'anniversaire', from: '05-01', to: '05-01' });

			// Then
			expect(root.dataset.occasion).toBe('anniversaire');
			expect(head.querySelector('img')).toBeNull();
		});

		it('should only mark the page when there is no head', () => {
			// Given
			const apply = createOccasionLayer(root, null);

			// When
			apply(EPIPHANY);

			// Then
			expect(root.dataset.occasion).toBe('epiphanie');
		});

		it('should hide the layer when its image fails to load', () => {
			// Given
			const apply = createOccasionLayer(root, head);
			apply(EPIPHANY);
			const layer = head.querySelector('img');

			// When
			layer?.dispatchEvent(new Event('error'));

			// Then
			expect(layer?.hidden).toBe(true);
		});
	});
});
