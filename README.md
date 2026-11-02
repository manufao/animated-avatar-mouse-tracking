<div align="center">

<img src="public/img/avatar-static.webp" alt="L'avatar dessiné de l'auteur, chignon et regard curieux" width="220">

# Animated Avatar Mouse Tracking

**Une page « en construction » qui vous regarde.**
Un avatar 2D suit votre souris des yeux, cligne, s'ennuie, bâille…
et vit au rythme du soleil de Paris.

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

## 🎭 Ce qu'il fait

|                                    |                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| 👀 **Il vous suit des yeux**       | Les pupilles et la tête suivent la souris, le doigt, ou le lien qui a le focus au clavier. |
| 😌 **Il cligne des yeux**          | Toutes les 2,5 à 6,5 secondes, au hasard, comme un vrai.                                   |
| 😑 **Il s'ennuie**                 | Huit secondes sans bouger ? Le regard tombe, la mine s'allonge.                            |
| 🥱 **Il bâille**                   | Au bout de vingt secondes, puis de temps en temps. Bougez, il se réveille.                 |
| 😄 **Il réagit au clic**           | Un petit saut de joie.                                                                     |
| 🌅 **Il vit à l'heure de Paris**   | Aube, jour, crépuscule, nuit : les couleurs suivent le vrai soleil parisien.               |
| 💡 **Il a une ampoule**            | La nuit, tirez la chaînette pour allumer la lumière. Le jour, elle se balance pour rien.   |
| 🎉 **Il fête les dates spéciales** | Une couronne à l'Épiphanie, et d'autres accessoires à venir.                               |
| ♿ **Il respecte vos réglages**    | Avec « réduire les animations », l'avatar reste une image fixe.                            |

Aucune bibliothèque à l'exécution : HTML, CSS et JavaScript natifs, environ 10 Ko de JS une fois compressé.

## 🚀 Démarrer

Prérequis : Node.js 22.12 ou plus récent, et [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev        # serveur local avec rechargement automatique
```

| Commande                       | Rôle                                                      |
| ------------------------------ | --------------------------------------------------------- |
| `pnpm build`                   | Site de production dans `dist/`                           |
| `pnpm preview`                 | Sert `dist/` en local pour vérifier le build              |
| `pnpm test`                    | Tests unitaires en mode surveillance                      |
| `pnpm test:ci`                 | Tests et couverture (100 % exigés, fichier par fichier)   |
| `pnpm test:types`              | Vérification des types du JavaScript (JSDoc + TypeScript) |
| `pnpm lint` / `pnpm lint:deps` | ESLint / règles de dépendances (dependency-cruiser)       |
| `pnpm format`                  | Prettier                                                  |

## 🗂️ Structure

```
index.html
src/
  main.js                 point d'entrée : branche la scène puis l'avatar
  components/
    scene/                ambiance jour/nuit, ampoule, choix du visiteur, dates spéciales
    avatar/               regard, humeur, clignements, suivi du pointeur
  lib/                    fonctions pures : soleil, calendrier, calculs du regard
  data/occasions.js       les dates spéciales
  config/                 réglages de la scène et de l'avatar
  assets/css/             un fichier CSS par partie, réunis par main.css
public/                   copié tel quel : images et .htaccess
outils/                   découpe des calques de l'avatar (voir outils/LISEZMOI.md)
```

Les dépendances vont dans un seul sens : `components` utilise `lib`, `data` et `config`, jamais l'inverse.

## 🧪 Tests

Chaque fichier de `src/` a son test Vitest (`*.test.js`), et la CI exige **100 %** de couverture sur les instructions, les branches, les fonctions et les lignes de chaque fichier. Le calcul du soleil est vérifié avec les vraies heures de lever et de coucher à Paris.

## 🌍 Déploiement (hébergement mutualisé Apache)

1. `pnpm build`
2. Envoyer **le contenu** de `dist/` à la racine du site, par FTP par exemple.
   Le fichier `.htaccess` est caché : vérifiez que votre client FTP l'envoie bien.
3. Contrôler les en-têtes : `curl -sI https://votre-domaine/`

Le `.htaccess` contient des réglages à adapter : la redirection HTTPS (commentée) et la durée HSTS.

## 🛡️ Qualité et sécurité

- **Hooks Git** (Husky) : Gitleaks et lint-staged avant chaque commit, commitlint sur le message, et avant chaque push les types, le lint, les règles de dépendances et les tests. Le push direct sur `main` est refusé.
- **CI GitHub** : format, lint, dépendances, types, tests avec couverture, build, puis Gitleaks, `pnpm audit`, Semgrep et OWASP ZAP.
- **Vulnérabilité connue, sans impact en production** : `minimatch` < 11.0.1 ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)), sévérité modérée, tiré par ESLint 10 qui exige `minimatch` ^10. Forcer la version 11 casse ESLint. C'est un outil de développement : rien n'est livré sur le site. À retirer dès qu'une version d'ESLint accepte `minimatch` 11.

## 📜 Licence

- **Code** (HTML, CSS, JavaScript, configuration, `outils/`) : licence MIT, voir [LICENSE](LICENSE).
- **Images** (`public/img/`) : tous droits réservés, voir [LICENSE-IMAGES](LICENSE-IMAGES).
  L'avatar représente l'auteur : pour réutiliser le code, remplacez les images par les vôtres (720 × 960 pixels).

---

<div align="center">

Fait avec ☕ par [Emmanuel Maravilha](https://github.com/manufao) · [LinkedIn](https://fr.linkedin.com/in/emmanuel-maravilha-0a8b053b)

</div>
