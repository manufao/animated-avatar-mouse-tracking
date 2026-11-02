// mood.js — awake -> bored -> yawning -> bored ... -> awake on any activity.
// One idle timer: activity only stamps a time, no timer churn.

import { randomBetween } from '../../lib/gaze.js';

/** @typedef {'awake' | 'bored' | 'yawning'} Mood */

/**
 * @typedef {object} MoodOptions
 * @property {HTMLElement} avatar receives the is-bored and is-yawning classes
 * @property {import('../../config/avatar.js').AvatarConfig} config
 * @property {() => boolean} isActive
 * @property {() => number} now milliseconds
 * @property {() => number} random
 * @property {() => void} onBored the eyes drift down
 * @property {() => void} onWake the eyes look ahead again
 */

/** @param {MoodOptions} options */
export function createMood(options) {
	const { avatar, config, isActive, now, random, onBored, onWake } = options;
	/** @type {Mood} */
	let mood = 'awake';
	let lastActivity = 0;
	let idleTimer = 0;
	let yawnTimer = 0;
	let yawnEndTimer = 0;

	/** @param {Mood} next */
	function set(next) {
		mood = next;
		avatar.classList.toggle('is-bored', next !== 'awake');
		avatar.classList.toggle('is-yawning', next === 'yawning');
	}

	function clearTimers() {
		clearTimeout(idleTimer);
		clearTimeout(yawnTimer);
		clearTimeout(yawnEndTimer);
	}

	/** @param {number} delay */
	function armIdle(delay) {
		clearTimeout(idleTimer);
		idleTimer = window.setTimeout(checkIdle, delay);
	}

	function checkIdle() {
		if (!isActive()) {
			return;
		}
		const idle = now() - lastActivity;
		if (idle < config.boredAfter) {
			armIdle(config.boredAfter - idle);
			return;
		}
		set('bored');
		onBored();
		yawnTimer = window.setTimeout(yawn, Math.max(0, config.yawnAfter - idle));
	}

	function yawn() {
		if (!isActive()) {
			return;
		}
		set('yawning');
		yawnEndTimer = window.setTimeout(() => {
			set('bored');
			const delay = randomBetween(
				config.yawnEveryMin,
				config.yawnEveryMax,
				random
			);
			yawnTimer = window.setTimeout(yawn, delay);
		}, config.yawnDuration);
	}

	// Awake again, then bored again later
	function restart() {
		lastActivity = now();
		clearTimers();
		if (mood !== 'awake') {
			set('awake');
			onWake();
		}
		armIdle(config.boredAfter);
	}

	function activity() {
		if (mood === 'awake') {
			lastActivity = now();
			return;
		}
		restart();
	}

	function reset() {
		clearTimers();
		set('awake');
	}

	return {
		activity,
		restart,
		reset,
		pause: clearTimers,
		current: () => mood
	};
}
