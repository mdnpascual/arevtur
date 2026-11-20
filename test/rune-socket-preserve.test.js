const {describe, it} = require('node:test');
const assert = require('node:assert');
const path = require('path');

// ItemData pulls in network/config modules; stub them so only reconstructText is exercised.
const stub = (modulePath, exports) => {
	let resolved = path.resolve(__dirname, modulePath);
	require.cache[resolved] = {id: resolved, filename: resolved, loaded: true, exports};
};
stub('../src/services/apiConstants.js', {});
stub('../src/services/pobApi/pobApi.js', {evalItem: () => Promise.resolve({})});
stub('../src/services/config/configData.js', {config: {version2: true}});

const ItemData = require('../src/services/ItemData');

// minimal stand-in for an ItemData; reconstructText only reads these fields
const item = (overrides = {}) => ({
	version2: true,
	subtype: 'Runeforged Gladiator Armour',
	qualityNumber: 0,
	sockets: [['S', 'S', 'S']],
	runeMods: ["Can roll Soul modifiers", 'Bonded: 3% increased maximum Life'],
	enchantMods: [],
	implicitMods: ['+10 to Strength'],
	fracturedMods: [],
	explicitMods: ['+30 to maximum Life'],
	desecratedMods: [],
	craftedMods: [],
	...overrides,
});
const reconstruct = (data, includeRunesAndAnoint) => ItemData.prototype.reconstructText.call(data, includeRunesAndAnoint).split('\n');

describe('rune-socket-preserve: reconstructText', () => {
	it('craft text (false) marks rune lines for PoE2', () => {
		let lines = reconstruct(item(), false);
		assert.ok(lines.includes('Can roll Soul modifiers (rune)'));
		assert.ok(lines.includes('Bonded: 3% increased maximum Life (rune)'));
	});

	it('craft text puts rune lines after the explicit mods (PoB drops unparsed rune lines before them)', () => {
		let lines = reconstruct(item(), false);
		assert.ok(lines.indexOf('Can roll Soul modifiers (rune)') > lines.indexOf('+30 to maximum Life'));
	});

	it('craft text keeps rune lines before the Corrupted flag', () => {
		let lines = reconstruct(item({corrupted: true}), false);
		assert.ok(lines.indexOf('Can roll Soul modifiers (rune)') < lines.indexOf('Corrupted'));
	});

	it('build text (true) is unchanged: plain rune lines up front, no marker', () => {
		let lines = reconstruct(item(), true);
		assert.deepStrictEqual(lines.slice(4, 6), ['Can roll Soul modifiers', 'Bonded: 3% increased maximum Life']);
		assert.ok(!lines.some(line => line.includes('(rune)')));
	});

	it('PoE1 craft text (false) does not get rune lines', () => {
		let lines = reconstruct(item({version2: false}), false);
		assert.ok(!lines.some(line => line.includes('Can roll Soul')));
	});

	it('item without runes adds nothing', () => {
		let lines = reconstruct(item({runeMods: []}), false);
		assert.ok(!lines.some(line => line.includes('(rune)')));
	});
});
