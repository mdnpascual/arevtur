const {describe, it} = require('node:test');
const assert = require('node:assert');
const path = require('path');

const apiConstantsMock = {
	propertyByText: async text => ({id: `mock.${text}`, text}),
	propertyById: async id => ({id, text: id}),
	typeTextToId: async text => text === 'Any' ? undefined : text,
	typeIdToText: async id => id || 'Any',
	sort: {value: {'statgroup.0': 'desc'}, price: {price: 'asc'}},
	nameToItem: async name => name,
	parsePropertyCopyText: async () => null,
};
let apiConstantsPath = path.resolve(__dirname, '../src/services/apiConstants.js');
require.cache[apiConstantsPath] = {id: apiConstantsPath, filename: apiConstantsPath, loaded: true, exports: apiConstantsMock};
let jsDesktopBasePath = require.resolve('js-desktop-base');
require.cache[jsDesktopBasePath] = {id: jsDesktopBasePath, filename: jsDesktopBasePath, loaded: true, exports: {httpRequest: () => {}, XPromise: class {}}};

const UnifiedQueryParams = require('../src/services/UnifiedQueryParams');
const {decodeEmbeddedSearch} = require('../src/util/tradeUrl');

const url = 'https://www.pathofexile.com/trade2/search/poe2/Forbidden%20Rites/H4sIAAAAAAAACqWV3W6bQBCFX6XaawvN_-zwFlEvqyiiNk2QHJxgSBtFvHtF7Ka2xCqVyhUrZj7OWQ6zb-k4NuN0TPVbOjyN3aFPdTq222lovu_bNG_S-PrUpjp9bYehGdvdl5upe2mHtHlvPKb629ufkp9td_8wpk360e3Hdjg963apTt3j077bdmO19NwRqIaZkqdNemn2U7u8_dxdawUcYEqag1TmeXOGtL8uIZaRmUBWGVyZUphlUdfgEgMJiAHNeRViFfqiw3ME0F_ItZtPhVgGNAUA1pIQAXMwEpI1CFXAQozsIZit7EbQSBl0DQJVtpBMSKBuVqaoMzK4rUrBSowY88JyiyLEVURU1QoQFA1Rs0VLCcKOAsAOeR2CxIrZjSwTl74OYQiiIOA6BMKJshG4QTEn_wAJEyINxSKEgUkDLBfsZABVFlIHLApRZwFDi8KWIGYxC1SSYthILGuorYftPScWKu4QZn5B6bcPTf-xJSokpgb_AWFVyySBJTuwtCMam0mBEQ6EjEGF388BxMDJHaMUkk8zrzmrRAhGeAnCi11W99VBABVKDpVAYWEs5vWzlHiI4bJl4IrzfHtR9Nj1qSaEiikzm7jqyfF5PDf97mo23y7dH8tT2d3F-uJ224zt_WF4vTolmuHxMA3V8-k8mDdpaIZuvK7pD_3Ud89Tm-bl-g2-6xKBbgYAAA';

describe('url import base type', () => {
	it('imports the base type from a real URL', async () => {
		let embedded = decodeEmbeddedSearch(url);
		let params = await UnifiedQueryParams.fromApiQueryParams({query: embedded.query || embedded});
		assert.strictEqual(params.name, 'Serrated Quiver');
		assert.strictEqual(params.typeText, 'armour.quiver');
		assert.strictEqual(params.rarity, 'nonunique');
		assert.strictEqual(params.weightEntries.length, 20);
		assert.ok(Math.abs(params.minValue - 210.33) < 0.01);
	});

	it('accepts {option, discriminator} type', async () => {
		let params = await UnifiedQueryParams.fromApiQueryParams(
			{query: {type: {option: 'Serrated Quiver', discriminator: 'x'}}});
		assert.strictEqual(params.name, 'Serrated Quiver');
	});

	it('defaults to empty name', async () => {
		let params = await UnifiedQueryParams.fromApiQueryParams({query: {filters: {}}});
		assert.strictEqual(params.name, '');
	});

	it('uses type, not unique name', async () => {
		let params = await UnifiedQueryParams.fromApiQueryParams(
			{query: {name: 'Bramblejack', type: 'Plate Vest'}});
		assert.strictEqual(params.name, 'Plate Vest');
	});

	it('round trips to the api query', async () => {
		let embedded = decodeEmbeddedSearch(url);
		let params = await UnifiedQueryParams.fromApiQueryParams({query: embedded.query || embedded});
		let api = await params.toApiQueryParams(true);
		assert.strictEqual(api.query.type, 'Serrated Quiver');
	});
});
