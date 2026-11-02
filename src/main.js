// main.js — entry point: scene first (day/night palette), then the avatar.

import { initAvatar } from './components/avatar/avatar.js';
import { initScene } from './components/scene/scene.js';

export function start() {
	initScene();
	const avatar = document.querySelector('[data-avatar]');
	if (avatar instanceof HTMLElement) {
		initAvatar({
			avatar,
			motionQuery: window.matchMedia('(prefers-reduced-motion: reduce)')
		});
	}
}

start();
