<div align="center">

<img src="public/img/avatar-static.webp" alt="Drawing of the author's avatar, with a bun and a curious look" width="220">

# Animated Avatar Mouse Tracking

**An "under construction" page that looks back at you.**
A 2D avatar follows your mouse with its eyes, blinks, gets bored, yawns…
and lives by the Paris sun.

[![CI](https://github.com/manufao/animated-avatar-mouse-tracking/actions/workflows/ci.yml/badge.svg)](https://github.com/manufao/animated-avatar-mouse-tracking/actions/workflows/ci.yml)
[![Security Scan](https://github.com/manufao/animated-avatar-mouse-tracking/actions/workflows/security-scan.yml/badge.svg)](https://github.com/manufao/animated-avatar-mouse-tracking/actions/workflows/security-scan.yml)
[![OWASP ZAP](https://img.shields.io/badge/OWASP-ZAP%20DAST-orange.svg?logo=owasp)](https://github.com/manufao/animated-avatar-mouse-tracking/actions/workflows/security-scan.yml)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg?logo=vitest)](#-tests)
<br>
[![Vanilla JS](https://img.shields.io/badge/JavaScript-ES%20modules-f7df1e.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Modules)
[![Vite](https://img.shields.io/badge/build-Vite-646cff.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Lightning CSS](https://img.shields.io/badge/css-Lightning%20CSS-ffd43b.svg)](https://lightningcss.dev/)
[![Zero runtime dependency](https://img.shields.io/badge/runtime%20deps-0-success.svg)](package.json)
[![pnpm](https://img.shields.io/badge/pnpm-only-f69220.svg?logo=pnpm&logoColor=white)](https://pnpm.io/)
<br>
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?logo=prettier&logoColor=white)](https://prettier.io/)
[![Lint: ESLint](https://img.shields.io/badge/lint-eslint-4B32C3.svg?logo=eslint)](https://eslint.org/)
[![Types: checkJs](https://img.shields.io/badge/types-checkJs-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)
[![Conventional Commits](https://img.shields.io/badge/commits-conventional-fe5196.svg?logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org/)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Images: all rights reserved](https://img.shields.io/badge/images-all%20rights%20reserved-lightgrey.svg)](LICENSE-IMAGES)

</div>

---

## 🎭 What it does

|                                  |                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| 👀 **It watches you**            | Pupils and head follow the mouse, a finger, or the link that has the keyboard focus. |
| 😌 **It blinks**                 | At random, every 2.5 to 6.5 seconds, like a real one.                                |
| 😑 **It gets bored**             | Eight seconds without moving? The eyes drop, the face goes long.                     |
| 🥱 **It yawns**                  | After twenty seconds, then every now and then. Move, and it wakes up.                |
| 😄 **It reacts to a click**      | A little hop of joy.                                                                 |
| 🌅 **It lives on Paris time**    | Dawn, day, dusk, night: the colours follow the real Paris sun.                       |
| 💡 **It has a light bulb**       | At night, pull the chain to switch the light on. By day, it just swings.             |
| 🎉 **It celebrates**             | A paper crown for Epiphany, more accessories to come.                                |
| ♿ **It respects your settings** | With "reduce motion" on, the avatar stays a still picture.                           |

No runtime library: plain HTML, CSS and JavaScript, about 10 KB of JS once compressed.
The page itself is written in French, for its French-speaking visitors.

## 🚀 Getting started

Requirements: Node.js 22.12 or later, and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev        # local server with hot reload
```

| Command                        | What it does                                      |
| ------------------------------ | ------------------------------------------------- |
| `pnpm build`                   | Production site in `dist/`                        |
| `pnpm preview`                 | Serves `dist/` locally to check the build         |
| `pnpm test`                    | Unit tests in watch mode                          |
| `pnpm test:ci`                 | Tests with coverage (100% required, file by file) |
| `pnpm test:types`              | Type check of the JavaScript (JSDoc + TypeScript) |
| `pnpm lint` / `pnpm lint:deps` | ESLint / dependency rules (dependency-cruiser)    |
| `pnpm format`                  | Prettier                                          |

## 🗂️ Project structure

```
index.html
src/
  main.js                 entry point: starts the scene, then the avatar
  components/
    scene/                day/night mood, light bulb, visitor choice, special dates
    avatar/               gaze, mood, blinks, pointer tracking
  lib/                    pure functions: sun, calendar, gaze maths
  data/occasions.js       the special dates
  config/                 scene and avatar settings
  assets/css/             one CSS file per part, gathered by main.css
public/                   copied as is: images and .htaccess
outils/                   avatar layer builder (see outils/README.md)
```

Dependencies go one way only: `components` use `lib`, `data` and `config`, never the other way round.

## 🧪 Tests

Every file in `src/` has its Vitest test (`*.test.js`), and the CI requires **100%** coverage of statements, branches, functions and lines, for each file. The sun calculation is checked against the real Paris sunrise and sunset times.

## 🌍 Deployment (Apache shared hosting)

1. `pnpm build`
2. Upload **the content** of `dist/` to the site root, over FTP for instance.
   `.htaccess` is a hidden file: make sure your FTP client uploads it.
3. Check the headers: `curl -sI https://your-domain/`

`.htaccess` has settings to adapt: the HTTPS redirect (commented out) and the HSTS duration.

## 🛡️ Quality and security

- **Git hooks** (Husky): Gitleaks and lint-staged before each commit, commitlint on the message, and before each push the types, lint, dependency rules and tests. Direct pushes to `main` are refused.
- **GitHub CI**: format, lint, dependencies, types, tests with coverage and build, then Gitleaks, `pnpm audit`, Semgrep and OWASP ZAP.
- **Known advisory, no production impact**: `minimatch` < 11.0.1 ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)), moderate. It only comes with the dev tooling: ESLint 10.14 and `eslint-plugin-import-x` 4.17 (both the latest releases) still ask for `minimatch` 10, and the import-x plugin breaks with `minimatch` 11. The flaw needs `optimizationLevel` 2 or more and an attacker-controlled glob; ESLint keeps the default level and only reads the globs of this repository's own config. Nothing from these packages ships to the site. To be removed once both packages accept `minimatch` 11.

## 📜 License

- **Code** (HTML, CSS, JavaScript, configuration, `outils/`): MIT license, see [LICENSE](LICENSE).
- **Images** (`public/img/`): all rights reserved, see [LICENSE-IMAGES](LICENSE-IMAGES).
  The avatar depicts the author: to reuse the code, replace the images with your own (720 × 960 pixels).

---

<div align="center">

Made with ☕ by [Emmanuel Maravilha](https://github.com/manufao) · [LinkedIn](https://fr.linkedin.com/in/emmanuel-maravilha-0a8b053b)

</div>
