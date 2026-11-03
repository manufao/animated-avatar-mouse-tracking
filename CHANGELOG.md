# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-11-03

### Added

- An AVIF converter in `outils/` that makes the AVIF version of the avatar layers.

### Changed

- The page loads faster: the six avatar pictures are served as AVIF, 37% lighter than WebP (104 KB of pictures instead of 165 KB). Browsers that cannot read AVIF get the WebP pictures, so every visitor still sees the avatar.
- The page title shows the full name, "Emmanuel Maravilha", in the browser tab.

## [1.1.0] - 2026-11-03

### Added

- A favicon: the avatar's face on a round disc, in the browser tab and as the home screen icon of a phone.
- An icon builder in `outils/` that makes the favicon again from the avatar picture.

### Security

- Folder addresses such as `/img/` no longer list their files.
- Browsers now stay on HTTPS for this site for a year (HSTS).

## [1.0.0] - 2026-11-03

First public release, live on [emmanuelmaravilha.com](https://emmanuelmaravilha.com/).

### Added

- An "under construction" page with a 2D avatar whose eyes and head follow the mouse, a finger on a touch screen, or the link that has the keyboard focus.
- The avatar blinks at random, gets bored after eight seconds without activity, yawns after twenty, and wakes up as soon as you move.
- A click on the avatar makes it hop with joy.
- Dawn, day, dusk and night colours that follow the real Paris sun, with buttons to force the day or the night.
- A ceiling light bulb whose chain switches the light on at night, and just swings by day.
- Special dates: the avatar wears a paper crown for Epiphany (January 6).
- With "reduce motion" turned on in the system settings, the avatar stays a still picture.
- A ready-to-upload `site-v1.0.0.zip` attached to the release: unzip it at the site root.
- An avatar layer builder in `outils/` to make the layers of your own character.

### Security

- Strict security headers: a Content Security Policy that only allows the site's own files, no framing, no sniffing, no sensor access.
- Every visit lands on `https://emmanuelmaravilha.com/`: `http://` and `www` redirect there permanently.

[1.2.0]: https://github.com/manufao/animated-avatar-mouse-tracking/releases/tag/v1.2.0
[1.1.0]: https://github.com/manufao/animated-avatar-mouse-tracking/releases/tag/v1.1.0
[1.0.0]: https://github.com/manufao/animated-avatar-mouse-tracking/releases/tag/v1.0.0
