// scene.js — night, dawn, day and dusk from Paris daylight, visitor override,
// fake light switch and special dates. Fail-safe: any error leaves the day scene.

import { PARIS, PULL_MS, REFRESH_MS } from '../../config/scene.js';
import { OCCASIONS } from '../../data/occasions.js';
import { createMonthDayReader, findOccasion } from '../../lib/calendar.js';
import { phaseAt } from '../../lib/sun.js';

import { createLamp } from './lamp.js';
import { createOccasionLayer } from './occasion-layer.js';
import { initSceneChoices } from './scene-choices.js';

/**
 * @typedef {object} SceneOptions
 * @property {() => Date} [clock]
 * @property {(now: Date, lat: number, lon: number) => string} [phaseOf]
 * @property {readonly import('../../lib/calendar.js').Occasion[]} [occasions]
 */

/** @param {SceneOptions} [options] */
export function initScene({
	clock = () => new Date(),
	phaseOf = phaseAt,
	occasions = OCCASIONS
} = {}) {
	const root = document.documentElement;
	const lamp = createLamp({
		root,
		lamp: document.querySelector('[data-lamp]'),
		pullMs: PULL_MS
	});
	const applyOccasion = createOccasionLayer(
		root,
		document.querySelector('[data-head]')
	);
	const monthDay = createMonthDayReader(PARIS.timeZone);
	/** @type {string | null} */
	let forcedPhase = null;

	function update() {
		try {
			const now = clock();
			const phase = forcedPhase ?? phaseOf(now, PARIS.lat, PARIS.lon);
			if (phase !== 'night' && root.dataset.light === 'on') {
				lamp.setLight(false); // dawn: lamp off
			}
			root.dataset.scene = phase;
			lamp.updateLabel();
			applyOccasion(findOccasion(occasions, monthDay(now)));
		} catch {
			// Fail-safe: default day scene, no switch
			root.dataset.scene = 'day';
			delete root.dataset.light;
			lamp.updateLabel();
		}
	}

	const updateIfVisible = () => {
		if (!document.hidden) {
			update();
		}
	};

	initSceneChoices(document.querySelector('[data-scene-choices]'), (phase) => {
		forcedPhase = phase;
		update();
	});
	document.addEventListener('visibilitychange', updateIfVisible);
	setInterval(updateIfVisible, REFRESH_MS);
	lamp.setLight(false);
	update();
	// Enable transitions only after the first paint: no day-to-night fade on load
	requestAnimationFrame(() =>
		requestAnimationFrame(() => {
			root.dataset.sceneReady = '';
		})
	);
}
