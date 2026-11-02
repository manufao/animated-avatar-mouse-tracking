# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- A ready-to-upload `site-v1.0.0.zip` attached to the release, for Apache shared hosting: unzip it at the site root.
- An avatar layer builder in `outils/` to make the layers of your own character.

### Security

- Strict security headers: a Content Security Policy that only allows the site's own files, no framing, no sniffing, no sensor access.
- Every visit lands on `https://emmanuelmaravilha.com/`: `http://` and `www` redirect there permanently.

[1.0.0]: https://github.com/manufao/animated-avatar-mouse-tracking/releases/tag/v1.0.0
