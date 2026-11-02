/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
	forbidden: [
		{
			name: 'no-circular',
			severity: 'error',
			comment:
				'This dependency is part of a circular relationship. Revise the solution ' +
				'(dependency inversion, single responsibility).',
			from: {},
			to: { circular: true }
		},
		{
			name: 'no-orphans',
			comment:
				'Orphan module: likely not used anymore. Use it, remove it, or add an ' +
				'exception here if it is an entry point.',
			severity: 'error',
			from: {
				orphan: true,
				pathNot: [
					'(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$', // dot files
					'^src/main[.]js$' // entry point, loaded by index.html
				]
			},
			to: {}
		},
		{
			name: 'not-to-deprecated',
			comment:
				'This module uses a deprecated npm module: upgrade or replace it.',
			severity: 'warn',
			from: {},
			to: { dependencyTypes: ['deprecated'] }
		},
		{
			name: 'no-non-package-json',
			severity: 'error',
			comment:
				"This module depends on an npm package that isn't declared in package.json.",
			from: {},
			to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown'] }
		},
		{
			name: 'not-to-unresolvable',
			comment: 'This module depends on a module that cannot be found on disk.',
			severity: 'error',
			from: {},
			to: { couldNotResolve: true }
		},
		{
			name: 'no-duplicate-dep-types',
			comment:
				'This package is in both dependencies and devDependencies of package.json.',
			severity: 'warn',
			from: {},
			to: {
				moreThanOneDependencyType: true,
				dependencyTypesNot: ['type-only']
			}
		},
		{
			name: 'not-to-spec',
			comment:
				'This module depends on a test file. Move what is shared into a helper.',
			severity: 'error',
			from: {},
			to: { path: '[.](?:spec|test)[.](?:js|mjs|cjs)$' }
		},
		{
			name: 'no-logic-to-views',
			comment: 'Logic, data and config must not depend on components.',
			severity: 'error',
			from: {
				path: '^src/(?:lib|data|config)/',
				pathNot: '[.](?:spec|test)[.](?:js|mjs|cjs)$'
			},
			to: { path: '^src/(?:components/|main[.]js$)' }
		}
	],
	options: {
		doNotFollow: { path: ['node_modules'] },
		moduleSystems: ['es6'],
		enhancedResolveOptions: {
			exportsFields: ['exports'],
			conditionNames: ['import', 'default'],
			extensions: ['.js'],
			mainFields: ['module', 'main']
		},
		skipAnalysisNotInRules: true
	}
};
