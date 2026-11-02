import { describe, expect, it } from 'vitest';

import { createMonthDayReader, findOccasion } from './calendar.js';

describe('calendar', () => {
	const OCCASIONS = [
		{ name: 'new-year', from: '12-31', to: '01-01' },
		{ name: 'summer', from: '06-20', to: '06-22' },
		{ name: 'solstice', from: '06-21', to: '06-21' }
	];

	describe('createMonthDayReader', () => {
		it('should return the month-day in the given time zone', () => {
			// Given
			const read = createMonthDayReader('Europe/Paris');

			// When
			const monthDay = read(new Date('2026-12-31T23:30:00Z'));

			// Then
			expect(monthDay).toBe('01-01');
		});
	});

	describe('findOccasion', () => {
		it('should return the first matching occasion inside a range', () => {
			// When
			const occasion = findOccasion(OCCASIONS, '06-21');

			// Then
			expect(occasion).toBe(OCCASIONS[1]);
		});

		it('should return null before the start of a range', () => {
			// When
			const occasion = findOccasion(OCCASIONS, '06-19');

			// Then
			expect(occasion).toBeNull();
		});

		it('should return null after the end of a range', () => {
			// When
			const occasion = findOccasion(OCCASIONS, '06-23');

			// Then
			expect(occasion).toBeNull();
		});

		it('should match the end of the year in a range that wraps the year', () => {
			// When
			const occasion = findOccasion(OCCASIONS, '12-31');

			// Then
			expect(occasion).toBe(OCCASIONS[0]);
		});

		it('should match the start of the year in a range that wraps the year', () => {
			// When
			const occasion = findOccasion(OCCASIONS, '01-01');

			// Then
			expect(occasion).toBe(OCCASIONS[0]);
		});

		it('should return null when the list is empty', () => {
			// When
			const occasion = findOccasion([], '06-21');

			// Then
			expect(occasion).toBeNull();
		});
	});
});
