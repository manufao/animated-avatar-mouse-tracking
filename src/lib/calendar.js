// calendar.js — Paris month-day and special-date lookup. Pure functions.

/**
 * @typedef {object} Occasion
 * @property {string} name exposed as data-occasion on the page root
 * @property {string} from first day, "MM-DD"
 * @property {string} to last day, "MM-DD", inclusive; may wrap the year
 * @property {string} [image] accessory layer on top of the head
 */

/**
 * Reader of the month-day of a date in `timeZone`, e.g. "10-21".
 * The formatter is built once: the scene reads the date every minute.
 * @param {string} timeZone
 * @returns {(date: Date) => string}
 */
export function createMonthDayReader(timeZone) {
	const format = new Intl.DateTimeFormat('en-GB', {
		timeZone,
		month: '2-digit',
		day: '2-digit'
	});
	return (date) => {
		const parts = format.formatToParts(date);
		/** @param {Intl.DateTimeFormatPartTypes} type */
		const get = (type) => parts.find((p) => p.type === type)?.value;
		return `${get('month')}-${get('day')}`;
	};
}

/**
 * First occasion that contains `monthDay`, or null.
 * @param {readonly Occasion[]} occasions
 * @param {string} monthDay "MM-DD"
 * @returns {Occasion | null}
 */
export function findOccasion(occasions, monthDay) {
	return (
		occasions.find(({ from, to }) =>
			from <= to
				? monthDay >= from && monthDay <= to
				: monthDay >= from || monthDay <= to
		) ?? null
	);
}
