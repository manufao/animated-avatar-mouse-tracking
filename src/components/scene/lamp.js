// lamp.js — ceiling bulb with a pull chain. The chain is always there; it
// only switches the light at night.

/**
 * Accessible name of the chain.
 * @param {boolean} night
 * @param {boolean} lightOn
 */
export function chainLabel(night, lightOn) {
	if (!night) {
		return "Tirer la chaînette : la lumière ne s'allume que la nuit";
	}
	return lightOn ? 'Éteindre la lumière' : 'Allumer la lumière';
}

/**
 * @typedef {object} LampOptions
 * @property {HTMLElement} root page root: carries data-scene and data-light
 * @property {HTMLElement | null} lamp
 * @property {number} pullMs fallback end of the pull animation
 */

/**
 * @param {LampOptions} options
 */
export function createLamp({ root, lamp, pullMs }) {
	const chain = lamp?.querySelector('[data-light-toggle]') ?? null;
	let pullTimer = 0;

	function updateLabel() {
		if (!chain) {
			return;
		}
		const night = root.dataset.scene === 'night';
		chain.setAttribute('aria-disabled', String(!night));
		chain.setAttribute(
			'aria-label',
			chainLabel(night, root.dataset.light === 'on')
		);
	}

	/** @param {boolean} on */
	function setLight(on) {
		if (on) {
			root.dataset.light = 'on';
		} else {
			delete root.dataset.light;
		}
		chain?.setAttribute('aria-pressed', String(on));
		updateLabel();
	}

	// Chain yank and sway, day or night. Restarts if pulled again quickly.
	/** @param {HTMLElement} el */
	function playPull(el) {
		el.classList.remove('is-pulled');
		void el.offsetWidth; // restart the CSS animation
		el.classList.add('is-pulled');
		clearTimeout(pullTimer);
		pullTimer = window.setTimeout(
			() => el.classList.remove('is-pulled'),
			pullMs
		);
	}

	// One listener on the lamp: chain, bulb and socket all pull. The chain click
	// bubbles up here too, so it must not have its own listener (double toggle).
	lamp?.addEventListener('click', () => {
		playPull(lamp);
		if (root.dataset.scene === 'night') {
			setLight(root.dataset.light !== 'on');
		}
	});

	return { setLight, updateLabel };
}
