// scene-choices.js — visitor override of the scene: follow Paris daylight, or
// force day or night. Kept in memory only, never stored.

/** @typedef {'day' | 'night'} ForcedPhase */

/**
 * Only 'day' and 'night' force a phase; anything else follows Paris daylight.
 * @param {string | undefined} choice
 * @returns {ForcedPhase | null}
 */
export function toForcedPhase(choice) {
	return choice === 'day' || choice === 'night' ? choice : null;
}

/**
 * @param {HTMLElement | null} group
 * @param {(phase: ForcedPhase | null) => void} onChoose
 */
export function initSceneChoices(group, onChoose) {
	if (!group) {
		return;
	}
	/** @type {HTMLElement[]} */
	const buttons = [...group.querySelectorAll('[data-scene-choice]')].filter(
		(el) => el instanceof HTMLElement
	);
	for (const button of buttons) {
		button.addEventListener('click', () => {
			const phase = toForcedPhase(button.dataset.sceneChoice);
			for (const other of buttons) {
				const pressed = other.dataset.sceneChoice === (phase ?? 'auto');
				other.setAttribute('aria-pressed', String(pressed));
			}
			onChoose(phase);
		});
	}
	group.hidden = false; // useless without JS, so shown only here
}
