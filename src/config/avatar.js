// Avatar behaviour: distances, easing and timings.

export const AVATAR_CONFIG = Object.freeze({
	pupilTravel: 0.85, // share of the free space between pupil and eye edge
	headTiltMax: 4, // max head rotation, in degrees (tall bun: keep it small)
	headShiftMax: 3, // max head translation, in pixels (keeps the neck seam hidden)
	smoothing: 0.12, // 0..1, higher means snappier
	boredSmoothing: 0.04, // lazier eyes when bored
	blinkMin: 2500, // ms between blinks (min)
	blinkMax: 6500, // ms between blinks (max)
	blinkDuration: 140, // ms
	reactDuration: 1000, // ms for the click reaction
	touchRelease: 800, // ms before recentering after a touch
	boredAfter: 8000, // ms without activity before the bored face
	yawnAfter: 20000, // ms without activity before the first yawn
	yawnEveryMin: 25000, // ms between later yawns (min)
	yawnEveryMax: 40000, // ms between later yawns (max)
	yawnDuration: 2400 // ms
});

/** @typedef {typeof AVATAR_CONFIG} AvatarConfig */
