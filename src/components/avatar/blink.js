// blink.js — the avatar blinks at random intervals.

import { randomBetween } from '../../lib/gaze.js';

/**
 * @typedef {object} BlinkOptions
 * @property {HTMLElement} avatar
 * @property {import('../../config/avatar.js').AvatarConfig} config
 * @property {() => boolean} isActive
 * @property {() => boolean} canBlink false while yawning
 * @property {() => number} random
 */

/** @param {BlinkOptions} options */
export function createBlink({ avatar, config, isActive, canBlink, random }) {
	let timer = 0;

	function blinkOnce() {
		if (canBlink()) {
			avatar.classList.add('is-blinking');
			setTimeout(
				() => avatar.classList.remove('is-blinking'),
				config.blinkDuration
			);
		}
		schedule();
	}

	function schedule() {
		stop();
		if (!isActive()) {
			return;
		}
		const delay = randomBetween(config.blinkMin, config.blinkMax, random);
		timer = window.setTimeout(blinkOnce, delay);
	}

	function stop() {
		clearTimeout(timer);
	}

	return { schedule, stop };
}
