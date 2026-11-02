import { describe, expect, it } from 'vitest';

import {
	centerOf,
	easeToward,
	gazeToward,
	headTransform,
	isSettled,
	maxPupilTravel,
	pupilTransform,
	randomBetween
} from './gaze.js';

describe('gaze', () => {
	const AVATAR = { left: 100, top: 100, width: 200, height: 200 };
	const VIEWPORT = { width: 1000, height: 800 };

	describe('centerOf', () => {
		it('should return the centre of the box', () => {
			// When
			const center = centerOf(AVATAR);

			// Then
			expect(center).toEqual({ x: 200, y: 200 });
		});
	});

	describe('gazeToward', () => {
		it('should return the direction unchanged when it is inside the unit disc', () => {
			// Given
			const point = { x: 450, y: 170 + 200 };

			// When
			const gaze = gazeToward(point, AVATAR, VIEWPORT);

			// Then
			expect(gaze.x).toBeCloseTo(0.5);
			expect(gaze.y).toBeCloseTo(0.5);
		});

		it('should clamp the direction to the unit disc when the point is far', () => {
			// Given
			const point = { x: 200 + 5000, y: 170 };

			// When
			const gaze = gazeToward(point, AVATAR, VIEWPORT);

			// Then
			expect(gaze.x).toBeCloseTo(1);
			expect(gaze.y).toBeCloseTo(0);
		});
	});

	describe('easeToward', () => {
		it('should move the given share of the way to the target', () => {
			// When
			const next = easeToward({ x: 0, y: 1 }, { x: 1, y: 0 }, 0.25);

			// Then
			expect(next).toEqual({ x: 0.25, y: 0.75 });
		});
	});

	describe('isSettled', () => {
		it('should return true when both axes are within the default epsilon', () => {
			// When
			const settled = isSettled({ x: 0.0005, y: 0 }, { x: 0, y: 0.0005 });

			// Then
			expect(settled).toBe(true);
		});

		it('should return false when the x axis is still moving', () => {
			// When
			const settled = isSettled({ x: 0.5, y: 0 }, { x: 0, y: 0 });

			// Then
			expect(settled).toBe(false);
		});

		it('should return false when the y axis is still moving', () => {
			// When
			const settled = isSettled({ x: 0, y: 0.5 }, { x: 0, y: 0 });

			// Then
			expect(settled).toBe(false);
		});

		it('should use the given epsilon', () => {
			// When
			const settled = isSettled({ x: 0.05, y: 0 }, { x: 0, y: 0 }, 0.1);

			// Then
			expect(settled).toBe(true);
		});
	});

	describe('maxPupilTravel', () => {
		it('should return the given share of the free space on each side', () => {
			// When
			const travel = maxPupilTravel(20, 10, 0.5);

			// Then
			expect(travel).toBe(2.5);
		});

		it('should return zero when the pupil is wider than the eye', () => {
			// When
			const travel = maxPupilTravel(10, 20, 0.5);

			// Then
			expect(travel).toBe(0);
		});
	});

	describe('pupilTransform', () => {
		it('should translate the pupil by the gaze scaled to the max travel', () => {
			// When
			const transform = pupilTransform({ x: 0.5, y: -1 }, 4);

			// Then
			expect(transform).toBe('translate(2.00px, -4.00px)');
		});
	});

	describe('headTransform', () => {
		it('should shift and tilt the head toward the gaze', () => {
			// When
			const transform = headTransform({ x: 1, y: 1 }, 4, 3);

			// Then
			expect(transform).toBe('translate(3.00px, 1.80px) rotate(4.00deg)');
		});
	});

	describe('randomBetween', () => {
		it('should scale the given random value to the range', () => {
			// When
			const value = randomBetween(10, 20, () => 0.25);

			// Then
			expect(value).toBe(12.5);
		});

		it('should stay in the range with Math.random by default', () => {
			// When
			const value = randomBetween(10, 20);

			// Then
			expect(value).toBeGreaterThanOrEqual(10);
			expect(value).toBeLessThan(20);
		});
	});
});
