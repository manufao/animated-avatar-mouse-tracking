// sun.js — sunrise/sunset times from the standard sunrise equation.
// Pure functions, no DOM: easy to test. Accuracy is about one minute.

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440587.5; // Julian day of the Unix epoch
const J2000 = 2451545.0;

/** @param {Date} date */
const toJulian = (date) => date.getTime() / DAY_MS + J1970;
/** @param {number} jd */
const fromJulian = (jd) => new Date((jd - J1970) * DAY_MS);

/**
 * @typedef {{ rise: Date, set: Date, always?: undefined }
 *   | { always: 'day' | 'night' }} SunTimes
 */

/** @typedef {'night' | 'dawn' | 'day' | 'dusk'} Phase */

/**
 * Times when the sun crosses `altitude` degrees on the day of `date` (UTC).
 * altitude: -0.833 for sunrise/sunset, -6 for civil twilight.
 * Returns { rise, set } as Date objects, or { always: 'day' | 'night' }
 * when the sun never crosses that altitude (polar regions).
 * @param {Date} date
 * @param {number} lat degrees, north positive
 * @param {number} lon degrees, east positive
 * @returns {SunTimes}
 */
export function sunTimes(date, lat, lon, altitude = -0.833) {
	// Days since J2000 at local mean noon
	const n = Math.round(toJulian(date) - J2000 - 0.0008 - lon / 360);
	const jStar = n + 0.0008 - lon / 360;

	const M = (357.5291 + 0.98560028 * jStar) % 360; // mean anomaly
	const C =
		1.9148 * Math.sin(M * RAD) +
		0.02 * Math.sin(2 * M * RAD) +
		0.0003 * Math.sin(3 * M * RAD); // equation of center
	const lambda = (M + C + 180 + 102.9372) % 360; // ecliptic longitude
	const transit =
		J2000 +
		jStar +
		0.0053 * Math.sin(M * RAD) -
		0.0069 * Math.sin(2 * lambda * RAD); // solar noon

	const sinDec = Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD);
	const cosDec = Math.cos(Math.asin(sinDec));
	const cosH =
		(Math.sin(altitude * RAD) - Math.sin(lat * RAD) * sinDec) /
		(Math.cos(lat * RAD) * cosDec);

	if (cosH > 1) {
		return { always: 'night' };
	}
	if (cosH < -1) {
		return { always: 'day' };
	}

	const h = Math.acos(cosH) / RAD / 360; // half day length, in days
	return { rise: fromJulian(transit - h), set: fromJulian(transit + h) };
}

/**
 * Light phase: 'night' | 'dawn' | 'day' | 'dusk'.
 * Night: sun more than 6° below the horizon (civil twilight).
 * Dawn: from civil dawn to `goldenMs` after sunrise; dusk: mirror image.
 * In Paris, dawn and dusk last about an hour each.
 * @param {Date} now
 * @param {number} lat
 * @param {number} lon
 * @returns {Phase}
 */
export function phaseAt(now, lat, lon, goldenMs = 30 * 60000) {
	const civil = sunTimes(now, lat, lon, -6);
	if (civil.always) {
		return civil.always;
	}
	const t = now.getTime();
	if (t < civil.rise.getTime() || t > civil.set.getTime()) {
		return 'night';
	}
	// Polar twilight: the sun never rises but the sky is light
	const sun = sunTimes(now, lat, lon);
	if (sun.always) {
		return 'day';
	}
	if (t < sun.rise.getTime() + goldenMs) {
		return 'dawn';
	}
	if (t > sun.set.getTime() - goldenMs) {
		return 'dusk';
	}
	return 'day';
}
