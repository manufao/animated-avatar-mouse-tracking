// gaze.js — gaze maths for the avatar. Pure functions, no DOM.

/** @typedef {{ x: number, y: number }} Vector */
/** @typedef {{ left: number, top: number, width: number, height: number }} Box */

const EYE_LINE = 0.35; // eye height, as a share of the avatar height

/**
 * Centre of a box, in the same coordinates.
 * @param {Box} box
 * @returns {Vector}
 */
export function centerOf(box) {
	return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

/**
 * Gaze direction from the avatar eyes to a viewport point, clamped to a unit
 * disc so diagonals do not push the pupils out of the eyes.
 * @param {Vector} point viewport coordinates
 * @param {Box} avatar avatar box, which the tracking never moves
 * @param {{ width: number, height: number }} viewport
 * @returns {Vector}
 */
export function gazeToward(point, avatar, viewport) {
	const dx =
		(point.x - (avatar.left + avatar.width / 2)) / (viewport.width / 2);
	const dy =
		(point.y - (avatar.top + avatar.height * EYE_LINE)) / (viewport.height / 2);
	const length = Math.hypot(dx, dy);
	const k = length > 1 ? 1 / length : 1;
	return { x: dx * k, y: dy * k };
}

/**
 * One easing step from `current` toward `target`.
 * @param {Vector} current
 * @param {Vector} target
 * @param {number} ease 0..1, higher means snappier
 * @returns {Vector}
 */
export function easeToward(current, target, ease) {
	return {
		x: current.x + (target.x - current.x) * ease,
		y: current.y + (target.y - current.y) * ease
	};
}

/**
 * True once `current` is close enough to `target` to stop animating.
 * @param {Vector} current
 * @param {Vector} target
 */
export function isSettled(current, target, epsilon = 0.001) {
	return (
		Math.abs(target.x - current.x) <= epsilon &&
		Math.abs(target.y - current.y) <= epsilon
	);
}

/**
 * Largest pupil shift that keeps the pupil inside the eye.
 * @param {number} eyeWidth
 * @param {number} pupilWidth
 * @param {number} share share of the free space to use
 */
export function maxPupilTravel(eyeWidth, pupilWidth, share) {
	return Math.max(0, (eyeWidth - pupilWidth) / 2) * share;
}

/**
 * @param {Vector} gaze
 * @param {number} maxTravel pixels
 */
export function pupilTransform(gaze, maxTravel) {
	const x = (gaze.x * maxTravel).toFixed(2);
	const y = (gaze.y * maxTravel).toFixed(2);
	return `translate(${x}px, ${y}px)`;
}

/**
 * The head turns and shifts a little toward the gaze.
 * @param {Vector} gaze
 * @param {number} tiltMax degrees
 * @param {number} shiftMax pixels
 */
export function headTransform(gaze, tiltMax, shiftMax) {
	const x = (gaze.x * shiftMax).toFixed(2);
	const y = (gaze.y * shiftMax * 0.6).toFixed(2);
	const tilt = (gaze.x * tiltMax).toFixed(2);
	return `translate(${x}px, ${y}px) rotate(${tilt}deg)`;
}

/**
 * @param {number} min
 * @param {number} max
 * @param {() => number} [random] 0..1
 */
export function randomBetween(min, max, random = Math.random) {
	return min + random() * (max - min);
}
