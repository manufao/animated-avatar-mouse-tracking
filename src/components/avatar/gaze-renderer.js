// gaze-renderer.js — eases the pupils and the head toward the gaze target,
// one frame at a time. The loop stops once settled: no idle CPU use.

import {
	easeToward,
	headTransform,
	isSettled,
	pupilTransform
} from '../../lib/gaze.js';

/** @typedef {import('../../lib/gaze.js').Vector} Vector */

/**
 * @typedef {object} GazeRendererOptions
 * @property {HTMLElement} head
 * @property {HTMLElement[]} pupils
 * @property {import('../../config/avatar.js').AvatarConfig} config
 * @property {() => boolean} isActive false while disabled or hidden
 * @property {() => boolean} isCalm true for the lazier, bored easing
 */

/** @param {GazeRendererOptions} options */
export function createGazeRenderer({ head, pupils, config, isActive, isCalm }) {
	const CENTER = { x: 0, y: 0 };
	/** @type {Vector} */
	let target = CENTER;
	/** @type {Vector} */
	let current = CENTER;
	let maxTravel = 0;
	let frame = 0;

	function render() {
		frame = 0;
		const ease = isCalm() ? config.boredSmoothing : config.smoothing;
		current = easeToward(current, target, ease);
		const pupilStyle = pupilTransform(current, maxTravel);
		for (const pupil of pupils) {
			pupil.style.transform = pupilStyle;
		}
		head.style.transform = headTransform(
			current,
			config.headTiltMax,
			config.headShiftMax
		);
		if (!isSettled(current, target)) {
			request();
		}
	}

	function request() {
		if (isActive() && !frame) {
			frame = requestAnimationFrame(render);
		}
	}

	/** @param {Vector} next unit-disc direction */
	function lookAt(next) {
		target = next;
		request();
	}

	function cancel() {
		cancelAnimationFrame(frame);
		frame = 0;
	}

	// Back to the static picture: no transforms
	function reset() {
		cancel();
		target = current = CENTER;
		head.style.transform = '';
		for (const pupil of pupils) {
			pupil.style.transform = '';
		}
	}

	/** @param {number} pixels */
	function setMaxTravel(pixels) {
		maxTravel = pixels;
	}

	return { lookAt, request, cancel, reset, setMaxTravel };
}
