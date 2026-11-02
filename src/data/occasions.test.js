import { describe, expect, it } from 'vitest';

import { OCCASIONS } from './occasions.js';

describe('occasions', () => {
	it('should give every entry of OCCASIONS a name, "MM-DD" bounds and an image path', () => {
		// Given
		const monthDay = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

		// When
		const invalid = OCCASIONS.filter(
			({ name, from, to, image }) =>
				!name ||
				!monthDay.test(from) ||
				!monthDay.test(to) ||
				!image?.startsWith('img/occasion-')
		);

		// Then
		expect(invalid).toEqual([]);
	});
});
