// Special dates, Paris calendar, "MM-DD" inclusive. Ranges may wrap the year.
// First match wins. image: accessory layer on top of the head, same canvas size.

/** @type {readonly import('../lib/calendar.js').Occasion[]} */
export const OCCASIONS = [
	// { name: 'anniversaire', from: 'MM-DD', to: 'MM-DD', image: 'img/occasion-anniversaire.webp' },
	{
		name: 'nouvel-an',
		from: '12-31',
		to: '01-01',
		image: 'img/occasion-nouvel-an.webp'
	},
	{
		name: 'epiphanie',
		from: '01-06',
		to: '01-06',
		image: 'img/occasion-epiphanie.webp'
	},
	{
		name: 'poisson-avril',
		from: '04-01',
		to: '04-01',
		image: 'img/occasion-poisson-avril.webp'
	},
	{
		name: 'fete-musique',
		from: '06-21',
		to: '06-21',
		image: 'img/occasion-fete-musique.webp'
	},
	{
		name: 'fete-nationale',
		from: '07-14',
		to: '07-14',
		image: 'img/occasion-fete-nationale.webp'
	},
	{
		name: 'halloween',
		from: '10-31',
		to: '10-31',
		image: 'img/occasion-halloween.webp'
	},
	{ name: 'noel', from: '12-24', to: '12-25', image: 'img/occasion-noel.webp' }
];
