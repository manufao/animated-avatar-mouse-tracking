import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import noSecrets from 'eslint-plugin-no-secrets';
import security from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{ ignores: ['outils/'] },
	js.configs.recommended,
	security.configs.recommended,
	{
		plugins: {
			'no-secrets': noSecrets,
			'simple-import-sort': simpleImportSort
		},
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: { ...globals.browser }
		},
		rules: {
			'simple-import-sort/imports': [
				'error',
				{
					groups: [
						// Node.js built-in modules
						['^node:'],
						// Packages (things that start with a letter, digit, or @)
						['^@?\\w'],
						// Parent imports (../)
						['^\\.\\.(?!/?$)', '^\\.\\./?$'],
						// Other relative imports (same folder ./)
						['^\\./'],
						// Style imports
						['^.+\\.s?css$']
					]
				}
			],
			'simple-import-sort/exports': 'error',
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			curly: ['error', 'all'],

			// Security Rules (SAST)
			'security/detect-unsafe-regex': 'error',
			'security/detect-eval-with-expression': 'error',
			'security/detect-child-process': 'error',
			'security/detect-non-literal-fs-filename': 'warn',
			'security/detect-non-literal-regexp': 'warn',
			'security/detect-buffer-noassert': 'error',
			'security/detect-possible-timing-attacks': 'warn',
			'security/detect-pseudoRandomBytes': 'error',
			'security/detect-object-injection': 'off',
			'no-secrets/no-secrets': ['error', { tolerance: 4.5 }]
		}
	},
	{
		// Config files and tests run in Node
		files: ['*.config.js', '*.cjs', 'src/**/*.test.js'],
		languageOptions: { globals: { ...globals.node } }
	},
	{
		// Project structure
		files: ['src/**/*.js'],
		extends: [importX.flatConfigs.recommended],
		plugins: { unicorn },
		settings: {
			'import-x/resolver-next': [createNodeResolver()]
		},
		rules: {
			'max-lines': [
				'error',
				{ max: 150, skipBlankLines: true, skipComments: true }
			],
			'unicorn/filename-case': ['error', { case: 'kebabCase' }],
			'import-x/no-restricted-paths': [
				'error',
				{
					zones: [
						{
							target: ['./src/lib', './src/data', './src/config'],
							from: './src/components',
							message: 'Logic, data and config must not depend on components.'
						},
						{
							target: ['./src/lib', './src/data', './src/config'],
							from: './src/main.js',
							message: 'Only the entry point wires the page.'
						}
					]
				}
			]
		}
	},
	{
		// One describe per tested function: a test file outgrows its unit
		files: ['src/**/*.test.js'],
		rules: { 'max-lines': 'off' }
	}
);
