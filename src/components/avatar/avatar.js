// avatar.js — eyes and head follow the pointer, blink, get bored and yawn.
// Back to the static picture when the visitor asks for reduced motion.

import { AVATAR_CONFIG } from '../../config/avatar.js';
import { maxPupilTravel } from '../../lib/gaze.js';

import { createBlink } from './blink.js';
import { createGazeRenderer } from './gaze-renderer.js';
import { createMood } from './mood.js';
import { createPointerTracking } from './pointer-tracking.js';

const CENTER = Object.freeze({ x: 0, y: 0 });
const BORED_GAZE = Object.freeze({ x: 0, y: 0.35 }); // eyes drift down

/**
 * @typedef {object} AvatarOptions
 * @property {HTMLElement} avatar the avatar button
 * @property {MediaQueryList} motionQuery matches when motion must stay off
 * @property {import('../../config/avatar.js').AvatarConfig} [config]
 * @property {() => number} [now] milliseconds
 * @property {() => number} [random] 0..1
 */

/**
 * Brings the avatar to life. Returns false, leaving the static picture
 * untouched, when the markup is incomplete.
 * @param {AvatarOptions} options
 */
export function initAvatar({
	avatar,
	motionQuery,
	config = AVATAR_CONFIG,
	now = () => performance.now(),
	random = Math.random
}) {
	const head = avatar.querySelector('[data-head]');
	const eyes = [...avatar.querySelectorAll('[data-eye]')];
	if (!(head instanceof HTMLElement) || eyes.length === 0) {
		return false;
	}
	const pupils = eyes
		.map((eye) => eye.firstElementChild)
		.filter((el) => el instanceof HTMLElement);

	let enabled = false;
	const isActive = () => enabled && !document.hidden;

	const gaze = createGazeRenderer({
		head,
		pupils,
		config,
		isActive,
		isCalm: () => mood.current() !== 'awake'
	});
	const mood = createMood({
		avatar,
		config,
		isActive,
		now,
		random,
		onBored: () => gaze.lookAt(BORED_GAZE),
		onWake: () => gaze.lookAt(CENTER)
	});
	const blink = createBlink({
		avatar,
		config,
		isActive,
		random,
		canBlink: () => mood.current() !== 'yawning'
	});
	const tracking = createPointerTracking({
		avatar,
		gaze,
		onActivity: mood.activity,
		touchRelease: config.touchRelease
	});

	// Sizes are cached outside the render loop: no layout read per frame.
	function measure() {
		const eye = eyes[0];
		const pupil = eye.firstElementChild;
		const width = pupil ? pupil.clientWidth : eye.clientWidth;
		gaze.setMaxTravel(
			maxPupilTravel(eye.clientWidth, width, config.pupilTravel)
		);
	}

	// The click reaction stays available with reduced motion (CSS drops the hop).
	function onClick() {
		mood.activity();
		if (avatar.classList.contains('is-happy')) {
			return;
		}
		avatar.classList.add('is-happy');
		setTimeout(() => avatar.classList.remove('is-happy'), config.reactDuration);
	}

	function onVisibility() {
		if (document.hidden) {
			blink.stop();
			mood.pause();
			gaze.cancel();
		} else if (enabled) {
			mood.restart(); // coming back counts as activity
			blink.schedule();
			gaze.request();
		}
	}

	function enable() {
		enabled = true;
		tracking.attach();
		mood.restart();
		blink.schedule();
	}

	// Back to the static picture: no listeners, no timers, no transforms.
	function disable() {
		enabled = false;
		tracking.detach();
		blink.stop();
		mood.reset();
		gaze.reset();
	}

	function sync() {
		if (motionQuery.matches) {
			disable();
		} else if (!enabled) {
			enable();
		}
	}

	new ResizeObserver(measure).observe(avatar);
	measure();
	motionQuery.addEventListener('change', sync);
	document.addEventListener('visibilitychange', onVisibility);
	avatar.addEventListener('click', onClick);
	sync();
	return true;
}
