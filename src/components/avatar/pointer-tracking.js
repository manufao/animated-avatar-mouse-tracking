// pointer-tracking.js — the avatar looks at the pointer, at a touch, or at
// the focused link or button. Any of these counts as activity.

import { centerOf, gazeToward } from '../../lib/gaze.js';

const CENTER = Object.freeze({ x: 0, y: 0 });

/**
 * @typedef {object} PointerTrackingOptions
 * @property {HTMLElement} avatar the box the gaze starts from
 * @property {{ lookAt: (gaze: import('../../lib/gaze.js').Vector) => void }} gaze
 * @property {() => void} onActivity
 * @property {number} touchRelease ms before recentering after a touch
 */

/** @param {PointerTrackingOptions} options */
export function createPointerTracking({
	avatar,
	gaze,
	onActivity,
	touchRelease
}) {
	let releaseTimer = 0;
	const recenter = () => gaze.lookAt(CENTER);

	/** @param {import('../../lib/gaze.js').Vector} point viewport coordinates */
	function aimAt(point) {
		const viewport = { width: window.innerWidth, height: window.innerHeight };
		gaze.lookAt(gazeToward(point, avatar.getBoundingClientRect(), viewport));
	}

	/** @param {PointerEvent} e */
	function onPointerMove(e) {
		onActivity();
		aimAt({ x: e.clientX, y: e.clientY });
	}

	/** @param {PointerEvent} e */
	function onPointerDown(e) {
		clearTimeout(releaseTimer);
		onPointerMove(e);
	}

	/** @param {PointerEvent} e */
	function onPointerUp(e) {
		if (e.pointerType === 'mouse') {
			return;
		}
		clearTimeout(releaseTimer);
		releaseTimer = window.setTimeout(recenter, touchRelease);
	}

	// relatedTarget is null when the mouse leaves the window.
	/** @param {MouseEvent} e */
	function onMouseOut(e) {
		if (!e.relatedTarget) {
			recenter();
		}
	}

	// Keyboard users: look at the focused link or button.
	/** @param {FocusEvent} e */
	function onFocusIn(e) {
		onActivity();
		const el =
			e.target instanceof Element ? e.target.closest('a, button') : null;
		if (el && el !== avatar) {
			aimAt(centerOf(el.getBoundingClientRect()));
		}
	}

	function attach() {
		const passive = { passive: true };
		window.addEventListener('pointermove', onPointerMove, passive);
		window.addEventListener('pointerdown', onPointerDown, passive);
		window.addEventListener('pointerup', onPointerUp, passive);
		document.addEventListener('mouseout', onMouseOut);
		document.addEventListener('focusin', onFocusIn);
		document.addEventListener('keydown', onActivity);
	}

	function detach() {
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerdown', onPointerDown);
		window.removeEventListener('pointerup', onPointerUp);
		document.removeEventListener('mouseout', onMouseOut);
		document.removeEventListener('focusin', onFocusIn);
		document.removeEventListener('keydown', onActivity);
		clearTimeout(releaseTimer);
	}

	return { attach, detach };
}
