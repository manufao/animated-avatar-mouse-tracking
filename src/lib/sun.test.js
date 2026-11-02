import { describe, expect, it } from 'vitest';

import { phaseAt, sunTimes } from './sun.js';

describe('sun', () => {
	const PARIS = { lat: 48.8566, lon: 2.3522 };
	const SVALBARD = { lat: 78, lon: 15 };
	const TROMSO = { lat: 69.65, lon: 18.96 };
	const SOLSTICE_NOON = new Date('2026-06-21T12:00:00+02:00');
	/** @param {Date} a @param {Date} b */
	const minutesBetween = (a, b) => Math.abs(a.getTime() - b.getTime()) / 60000;

	describe('sunTimes', () => {
		it('should return the published Paris sunrise and sunset within three minutes', () => {
			// When
			const times = sunTimes(SOLSTICE_NOON, PARIS.lat, PARIS.lon);

			// Then
			if (times.always) {
				throw new Error('Paris has a sunrise every day');
			}
			const rise = new Date('2026-06-21T05:47:00+02:00');
			const set = new Date('2026-06-21T21:58:00+02:00');
			expect(minutesBetween(times.rise, rise)).toBeLessThan(3);
			expect(minutesBetween(times.set, set)).toBeLessThan(3);
		});

		it('should return always day when the sun never goes below the altitude', () => {
			// When
			const times = sunTimes(SOLSTICE_NOON, SVALBARD.lat, SVALBARD.lon);

			// Then
			expect(times).toEqual({ always: 'day' });
		});

		it('should return always night when the sun never reaches the altitude', () => {
			// Given
			const winter = new Date('2026-12-21T12:00:00Z');

			// When
			const times = sunTimes(winter, SVALBARD.lat, SVALBARD.lon, -6);

			// Then
			expect(times).toEqual({ always: 'night' });
		});
	});

	describe('phaseAt', () => {
		it('should return the polar phase when civil twilight never starts or ends', () => {
			// Given
			const midnight = new Date('2026-06-21T00:00:00Z');

			// When
			const phase = phaseAt(midnight, SVALBARD.lat, SVALBARD.lon);

			// Then
			expect(phase).toBe('day');
		});

		it('should return night before civil dawn', () => {
			// Given
			const early = new Date('2026-06-21T02:00:00+02:00');

			// When
			const phase = phaseAt(early, PARIS.lat, PARIS.lon);

			// Then
			expect(phase).toBe('night');
		});

		it('should return night after civil dusk', () => {
			// Given
			const late = new Date('2026-06-21T23:30:00+02:00');

			// When
			const phase = phaseAt(late, PARIS.lat, PARIS.lon);

			// Then
			expect(phase).toBe('night');
		});

		it('should return day during polar twilight, when the sun never rises', () => {
			// Given
			const winterNoon = new Date('2026-12-21T11:00:00Z');

			// When
			const phase = phaseAt(winterNoon, TROMSO.lat, TROMSO.lon);

			// Then
			expect(phase).toBe('day');
		});

		it('should return dawn until half an hour after sunrise', () => {
			// Given
			const dawn = new Date('2026-06-21T05:40:00+02:00');

			// When
			const phase = phaseAt(dawn, PARIS.lat, PARIS.lon);

			// Then
			expect(phase).toBe('dawn');
		});

		it('should return dusk from half an hour before sunset', () => {
			// Given
			const dusk = new Date('2026-06-21T21:50:00+02:00');

			// When
			const phase = phaseAt(dusk, PARIS.lat, PARIS.lon);

			// Then
			expect(phase).toBe('dusk');
		});

		it('should return day between dawn and dusk', () => {
			// When
			const phase = phaseAt(SOLSTICE_NOON, PARIS.lat, PARIS.lon);

			// Then
			expect(phase).toBe('day');
		});

		it('should use the given golden period instead of half an hour', () => {
			// Given
			const twoHoursAfterSunrise = new Date('2026-06-21T07:47:00+02:00');

			// When
			const phase = phaseAt(
				twoHoursAfterSunrise,
				PARIS.lat,
				PARIS.lon,
				3 * 3600000
			);

			// Then
			expect(phase).toBe('dawn');
		});
	});
});
