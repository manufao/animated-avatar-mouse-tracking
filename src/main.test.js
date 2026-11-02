import { beforeEach, describe, expect, it, vi } from 'vitest';

import { initAvatar } from './components/avatar/avatar.js';
import { initScene } from './components/scene/scene.js';
import { start } from './main.js';

vi.mock('./components/avatar/avatar.js', () => ({ initAvatar: vi.fn() }));
vi.mock('./components/scene/scene.js', () => ({ initScene: vi.fn() }));

describe('main', () => {
	const MOTION_QUERY = Symbol('motionQueryMock');
	const matchMediaMock = vi.fn();

	beforeEach(() => {
		vi.resetAllMocks();
		vi.restoreAllMocks();
		vi.stubGlobal('matchMedia', matchMediaMock);
		matchMediaMock.mockReturnValue(MOTION_QUERY);
		document.body.innerHTML = '';
	});

	describe('start', () => {
		it('should start the scene, then the avatar with the reduced-motion query', () => {
			// Given
			document.body.innerHTML = '<button data-avatar></button>';

			// When
			start();

			// Then
			expect(initScene).toHaveBeenCalledTimes(1);
			expect(matchMediaMock).toHaveBeenCalledExactlyOnceWith(
				'(prefers-reduced-motion: reduce)'
			);
			expect(initAvatar).toHaveBeenCalledExactlyOnceWith({
				avatar: document.querySelector('[data-avatar]'),
				motionQuery: MOTION_QUERY
			});
		});

		it('should only start the scene when the page has no avatar', () => {
			// When
			start();

			// Then
			expect(initScene).toHaveBeenCalledTimes(1);
			expect(initAvatar).toHaveBeenCalledTimes(0);
		});
	});
});
