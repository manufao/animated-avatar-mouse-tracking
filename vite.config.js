import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	// Relative URLs: the build also works from a sub-folder of the hosting
	base: './',
	css: {
		transformer: 'lightningcss',
		lightningcss: {
			// Native nesting and modern syntax are lowered for these browsers
			targets: browserslistToTargets(
				browserslist('>= 0.25%, last 2 versions, not dead')
			)
		}
	},
	build: {
		cssMinify: 'lightningcss'
	},
	test: {
		environment: 'jsdom',
		restoreMocks: true,
		unstubGlobals: true,
		coverage: {
			provider: 'v8',
			include: ['src/**/*.js'],
			exclude: ['src/**/*.test.js'],
			thresholds: {
				perFile: true,
				statements: 100,
				branches: 100,
				functions: 100,
				lines: 100
			}
		}
	}
});
