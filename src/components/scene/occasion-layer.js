// occasion-layer.js — accessory image on top of the head on special dates.

/** @typedef {import('../../lib/calendar.js').Occasion} Occasion */

/**
 * @param {HTMLElement} root page root: carries data-occasion
 * @param {Element | null} head layer container; no layer without it
 * @returns {(occasion: Occasion | null) => void}
 */
export function createOccasionLayer(root, head) {
	/** @type {HTMLImageElement | null} */
	let layer = null;

	/** @param {Element} parent */
	function createLayer(parent) {
		const img = document.createElement('img');
		img.className = 'occasion';
		img.alt = '';
		img.width = 720;
		img.height = 960;
		// A missing file must not leave a broken image on top of the head
		img.addEventListener('error', () => {
			img.hidden = true;
		});
		parent.append(img);
		return img;
	}

	return (occasion) => {
		if (!occasion) {
			delete root.dataset.occasion;
			if (layer) {
				layer.hidden = true;
			}
			return;
		}
		root.dataset.occasion = occasion.name;
		if (!occasion.image || !head) {
			return;
		}
		layer ??= createLayer(head);
		layer.hidden = false;
		if (layer.getAttribute('src') !== occasion.image) {
			layer.src = occasion.image;
		}
	};
}
